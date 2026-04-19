import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "@/api/messageApi";
import { useMessagingStore } from "@/store/messagingStore";
import { toast } from "sonner";

export const useMessaging = () => {
  const queryClient = useQueryClient();
  const { setActiveConversation } = useMessagingStore();

  // Fetch all conversations for the user
  const useGetConversations = (userId) => {
    return useQuery({
      queryKey: ["conversations", userId],
      queryFn: async () => {
        const res = await messageApi.getConversations(userId);
        return res.data.data || [];
      },
      enabled: !!userId,
    });
  };

  // Fetch all messages for a specific conversation
  const useGetMessages = (conversationId) => {
    return useQuery({
      queryKey: ["messages", conversationId],
      queryFn: async () => {
        const res = await messageApi.getMessages(conversationId);
        return res.data.data || [];
      },
      enabled: !!conversationId,
    });
  };

  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: (data) => messageApi.createConversation(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["conversations"]);
      setActiveConversation(res.data.data._id);
      return res.data.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to start conversation");
    },
  });

  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: (formData) => messageApi.sendMessage(formData),
    onSuccess: (res, { conversationId }) => {
      // Optimistically update is handled in useRealtime or by manual invalidation
      queryClient.invalidateQueries(["messages", conversationId]);
      queryClient.invalidateQueries(["conversations"]);
      return res.data.data;
    },
  });

  // Mark all messages as read in a conversation
  const markAsReadMutation = useMutation({
    mutationFn: ({ conversationId, userId }) => messageApi.markAsRead(conversationId, userId),
    onSuccess: (res, { conversationId }) => {
        queryClient.invalidateQueries(["conversations"]);
        return res.data.data;
    }
  });

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => messageApi.deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries(["messages"]);
      toast.success("Message deleted");
    },
  });

  return {
    useGetConversations,
    useGetMessages,
    createConversation: createConversationMutation,
    sendMessage: sendMessageMutation,
    markAsRead: markAsReadMutation,
    deleteMessage: deleteMessageMutation,
  };
};
