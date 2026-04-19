import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "@/api/messageApi";
import { useRealtime } from "@/hooks/useRealtime";
import { useMessagingStore } from "@/store/messagingStore";
import { useSearchParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Send, Search, MessageSquare, CheckCheck, ChevronLeft,
  Plus, Loader2, X, Users, UserPlus, Trash2, MoreVertical,
  ImageIcon, Smile, ShieldCheck, Lock, ArrowLeft
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

const getInitial = (name) => (name || "?").charAt(0).toUpperCase();
const timeAgo = (date) => {
  if (!date) return "";
  try { return formatDistanceToNow(new Date(date), { addSuffix: false }); } catch { return ""; }
};
const timeOfDay = (date) => {
  if (!date) return "";
  try { return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
};

const ROLE_COLORS = {
  worker: "bg-teal-50 text-teal-700",
  lawyer: "bg-blue-50 text-blue-700",
  ngo_representative: "bg-purple-50 text-purple-700",
  employer: "bg-orange-50 text-orange-700",
  admin: "bg-slate-100 text-slate-600",
};

// ── User Search Dropdown ──────────────────────────────────────────────────────

const UserSearchDropdown = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await messageApi.searchUsers(q);
      setResults(res.data?.data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2.5">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={handleChange}
          placeholder="Search by name or email..."
          className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin flex-shrink-0" />}
      </div>
      {results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.userId}
              onClick={() => { onSelect(u); setQuery(""); setResults([]); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={u.avatarUrl} />
                <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-sm">
                  {getInitial(u.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full", ROLE_COLORS[u.role] || ROLE_COLORS.worker)}>
                {u.role}
              </span>
            </button>
          ))}
        </div>
      )}
      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 text-center">
          <p className="text-xs font-bold text-slate-400">No users found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

// ── New Conversation Modal ────────────────────────────────────────────────────

const NewConversationModal = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState("direct"); // "direct" | "group"
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => messageApi.createConversation(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["conversations"]);
      onCreated(res.data._id || res.data.data?._id);
    }
  });

  const handleSelect = (selectedUser) => {
    if (selectedUsers.find(u => u.userId === selectedUser.userId)) return;
    setSelectedUsers(prev => [...prev, selectedUser]);
  };

  const handleCreate = () => {
    const participantIds = [user.userId, ...selectedUsers.map(u => u.userId)];
    createMutation.mutate({
      participants: participantIds,
      isGroup: mode === "group",
      groupName: mode === "group" ? groupName : ""
    });
  };

  const canCreate = selectedUsers.length > 0 && (mode === "direct" || (mode === "group" && groupName.trim()));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-900 text-base">New Conversation</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
            {[{ id: "direct", icon: UserPlus, label: "Direct" }, { id: "group", icon: Users, label: "Group" }].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setMode(id)}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all",
                  mode === id ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Group name */}
          {mode === "group" && (
            <input
              placeholder="Group name (required)"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full bg-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          )}

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(u => (
                <div key={u.userId} className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-bold">
                  {u.name}
                  <button onClick={() => setSelectedUsers(prev => prev.filter(x => x.userId !== u.userId))}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          {(mode === "group" || selectedUsers.length === 0) && (
            <UserSearchDropdown onSelect={handleSelect} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wide text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || createMutation.isPending}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
              canCreate ? "bg-teal-500 text-white hover:bg-teal-600 shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed")}
          >
            {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
            {mode === "group" ? "Create Group" : "Start Chat"}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Main ChatPage ─────────────────────────────────────────────────────────────

const ChatPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activeConversationId, setActiveConversation } = useMessagingStore();
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useRealtime();

  // ── Conversations list ──────────────────────────────────────────────────────
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await messageApi.getConversations();
      return res.data || [];
    }
  });

  // ── Messages for active conversation ───────────────────────────────────────
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: async () => {
      const res = await messageApi.getMessages(activeConversationId);
      return res.data || [];
    },
    enabled: !!activeConversationId,
  });

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (data) => messageApi.sendMessage(data),
    onSuccess: (res) => {
      queryClient.setQueryData(["messages", activeConversationId], (old = []) => {
        const msg = res.data;
        if (old.find(m => m._id === msg._id)) return old;
        return [...old, msg];
      });
      queryClient.invalidateQueries(["conversations"]);
      setNewMessage("");
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  });

  // ── Delete message ─────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (messageId) => messageApi.deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(["messages", activeConversationId], (old = []) =>
        old.filter(m => m._id !== messageId)
      );
      setDeletingId(null);
    }
  });

  // ── Mark as read when opening conversation ──────────────────────────────────
  useEffect(() => {
    if (activeConversationId) {
      messageApi.markAsRead(activeConversationId).catch(() => {});
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "auto" }), 100);
    }
  }, [activeConversationId]);

  // ── Auto-focus input when conversation opens ────────────────────────────────
  useEffect(() => {
    if (activeConversationId) inputRef.current?.focus();
  }, [activeConversationId]);

  // ── Send on Enter ──────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversationId || sendMutation.isPending) return;
    sendMutation.mutate({ conversationId: activeConversationId, content: newMessage.trim() });
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const currentConv = conversations.find(c => c._id === activeConversationId);

  const getConvDisplayName = (conv) => {
    if (!conv) return "";
    if (conv.isGroup) return conv.groupName || "Group Chat";
    // Participants are stored as userId strings — show shortened ID as fallback
    const otherId = conv.participants?.find(p => p !== user?.userId);
    if (!otherId) return "Unknown user";
    return conv.participantNames?.[otherId] || `User ${otherId.slice(-6)}`;
  };

  const getConvInitial = (conv) => getConvDisplayName(conv).charAt(0).toUpperCase();

  const filteredConvs = conversations.filter(conv => {
    if (!searchTerm) return true;
    const name = getConvDisplayName(conv).toLowerCase();
    const last = (conv.lastMessage?.content || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || last.includes(searchTerm.toLowerCase());
  });

  const displayName = getConvDisplayName(currentConv);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* ── Left Sidebar ────────────────────────────────────────────────── */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-white",
        activeConversationId ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Messages</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-sm"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-50">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Spinner size="md" />
              <p className="text-xs font-bold text-slate-400">Loading...</p>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 p-6 text-center">
              <MessageSquare className="h-10 w-10 text-slate-200" />
              <div>
                <p className="text-sm font-black text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Press <span className="font-bold text-teal-600">+</span> to start chatting with anyone
                </p>
              </div>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isActive = activeConversationId === conv._id;
              const name = getConvDisplayName(conv);
              const lastMsg = conv.lastMessage?.content || "No messages yet";
              const lastTime = conv.lastMessage?.timestamp ? timeAgo(conv.lastMessage.timestamp) : "";
              const unreadCount = conv.unreadCount || 0;

              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversation(conv._id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-slate-50",
                    isActive ? "bg-teal-50 border-l-2 border-l-teal-500" : "hover:bg-slate-50"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={cn(
                        "font-black text-sm",
                        conv.isGroup ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"
                      )}>
                        {conv.isGroup ? <Users className="h-5 w-5" /> : getConvInitial(conv)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator (static green dot) */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className={cn("text-sm font-black truncate", isActive ? "text-teal-700" : "text-slate-800")}>
                        {name}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">{lastTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-400 font-medium truncate flex-1">{lastMsg}</p>
                      {unreadCount > 0 && !isActive && (
                        <span className="ml-2 h-5 min-w-5 flex-shrink-0 flex items-center justify-center bg-teal-500 text-white text-[9px] font-black rounded-full px-1.5">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Encryption badge */}
        <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-center gap-1.5">
          <Lock className="h-3 w-3 text-green-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">End-to-End Encrypted</span>
        </div>
      </div>

      {/* ── Chat Area ──────────────────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col",
        !activeConversationId ? "hidden md:flex" : "flex"
      )}>
        {activeConversationId && currentConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 bg-white">
              <button
                onClick={() => setActiveConversation(null)}
                className="md:hidden h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={cn("font-black text-sm", currentConv?.isGroup ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700")}>
                    {currentConv?.isGroup ? <Users className="h-5 w-5" /> : getConvInitial(currentConv)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm">{displayName}</h2>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Online</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black tracking-widest uppercase px-2 py-0.5">
                  <ShieldCheck className="h-2.5 w-2.5 mr-1 text-green-500" />E2E
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-slate-50/50">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner size="lg" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-200" />
                  <p className="text-sm font-black text-slate-400">No messages yet</p>
                  <p className="text-xs text-slate-300 font-medium">Say hello to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.userId;
                  return (
                    <div
                      key={msg._id}
                      className={cn("flex items-end gap-2 group", isMe ? "justify-end" : "justify-start")}
                    >
                      {!isMe && (
                        <Avatar className="h-7 w-7 flex-shrink-0 mb-1">
                          <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px] font-black">
                            {getInitial(msg.senderName || msg.senderId)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("max-w-[70%] space-y-1", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed relative",
                          isMe
                            ? "bg-teal-500 text-white rounded-br-sm shadow-sm"
                            : "bg-white text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm"
                        )}>
                          {msg.content}
                          {/* Delete button on hover (own messages only) */}
                          {isMe && (
                            <button
                              onClick={() => setDeletingId(msg._id)}
                              className="absolute -top-2 -left-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <div className={cn("flex items-center gap-1", isMe ? "justify-end" : "justify-start")}>
                          <span className="text-[9px] font-bold text-slate-400">{timeOfDay(msg.createdAt)}</span>
                          {isMe && <CheckCheck className="h-3 w-3 text-teal-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input area */}
            <div className="px-5 py-4 border-t border-slate-100 bg-white">
              <div className="flex items-end gap-3 bg-slate-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-teal-200 focus-within:bg-white transition-all">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none py-1.5 max-h-24"
                  style={{ minHeight: "36px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className={cn(
                    "h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-all",
                    newMessage.trim()
                      ? "bg-teal-500 text-white hover:bg-teal-600 shadow-sm"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {sendMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </button>
              </div>
              <p className="text-center text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-widest">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-12">
            <div className="h-24 w-24 rounded-3xl bg-teal-50 flex items-center justify-center">
              <MessageSquare className="h-12 w-12 text-teal-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">Your Messages</h3>
              <p className="text-sm font-medium text-slate-400 max-w-xs">
                Send private messages to workers, legal officers, NGOs, and employers.
              </p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-full text-sm font-black uppercase tracking-wide hover:bg-teal-600 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4" /> New Conversation
            </button>
            <div className="flex items-center gap-2 text-green-600">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-bold">End-to-end encrypted</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={(id) => {
            setShowNewModal(false);
            setActiveConversation(id);
          }}
        />
      )}

      {/* Delete confirm */}
      {deletingId && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDeletingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 shadow-2xl text-center w-72 animate-in zoom-in-95">
            <Trash2 className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="font-black text-slate-800 mb-1">Delete message?</p>
            <p className="text-xs text-slate-400 mb-4">This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wide text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-wide hover:bg-red-600 transition-colors"
              >
                {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;
