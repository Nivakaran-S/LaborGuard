import { useState, useRef, useEffect } from "react";
import { Send, X, Trash2, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Spinner } from "@/components/common/Spinner";
import { useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * CommentThread — Slide-up panel showing post detail + comments.
 * Closes when clicking the backdrop or the X button.
 */
const CommentThread = ({ post, onClose }) => {
  const { user } = useAuth();
  const { useGetComments, addComment, deleteComment } = useCommunity();
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  const { data: comments = [], isLoading } = useGetComments(post?._id);

  useEffect(() => {
    if (post) {
      inputRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [post]);

  if (!post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment.mutate({ postId: post._id, content: text.trim() });
    setText("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl md:bottom-6 z-50 bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300">
        {/* Handle + Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 rounded-full bg-slate-200 md:hidden mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <MessageCircleIcon className="h-5 w-5 text-teal-600" />
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
              Comments
              {comments.length > 0 && (
                <span className="ml-2 text-teal-600">({comments.length})</span>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Post preview */}
        <div className="px-5 py-3 border-b border-slate-50 flex-shrink-0">
          <p className="text-sm text-slate-700 font-medium line-clamp-2">{post.content}</p>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm font-bold text-slate-400">No comments yet</p>
              <p className="text-xs text-slate-300 font-medium">Be the first to say something</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isOwner = comment.authorId === user?.userId;
              const timeAgo = comment.createdAt
                ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                : "";
              const initial = (comment.authorName || comment.authorId || "?").charAt(0).toUpperCase();

              return (
                <div key={comment._id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-black">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 rounded-2xl px-3.5 py-2.5">
                      <p className="text-xs font-black text-slate-700 mb-0.5">
                        {comment.authorName || `Citizen ${comment.authorId?.slice(-4)}`}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-1">
                      <span className="text-[10px] text-slate-400 font-medium">{timeAgo}</span>
                      {isOwner && (
                        <button
                          onClick={() => deleteComment.mutate({ commentId: comment._id, postId: post._id })}
                          className="text-[10px] text-red-400 font-bold hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-white"
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-teal-100 text-teal-700 font-black text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-slate-100 rounded-full px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all"
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center transition-all",
              text.trim()
                ? "bg-teal-500 text-white hover:bg-teal-600 shadow-md"
                : "bg-slate-100 text-slate-300"
            )}
          >
            {addComment.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </>
  );
};

// Inline icon component to avoid import issues
const MessageCircleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export { CommentThread };
