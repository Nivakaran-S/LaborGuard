import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/api/notificationApi";
import { useNotificationStore } from "@/store/notificationStore";
import { toast } from "sonner";

/**
 * useNotifications — JWT-based (no userId needed in API calls)
 * Backend extracts userId from the Bearer token automatically.
 */
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  // Fetch all notifications (paginated)
  const useGetNotifications = (params) => {
    return useQuery({
      queryKey: ["notifications", params],
      queryFn: async () => {
        const res = await notificationApi.getNotifications();
        return res.data || [];
      },
    });
  };

  // Fetch unread count for the notification badge
  const useGetUnreadCount = () => {
    return useQuery({
      queryKey: ["notifications-unread"],
      queryFn: async () => {
        const res = await notificationApi.getUnreadCount();
        // Handle both { unreadCount: N } and { data: { count: N } } shapes
        const count = res.data?.unreadCount ?? res.data?.data?.count ?? 0;
        setUnreadCount(count);
        return count;
      },
      refetchInterval: 30000, // Poll every 30 seconds
    });
  };

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    },
  });

  // Delete single notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  return {
    useGetNotifications,
    useGetUnreadCount,
    markAsRead       : markAsReadMutation,
    markAllAsRead    : markAllAsReadMutation,
    deleteNotification: deleteNotificationMutation,
  };
};
