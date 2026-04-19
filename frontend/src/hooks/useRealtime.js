import { useEffect, useCallback } from 'react';
import { Centrifuge } from 'centrifuge';
import { useQueryClient } from '@tanstack/react-query';
import { useMessagingStore } from '@/store/messagingStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export const useRealtime = () => {
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const { setCentrifugoClient, activeConversationId, addMessage } = useMessagingStore();
  const { incrementUnread } = useNotificationStore();

  const handleNewMessage = useCallback((payload) => {
    const { conversationId, message } = payload;
    addMessage(conversationId, message);
    if (conversationId === activeConversationId) {
      queryClient.setQueryData(['messages', conversationId], (oldData) => {
        if (!oldData) return [message];
        if (oldData.find(m => m._id === message._id)) return oldData;
        return [...oldData, message];
      });
    }
  }, [activeConversationId, addMessage, queryClient]);

  const handleNotification = useCallback((payload) => {
    if (payload.userId === user?.userId) {
      incrementUnread();
      queryClient.invalidateQueries(['notifications-unread', user?.userId]);
    }
  }, [user?.userId, incrementUnread, queryClient]);

  useEffect(() => {
    // FIX: Guard all three required values before attempting connection
    if (!accessToken || !user || !import.meta.env.VITE_CENTRIFUGO_URL) {
      console.warn('Centrifugo: skipping connection — missing token, user, or VITE_CENTRIFUGO_URL');
      return;
    }

    let centrifuge;
    try {
      centrifuge = new Centrifuge(import.meta.env.VITE_CENTRIFUGO_URL, {
        token: accessToken,
      });
    } catch (err) {
      console.error('Centrifugo: failed to initialize:', err);
      return;
    }

    centrifuge.on('connected', () => {
      console.log('Centrifugo connected');
    });

    centrifuge.on('disconnected', (ctx) => {
      // FIX: Log reason code — helps debug; does NOT crash the app
      console.warn('Centrifugo disconnected. Code:', ctx.code, '| Reason:', ctx.reason);
    });

    centrifuge.on('error', (err) => {
      // FIX: Catch transport errors gracefully — no unhandled rejection
      console.error('Centrifugo error:', err);
    });

    // Subscribe to personal notification channel
    const subNotification = centrifuge.newSubscription(
      `notifications:${user._id || user.userId}`
    );
    subNotification.on('publication', (ctx) => {
      handleNotification(ctx.data);
    });
    subNotification.on('error', (err) => {
      console.warn('Notification subscription error:', err);
    });
    subNotification.subscribe();

    // Subscribe to active conversation channel if exists
    let subChat = null;
    if (activeConversationId) {
      subChat = centrifuge.newSubscription(`chat:${activeConversationId}`);
      subChat.on('publication', (ctx) => {
        handleNewMessage({ conversationId: activeConversationId, message: ctx.data });
      });
      subChat.on('error', (err) => {
        console.warn('Chat subscription error:', err);
      });
      subChat.subscribe();
    }

    centrifuge.connect();
    setCentrifugoClient(centrifuge);

    return () => {
      // FIX: Safe cleanup — unsubscribe before disconnect
      try { subNotification.unsubscribe(); } catch (_) {}
      try { if (subChat) subChat.unsubscribe(); } catch (_) {}
      try { centrifuge.disconnect(); } catch (_) {}
    };
  }, [user, accessToken, activeConversationId, handleNewMessage, handleNotification, setCentrifugoClient]);
};