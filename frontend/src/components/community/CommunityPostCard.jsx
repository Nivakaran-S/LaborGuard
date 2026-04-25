import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  ShieldCheck, Trash2, Flag, Link2, CheckCircle2, Pencil, ChevronLeft, ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { PostEditorModal } from "@/components/community/PostEditorModal";
import { LikersModal } from "@/components/community/LikersModal";

/**
 * CommunityPostCard — Instagram-style.
 *
 * Layout order matches IG: header → media → action bar → like-count →
 * caption (username + content + hashtags inline) → comments link → time.
 *
 * Behaviors that mirror IG:
 *   - Photo-first (square aspect on single image, swipe carousel on multi-image)
 *   - Double-tap (or double-click on desktop) anywhere on the photo to like,
 *     animates a heart burst over the photo. Re-double-tapping does NOT unlike
 *     — same as IG. Use the bottom heart icon to toggle off.
 *   - Caption truncates after 2 lines with a "more" button
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
  const [liked, setLiked] = useState(post.likes?.includes(user?.userId));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [shareFlash, setShareFlash] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [heartBurst, setHeartBurst] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const lastTapRef = useRef(0);

  const isOwner = post.authorId === user?.userId;
  const authorName = post.authorName || `Citizen ${post.authorId?.slice(-4) || ""}`;
  const authorAvatar = post.authorAvatar || "";
  const authorInitial = authorName.charAt(0).toUpperCase();

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  const media = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
  const isCarousel = media.length > 1;

  const triggerLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      onLike?.(post._id);
    }
  };

  const handleHeartClick = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    onLike?.(post._id);
  };

  // Double-tap (mobile) and double-click (desktop). 300 ms window.
  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      triggerLike();
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 700);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleBookmark = () => {
    setBookmarked((b) => !b);
    onBookmark?.(post._id);
  };

  const handleShare = () => {
    setShareFlash(true);
    setTimeout(() => setShareFlash(false), 1500);
    onShare?.(post._id);
    navigator.clipboard?.writeText?.(`${window.location.origin}/community?post=${post._id}`).catch(() => { });
  };

  const captionTooLong = (post.content?.length || 0) > 140 || (post.content?.split("\n").length || 0) > 2;

  return (
    <article className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => post.authorId && navigate(`/community/profile/${post.authorId}`)}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-fuchsia-600">
              <div className="p-[2px] rounded-full bg-white">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={authorAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-sm">
                    {authorInitial}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {post.authorRole === "lawyer" && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                <ShieldCheck className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-900 leading-tight group-hover:underline decoration-slate-200">
                {authorName}
              </p>
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
        </button>

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
                  onClick={() => { setEditorOpen(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 text-left"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Post
                </button>
              )}
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

      {/* ─── Media ────────────────────────────────────────────────────── */}
      {media.length > 0 && (
        <div
          className="relative w-full aspect-square bg-slate-100 select-none"
          onClick={handleMediaTap}
          onDoubleClick={triggerLike}
        >
          {/* Slides */}
          <div
            className="absolute inset-0 flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
          >
            {media.map((url, i) => (
              <div key={i} className="relative w-full h-full shrink-0">
                <img
                  src={url}
                  alt={`Post image ${i + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Heart burst */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center transition-all",
              heartBurst ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
            style={{ transitionDuration: heartBurst ? "200ms" : "500ms" }}
          >
            <Heart className="h-28 w-28 fill-white text-white drop-shadow-2xl" />
          </div>

          {/* Carousel arrows */}
          {isCarousel && (
            <>
              {carouselIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => Math.max(0, i - 1)); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-slate-700"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {carouselIndex < media.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => Math.min(media.length - 1, i + 1)); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-slate-700"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                {carouselIndex + 1}/{media.length}
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {media.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      i === carouselIndex ? "bg-white w-4" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Action Bar ───────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={handleHeartClick} className="h-9 w-9 flex items-center justify-center group" aria-label={liked ? "Unlike" : "Like"}>
            <Heart
              className={cn(
                "h-6 w-6 transition-all duration-200 group-active:scale-90",
                liked ? "fill-red-500 text-red-500" : "text-slate-700 group-hover:text-slate-400"
              )}
            />
          </button>
          <button onClick={() => onComment?.(post)} className="h-9 w-9 flex items-center justify-center group" aria-label="Comment">
            <MessageCircle className="h-6 w-6 text-slate-700 group-hover:text-slate-400 transition-colors group-active:scale-90 duration-200" />
          </button>
          <button onClick={handleShare} className="h-9 w-9 flex items-center justify-center group" aria-label="Share">
            {shareFlash ? (
              <CheckCircle2 className="h-6 w-6 text-teal-500" />
            ) : (
              <Send className="h-6 w-6 text-slate-700 group-hover:text-slate-400 transition-colors group-active:scale-90 duration-200" />
            )}
          </button>
        </div>
        <button onClick={handleBookmark} className="h-9 w-9 flex items-center justify-center group" aria-label="Bookmark">
          <Bookmark
            className={cn(
              "h-6 w-6 transition-all duration-200 group-active:scale-90",
              bookmarked ? "fill-slate-900 text-slate-900" : "text-slate-700 group-hover:text-slate-400"
            )}
          />
        </button>
      </div>

      {/* ─── Like count ──────────────────────────────────────────────── */}
      {likeCount > 0 && (
        <div className="px-4 pb-1">
          <button
            type="button"
            onClick={() => setLikersOpen(true)}
            className="text-sm font-bold text-slate-900 hover:opacity-70 transition-opacity"
          >
            {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
          </button>
        </div>
      )}

      {/* ─── Caption (username + content + hashtags inline) ──────────── */}
      {(post.content || post.hashtags?.length > 0) && (
        <div className="px-4 pb-2">
          <p className={cn(
            "text-sm text-slate-800 leading-snug whitespace-pre-wrap",
            !captionExpanded && captionTooLong && "line-clamp-2"
          )}>
            <button
              type="button"
              onClick={() => post.authorId && navigate(`/community/profile/${post.authorId}`)}
              className="font-bold text-slate-900 mr-1.5 hover:opacity-70"
            >
              {authorName}
            </button>
            {post.content}
            {post.hashtags?.length > 0 && (
              <>
                {" "}
                {post.hashtags.map((tag, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigate(`/community/explore?tag=${encodeURIComponent(tag)}`)}
                    className="text-blue-600 hover:underline mr-1"
                  >
                    #{tag}
                  </button>
                ))}
              </>
            )}
          </p>
          {captionTooLong && !captionExpanded && (
            <button
              type="button"
              onClick={() => setCaptionExpanded(true)}
              className="text-sm text-slate-400 hover:text-slate-600 mt-0.5"
            >
              more
            </button>
          )}
        </div>
      )}

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

      {/* ─── View comments ────────────────────────────────────────────── */}
      {(post.commentCount || 0) > 0 && (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => onComment?.(post)}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            View {post.commentCount === 1 ? "comment" : `all ${post.commentCount} comments`}
          </button>
        </div>
      )}

      {/* ─── Time (under everything, IG-style) ───────────────────────── */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{timeAgo}</p>
      </div>

      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      )}

      <PostEditorModal open={editorOpen} onClose={() => setEditorOpen(false)} post={post} />
      <LikersModal open={likersOpen} onClose={() => setLikersOpen(false)} postId={post._id} />
    </article>
  );
};

export { CommunityPostCard };
