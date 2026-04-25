import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { messageApi } from "@/api/messageApi";
import { useRealtime } from "@/hooks/useRealtime";
import { useMessagingStore } from "@/store/messagingStore";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Send, Search, MessageSquare, CheckCheck, ChevronLeft,
  Plus, Loader2, X, Users, UserPlus, Trash2, MoreVertical,
  ImageIcon, Smile, ShieldCheck, Lock, ArrowLeft, Paperclip, FileText
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
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries(["conversations"]);
      // Confirm who the conversation was started with — surfaces the
      // wrong-recipient case (you searched "Niv" and picked the lawyer-named-
      // similarly worker by mistake) before you start typing.
      const target = (vars?.participantInfo &&
        Object.entries(vars.participantInfo)
          .filter(([uid]) => uid !== user.userId)
          .map(([, info]) => info)[0]) || null;
      if (target?.name) {
        toast.success(`Chat started with ${target.name}`, {
          description: target.email ? `${target.email} · ${target.role || "user"}` : target.role,
        });
      }
      onCreated(res.data._id || res.data.data?._id);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Failed to start chat");
    },
  });

  const handleSelect = (selectedUser) => {
    if (selectedUsers.find(u => u.userId === selectedUser.userId)) return;
    setSelectedUsers(prev => [...prev, selectedUser]);
  };

  const handleCreate = () => {
    const participantIds = [user.userId, ...selectedUsers.map(u => u.userId)];
    // Denormalized display info — backend stores this on the Conversation
    // doc so both sides of a 1-1 chat can render real names + email + role
    // without a per-render cross-service call.
    const participantInfo = {};
    const myName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";
    if (user.userId) {
      participantInfo[user.userId] = {
        name: myName,
        email: user.email || "",
        role: user.role || "",
      };
    }
    selectedUsers.forEach((u) => {
      if (u.userId) {
        participantInfo[u.userId] = {
          name: u.name || u.email || "",
          email: u.email || "",
          role: u.role || "",
        };
      }
    });
    createMutation.mutate({
      participants: participantIds,
      isGroup: mode === "group",
      groupName: mode === "group" ? groupName : "",
      participantInfo,
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
  const [pendingFiles, setPendingFiles] = useState([]); // File[] queued for next send
  const [lightbox, setLightbox] = useState(null); // { url, name } | null
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useRealtime();

  // ── Conversations list ──────────────────────────────────────────────────────
  // refetchInterval is a Centrifugo-failure safety net — if real-time is down,
  // the sidebar still picks up new messages within 15s.
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await messageApi.getConversations();
      return res.data || [];
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  // ── Messages for active conversation ───────────────────────────────────────
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: async () => {
      const res = await messageApi.getMessages(activeConversationId);
      return res.data || [];
    },
    enabled: !!activeConversationId,
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
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
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Failed to send");
    },
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

  // ── Open / create chat when navigated with ?userId=XYZ ──────────────────────
  // The Profile page's "Message" button hits /messages?userId=XYZ. Without
  // this effect, ChatPage just landed on an empty inbox and the user had to
  // click "+" and search again — which is what they reported.
  const location = useLocation();
  const targetUserId = searchParams.get("userId");
  const targetState = location.state || {};
  const targetHandledRef = useRef(false);

  const openOrCreateMutation = useMutation({
    mutationFn: (data) => messageApi.createConversation(data),
    onSuccess: (res) => {
      const id = res.data._id || res.data.data?._id;
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (id) setActiveConversation(id);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Couldn't open chat");
    },
  });

  useEffect(() => {
    if (!targetUserId || targetHandledRef.current) return;
    if (!user?.userId || convsLoading) return;        // wait for auth + list
    if (targetUserId === user.userId) {                // tried to chat with yourself
      targetHandledRef.current = true;
      navigate("/messages", { replace: true });
      return;
    }

    // 1) existing 1-1 conversation? open it.
    const existing = conversations.find((c) =>
      !c.isGroup &&
      Array.isArray(c.participants) &&
      c.participants.length === 2 &&
      c.participants.includes(targetUserId) &&
      c.participants.includes(user.userId)
    );
    if (existing) {
      targetHandledRef.current = true;
      setActiveConversation(existing._id);
      navigate("/messages", { replace: true });
      return;
    }

    // 2) create a new one. Use whatever profile info the caller passed via
    // location.state (UserProfilePage sets this when you click Message),
    // otherwise create with minimal info — receiver still sees the message,
    // just with a placeholder name until participantInfo is filled in later.
    targetHandledRef.current = true;
    const myName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";
    const participantInfo = {
      [user.userId]: { name: myName, email: user.email || "", role: user.role || "" },
      [targetUserId]: {
        name: targetState.name || "",
        email: targetState.email || "",
        role: targetState.role || "",
      },
    };
    openOrCreateMutation.mutate({
      participants: [user.userId, targetUserId],
      isGroup: false,
      participantInfo,
    });
    navigate("/messages", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, user?.userId, conversations, convsLoading]);

  // ── Send on Enter ──────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!activeConversationId || sendMutation.isPending) return;
    if (!newMessage.trim() && pendingFiles.length === 0) return;
    sendMutation.mutate({
      conversationId: activeConversationId,
      content: newMessage.trim(),
      files: pendingFiles,
    });
    setPendingFiles([]);
  };

  const onFilesPicked = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Cap at 10 (matches backend) and 50 MB each.
    const valid = [];
    for (const f of files) {
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name} is over 50 MB`);
        continue;
      }
      valid.push(f);
    }
    setPendingFiles((prev) => [...prev, ...valid].slice(0, 10));
    // Reset so picking the same file twice still triggers onChange
    e.target.value = "";
  };

  const removePendingFile = (idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const currentConv = conversations.find(c => c._id === activeConversationId);

  const getConvDisplayName = (conv) => {
    if (!conv) return "";
    if (conv.isGroup) return conv.groupName || "Group Chat";
    const otherId = conv.participants?.find(p => p !== user?.userId);
    if (!otherId) return "Unknown user";
    // Backend stores per-user display info on the conversation doc since the
    // recent "best fix" — fall back to a short id if a legacy conversation
    // pre-dated the field.
    const info = conv.participantInfo?.[otherId];
    return info?.name || conv.participantNames?.[otherId] || `User ${otherId.slice(-6)}`;
  };

  const getConvRole = (conv) => {
    if (!conv || conv.isGroup) return "";
    const otherId = conv.participants?.find(p => p !== user?.userId);
    return conv.participantInfo?.[otherId]?.role || "";
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
              const role = getConvRole(conv);
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
                      <p className={cn("text-sm font-black truncate flex items-center gap-1.5", isActive ? "text-teal-700" : "text-slate-800")}>
                        <span className="truncate">{name}</span>
                        {role && (
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0",
                            ROLE_COLORS[role] || ROLE_COLORS.worker
                          )}>
                            {role}
                          </span>
                        )}
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
                  // Backward compat: older messages have only mediaUrls; newer
                  // ones carry rich metadata in attachments[].
                  const attachments = Array.isArray(msg.attachments) && msg.attachments.length > 0
                    ? msg.attachments
                    : Array.isArray(msg.mediaUrls)
                      ? msg.mediaUrls.map((url) => ({ url, type: 'image', name: '', mimeType: '', size: 0 }))
                      : [];
                  const images = attachments.filter((a) => a.type === 'image');
                  const videos = attachments.filter((a) => a.type === 'video');
                  const audios = attachments.filter((a) => a.type === 'audio');
                  const files  = attachments.filter((a) => !['image', 'video', 'audio'].includes(a.type));

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
                      <div className={cn("max-w-[75%] space-y-1.5 relative", isMe ? "items-end" : "items-start")}>
                        {/* Image grid — first attachment type */}
                        {images.length > 0 && (
                          <div className={cn(
                            "grid gap-1 rounded-2xl overflow-hidden",
                            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                          )}>
                            {images.slice(0, 4).map((a, i) => (
                              <button
                                type="button"
                                key={i}
                                onClick={() => setLightbox({ url: a.url, name: a.name })}
                                className="relative bg-slate-100 aspect-square overflow-hidden hover:opacity-90 transition-opacity"
                              >
                                <img src={a.url} alt={a.name || `image ${i + 1}`} className="w-full h-full object-cover" />
                                {i === 3 && images.length > 4 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-black text-lg">
                                    +{images.length - 4}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Videos */}
                        {videos.map((a, i) => (
                          <video
                            key={`v-${i}`}
                            src={a.url}
                            controls
                            className="rounded-2xl max-w-full max-h-80 bg-black"
                            preload="metadata"
                          />
                        ))}

                        {/* Audio */}
                        {audios.map((a, i) => (
                          <div key={`a-${i}`} className={cn(
                            "rounded-2xl px-3 py-2 border",
                            isMe ? "bg-teal-500 border-teal-600" : "bg-white border-slate-100"
                          )}>
                            <audio src={a.url} controls className="w-64 max-w-full" />
                          </div>
                        ))}

                        {/* Generic files (PDF, doc, zip, etc.) */}
                        {files.map((a, i) => (
                          <a
                            key={`f-${i}`}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={a.name || undefined}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl px-3 py-2.5 border transition-colors",
                              isMe
                                ? "bg-teal-500 border-teal-600 text-white hover:bg-teal-600"
                                : "bg-white border-slate-100 text-slate-800 hover:bg-slate-50"
                            )}
                          >
                            <div className={cn(
                              "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
                              isMe ? "bg-white/20" : "bg-teal-50 text-teal-600"
                            )}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{a.name || "Attachment"}</p>
                              <p className={cn("text-[10px] font-medium uppercase tracking-wider", isMe ? "text-white/80" : "text-slate-400")}>
                                {a.mimeType?.split('/')[1] || 'file'}{a.size ? ` · ${formatBytes(a.size)}` : ''}
                              </p>
                            </div>
                          </a>
                        ))}

                        {/* Text content (only render the bubble if there's text) */}
                        {msg.content && (
                          <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap break-words",
                            isMe
                              ? "bg-teal-500 text-white rounded-br-sm shadow-sm"
                              : "bg-white text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm"
                          )}>
                            {msg.content}
                          </div>
                        )}

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
              {/* Pending attachments preview */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingFiles.map((f, i) => {
                    const isImage = f.type.startsWith("image/");
                    const previewUrl = isImage ? URL.createObjectURL(f) : null;
                    return (
                      <div
                        key={`${f.name}-${i}`}
                        className="relative group flex items-center gap-2 bg-slate-100 rounded-xl pl-2 pr-8 py-1.5 max-w-[220px]"
                      >
                        {isImage ? (
                          <img
                            src={previewUrl}
                            alt={f.name}
                            className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{f.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{formatBytes(f.size)}</p>
                        </div>
                        <button
                          onClick={() => removePendingFile(i)}
                          className="absolute right-1.5 top-1.5 h-5 w-5 rounded-full bg-slate-300 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={onFilesPicked}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={onFilesPicked}
              />

              <div className="flex items-end gap-2 bg-slate-100 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-teal-200 focus-within:bg-white transition-all">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  title="Attach photos / videos"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingFiles.length ? "Add a caption..." : "Type a message..."}
                  rows={1}
                  className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none py-1.5 max-h-24"
                  style={{ minHeight: "36px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={(!newMessage.trim() && pendingFiles.length === 0) || sendMutation.isPending}
                  className={cn(
                    "h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-all",
                    (newMessage.trim() || pendingFiles.length > 0)
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

      {/* Image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.name || "Preview"}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightbox.url}
            target="_blank"
            rel="noopener noreferrer"
            download={lightbox.name || undefined}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-colors"
          >
            Open original
          </a>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
