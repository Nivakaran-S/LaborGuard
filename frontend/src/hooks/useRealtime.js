import { useEffect, useCallback, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMessagingStore } from '@/store/messagingStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

// Show each degraded-mode toast at most once per session so users aren't spammed.
const warnedKeys = new Set();
const warnOnce = (key, message, opts = {}) => {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  toast.warning(message, { id: `realtime-${key}`, duration: 6000, ...opts });
};

export const useRealtime = () => {
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const { setCentrifugoClient, activeConversationId, addMessage } = useMessagingStore();
  const { incrementUnread } = useNotificationStore();

  // payload shape from the backend: { type, conversationId, message }
  const handleNewMessage = useCallback((payload) => {
    if (!payload || !payload.message) return;
    const { conversationId, message } = payload;
    addMessage(conversationId, message);
    queryClient.setQueryData(['messages', conversationId], (oldData) => {
      if (!oldData) return [message];
      if (oldData.find(m => m._id === message._id)) return oldData;
      return [...oldData, message];
    });
    // The sidebar shows lastMessage + unread, both of which need a fresh fetch.
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [addMessage, queryClient]);

  const handleNotification = useCallback((payload) => {
    // notification-service sends { type: 'new_notification', notification: {...} }.
    // Older publishes (if any) sent the notification fields at the top level.
    const notification = payload?.notification || payload;
    if (!notification || !notification.userId) return;
    if (notification.userId !== user?.userId) return;

    incrementUnread();
    // Refresh the unread badge + the inbox without waiting for the 30s poll.
    // (queryKey shape mirrors useNotifications.js — invalidate the prefix.)
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [user?.userId, incrementUnread, queryClient]);

  // Track whether we've ever connected this session so we can distinguish
  // "never connected" (silent) from "lost connection mid-session" (toast).
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    // Surface degraded-mode reasons to the user once per session so they
    // understand why messages aren't arriving live.
    if (!user || !accessToken) {
      // Not logged in yet — silent. The user will get realtime when they auth.
      return;
    }
    if (!import.meta.env.VITE_CENTRIFUGO_URL) {
      console.warn('Centrifugo: skipping connection — VITE_CENTRIFUGO_URL not set');
      warnOnce(
        'no-url',
        "Live updates are off — you'll see new messages and notifications after refreshing.",
        { description: 'Real-time service is not configured for this environment.' }
      );
      return;
    }

    let centrifuge;
    try {
      centrifuge = new Centrifuge(import.meta.env.VITE_CENTRIFUGO_URL, {
        token: accessToken,
      });
    } catch (err) {
      console.error('Centrifugo: failed to initialize:', err);
      warnOnce(
        'init-failed',
        "Couldn't start live updates — you'll need to refresh to see new messages.",
        { description: err?.message }
      );
      return;
    }

    centrifuge.on('connected', () => {
      console.log('Centrifugo connected');
      hasConnectedRef.current = true;
      // If we'd previously shown a "lost connection" toast, clear it.
      toast.dismiss('realtime-lost');
      warnedKeys.delete('lost');
    });

    centrifuge.on('disconnected', (ctx) => {
      console.warn('Centrifugo disconnected. Code:', ctx.code, '| Reason:', ctx.reason);
      // Auth failures (codes 3500–3999 in Centrifuge) and "unauthorized" reasons
      // are usually a stale/invalid token — distinct from a transient blip.
      const isAuthFail =
        ctx?.code === 3500 ||
        ctx?.code === 109 ||
        /unauthorized|invalid token|expired/i.test(ctx?.reason || '');

      if (isAuthFail) {
        warnOnce(
          'auth-fail',
          'Live updates are off — your session may have expired. Sign in again to restore real-time.',
        );
      } else if (hasConnectedRef.current) {
        // Lost an established connection — let the user know they're stale.
        warnOnce(
          'lost',
          "Live updates paused — we'll reconnect automatically.",
          { description: ctx?.reason || `Code ${ctx?.code ?? 'unknown'}` }
        );
      }
    });

    centrifuge.on('error', (err) => {
      console.error('Centrifugo error:', err);
      // Only surface to the user if we never managed to connect at all —
      // otherwise the disconnected handler covers it.
      if (!hasConnectedRef.current) {
        warnOnce(
          'transport-error',
          "Live updates aren't available right now — refresh to see new content.",
          { description: err?.message || 'Real-time transport error.' }
        );
      }
    });

    const userId = user.userId || user._id;

    // Personal notification channel
    const subNotification = centrifuge.newSubscription(`notifications:${userId}`);
    subNotification.on('publication', (ctx) => handleNotification(ctx.data));
    subNotification.on('error', (err) => console.warn('Notification subscription error:', err));
    subNotification.subscribe();

    // Personal chat-firehose: every conversation-related event for this user
    // lands here regardless of which conversation is currently open. Without
    // this, a recipient with the messages page closed (or open on a different
    // thread) never saw incoming messages until they manually refreshed.
    const subUser = centrifuge.newSubscription(`user:${userId}`);
    subUser.on('publication', (ctx) => {
      const data = ctx?.data || {};
      if (data.type === 'new_message') {
        handleNewMessage(data);
      }
    });
    subUser.on('error', (err) => console.warn('User-channel subscription error:', err));
    subUser.subscribe();

    // Active conversation channel — fast path for the thread the user is
    // staring at. Same payload shape as user:{userId}.
    let subChat = null;
    if (activeConversationId) {
      subChat = centrifuge.newSubscription(`chat:${activeConversationId}`);
      subChat.on('publication', (ctx) => {
        const data = ctx?.data || {};
        if (data.type === 'new_message') {
          handleNewMessage(data);
        }
      });
      subChat.on('error', (err) => console.warn('Chat subscription error:', err));
      subChat.subscribe();
    }

    centrifuge.connect();
    setCentrifugoClient(centrifuge);

    return () => {
      try { subNotification.unsubscribe(); } catch (_) {}
      try { subUser.unsubscribe(); } catch (_) {}
      try { if (subChat) subChat.unsubscribe(); } catch (_) {}
      try { centrifuge.disconnect(); } catch (_) {}
    };
  }, [user, accessToken, activeConversationId, handleNewMessage, handleNotification, setCentrifugoClient]);
};