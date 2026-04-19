import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  ShieldCheck, Trash2, Flag, Link2, CheckCircle2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

/**
 * CommunityPostCard — Instagram-style post card.
 *
 * Props:
 *   post        — backend Post document (with authorName, authorAvatar, likes[], commentCount, shareCount)
 *   onLike      — (postId) => void
 *   onComment   — (post) => void   — opens comment thread
 *   onShare     — (postId) => void
 *   onBookmark  — (postId) => void
 *   onDelete    — (postId) => void
 *   onReport    — (postId) => void
 *   isBookmarked — boolean
 */
const CommunityPostCard = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
  onReport,
  onVote,
  isBookmarked = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userHasVoted = post.poll?.options?.some((o) => o.votes?.includes(user?.userId));
  const [showMenu, setShowMenu] = useState(false);
  const [liked,    setLiked]    = useState(post.likes?.includes(user?.userId));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [shareFlash, setShareFlash] = useState(false);

  const isOwner = post.authorId === user?.userId;

  const authorName   = post.authorName   || `Citizen ${post.authorId?.slice(-4) || ''}`;
  const authorAvatar = post.authorAvatar || "";
  const authorInitial = authorName.charAt(0).toUpperCase();

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    onLike?.(post._id);
  };

  const handleBookmark = () => {
    setBookmarked((b) => !b);
    onBookmark?.(post._id);
  };

  const handleShare = () => {
    setShareFlash(true);
    setTimeout(() => setShareFlash(false), 1500);
    onShare?.(post._id);
    // Copy link to clipboard
    navigator.clipboard?.writeText?.(`${window.location.origin}/community?post=${post._id}`).catch(() => {});
  };

  return (
    <article className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-teal-100">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-sm">
                {authorInitial}
              </AvatarFallback>
            </Avatar>
            {post.authorRole === "lawyer" && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                <ShieldCheck className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-900 leading-tight">{authorName}</p>
              {post.authorRole === "lawyer" && (
                <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase tracking-wider px-1.5 py-0">
                  Legal
                </Badge>
              )}
              {post.authorRole === "ngo_representative" && (
                <Badge className="bg-purple-50 text-purple-600 border-none text-[9px] font-black uppercase tracking-wider px-1.5 py-0">
                  NGO
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{timeAgo}</p>
          </div>
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-100 shadow-xl z-20 overflow-hidden">
              <button
                onClick={() => { handleShare(); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 text-left"
              >
                <Link2 className="h-3.5 w-3.5" /> Copy Link
              </button>
              {isOwner && (
                <button
                  onClick={() => { onDelete?.(post._id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Post
                </button>
              )}
              {!isOwner && (
                <button
                  onClick={() => { onReport?.(post._id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-orange-500 hover:bg-orange-50 text-left"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Hashtags ─────────────────────────────────────────────────── */}
      {post.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {post.hashtags.slice(0, 4).map((tag, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(`/community/explore?tag=${encodeURIComponent(tag)}`)}
              className="text-[11px] font-bold text-teal-600 hover:text-teal-800 cursor-pointer transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* ─── Media ────────────────────────────────────────────────────── */}
      {post.mediaUrls?.length > 0 && (
        <div className={cn(
          "w-full overflow-hidden",
          post.mediaUrls.length === 1 ? "aspect-square" : "grid grid-cols-2 gap-0.5"
        )}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <div key={i} className={cn("relative overflow-hidden bg-slate-100", post.mediaUrls.length === 1 && "aspect-square")}>
              <img
                src={url}
                alt={`Post image ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              {i === 3 && post.mediaUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-black text-xl">+{post.mediaUrls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Content ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap line-clamp-4">
          {post.content}
        </p>
      </div>

      {/* ─── Poll ─────────────────────────────────────────────────────── */}
      {post.poll?.options?.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{post.poll.question}</p>
          {post.poll.options.map((opt, i) => {
            const totalVotes = post.poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
            const pct = totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;
            const selected = opt.votes?.includes(user?.userId);
            return (
              <button
                key={i}
                type="button"
                onClick={() => !userHasVoted && onVote?.(post._id, i)}
                disabled={userHasVoted}
                className={cn(
                  "relative h-9 w-full rounded-lg bg-slate-100 overflow-hidden text-left",
                  userHasVoted ? "cursor-default" : "cursor-pointer hover:bg-slate-200 transition-colors",
                  selected && "ring-2 ring-teal-500"
                )}
              >
                <div className="absolute inset-y-0 left-0 bg-teal-100 transition-all duration-700" style={{ width: `${pct}%` }} />
                <div className="relative z-10 flex items-center justify-between h-full px-3">
                  <span className="text-xs font-bold text-slate-700">{opt.text}</span>
                  <span className="text-xs font-black text-teal-700">{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Action Bar ───────────────────────────────────────────────── */}
      <div className="px-4 pb-3 pt-1 flex items-center justify-between border-t border-slate-50">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-all duration-200 group-hover:scale-110",
                liked ? "fill-red-500 text-red-500" : "text-slate-400 group-hover:text-red-400"
              )}
            />
            <span className={cn("text-xs font-bold", liked ? "text-red-500" : "text-slate-500")}>
              {likeCount}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => onComment?.(post)}
            className="flex items-center gap-1.5 group"
          >
            <MessageCircle className="h-5 w-5 text-slate-400 group-hover:text-teal-500 transition-colors group-hover:scale-110 duration-200" />
            <span className="text-xs font-bold text-slate-500">{post.commentCount || 0}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 group"
          >
            {shareFlash ? (
              <CheckCircle2 className="h-5 w-5 text-teal-500" />
            ) : (
              <Share2 className="h-5 w-5 text-slate-400 group-hover:text-teal-500 transition-colors group-hover:scale-110 duration-200" />
            )}
            <span className="text-xs font-bold text-slate-500">{post.shareCount || 0}</span>
          </button>
        </div>

        {/* Bookmark */}
        <button onClick={handleBookmark} className="group">
          <Bookmark
            className={cn(
              "h-5 w-5 transition-all duration-200 group-hover:scale-110",
              bookmarked ? "fill-teal-500 text-teal-500" : "text-slate-400 group-hover:text-teal-400"
            )}
          />
        </button>
      </div>

      {/* ─── Like summary ─────────────────────────────────────────────── */}
      {likeCount > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-bold text-slate-700">{likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}</p>
        </div>
      )}

      {/* Click-away to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      )}
    </article>
  );
};

export { CommunityPostCard };
