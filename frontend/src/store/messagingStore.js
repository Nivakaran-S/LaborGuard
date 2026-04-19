import { create } from 'zustand';

export const useMessagingStore = create((set, get) => ({
  activeConversationId: null,
  conversations: [],
  centrifugoClient: null,
  
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  setConversations: (conversations) => set({ conversations }),
  
  addMessage: (conversationId, message) => {
    const { conversations } = get();
    const updatedConversations = conversations.map((conv) => {
      if (conv._id === conversationId) {
        return {
          ...conv,
          lastMessage: message,
          updatedAt: new Date().toISOString(),
        };
      }
      return conv;
    });
    
    // Sort conversations by latest message/updatedAt
    updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    set({ conversations: updatedConversations });
  },
  
  setCentrifugoClient: (client) => set({ centrifugoClient: client }),
  
  // Update unread count for a specific conversation
  markAsRead: (conversationId) => {
    const { conversations } = get();
    const updatedConversations = conversations.map((conv) => {
      if (conv._id === conversationId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  }
}));
