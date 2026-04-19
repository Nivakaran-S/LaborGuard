import { useState } from "react";
import { Bell, CheckCheck, Trash2, MessageSquare, FileText, Users, ChevronLeft, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Spinner } from "@/components/common/Spinner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG = {
  message: {
    icon: MessageSquare,
    color: "bg-blue-50 text-blue-600",
    label: "Message",
  },
  complaint: {
    icon: FileText,
    color: "bg-amber-50 text-amber-600",
    label: "Complaint",
  },
  community: {
    icon: Users,
    color: "bg-teal-50 text-teal-600",
    label: "Community",
  },
  system: {
    icon: Bell,
    color: "bg-slate-100 text-slate-500",
    label: "System",
  },
};

const TYPE_FILTERS = ["all", "message", "complaint", "community", "system"];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const { useGetNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { data: notifications = [], isLoading } = useGetNotifications();

  const filtered = activeFilter === "all"
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Bell className="h-5 w-5 text-teal-600" />
          <h1 className="text-lg font-black text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-teal-500 text-white text-[10px] font-black rounded-full">
              {unreadCount} new
            </span>
          )}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors text-xs font-black uppercase tracking-wide"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all",
                  activeFilter === f
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {f === "all" ? "All" : TYPE_CONFIG[f]?.label || f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 flex flex-col items-center text-center space-y-3">
            <Bell className="h-12 w-12 text-slate-200" />
            <p className="font-black text-slate-600 text-lg">
              {activeFilter === "all" ? "No notifications" : `No ${activeFilter} notifications`}
            </p>
            <p className="text-sm text-slate-400 font-medium max-w-xs">
              You're all caught up! Notifications about complaints, messages, and community activity appear here.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const Icon = config.icon;
            const timeAgo = n.createdAt
              ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
              : "";

            return (
              <div
                key={n._id}
                onClick={() => { if (!n.isRead) markAsRead.mutate(n._id); }}
                className={cn(
                  "bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition-all group",
                  !n.isRead && "border-l-4 border-l-teal-400 bg-teal-50/30"
                )}
              >
                {/* Icon */}
                <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0", config.color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-bold leading-tight", !n.isRead ? "text-slate-900" : "text-slate-700")}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <div className="h-2 w-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{n.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn("text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full", config.color)}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold">{timeAgo}</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(n._id); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
