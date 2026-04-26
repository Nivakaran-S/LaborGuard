import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Users, Bookmark, Hash, Compass, X, Trash2 } from "lucide-react";
import { useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { StoriesBar } from "@/components/community/StoriesBar";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PostComposer } from "@/components/community/PostComposer";
import { PostSkeleton } from "@/components/community/PostSkeleton";
import { CommentThread } from "@/components/community/CommentThread";
import { StoryComposerModal } from "@/components/community/StoryComposerModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "feed",     label: "For You",  icon: Users },
  { id: "trending", label: "Trending", icon: TrendingUp },
];

const TRENDING_HASHTAGS = [
  "WageTheft", "SafetyRights", "WorkersUnite", "FairPay", "LabourLaw",
  "Apparel", "Construction", "TeaWorkers", "DomesticWorkers",
];

const CommunityFeedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState("feed");
  const [selectedPost, setSelectedPost] = useState(null); // for comment thread
  const [searchTag, setSearchTag]       = useState("");
  const [hashtagSearch, setHashtagSearch] = useState("");

  const {
    useGetPosts, useGetTrending, useSearchByHashtag,
    likePost, sharePost, toggleBookmark, deletePost, reportPost, votePoll,
    deleteStatus,
  } = useCommunity();
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);

  const { data: feedPosts = [],     isLoading: feedLoading }     = useGetPosts();
  const { data: trendingPosts = [], isLoading: trendingLoading } = useGetTrending();
  const { data: hashtagPosts = [],  isLoading: hashtagLoading }  = useSearchByHashtag(hashtagSearch);

  const isSearching = hashtagSearch.length > 0;
  const activePosts   = isSearching ? hashtagPosts : (activeTab === "feed" ? feedPosts : trendingPosts);
  const activeLoading = isSearching ? hashtagLoading : (activeTab === "feed" ? feedLoading : trendingLoading);

  // Story viewer (simple modal placeholder)
  const [viewingStory, setViewingStory] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Stories Bar ─────────────────────────────────────────── */}
      <StoriesBar
        onAddStory={() => setStoryComposerOpen(true)}
        onViewStory={setViewingStory}
      />

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Feed Column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Post Composer */}
          <PostComposer />

          {/* Tab switcher */}
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setHashtagSearch(""); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                  activeTab === id && !isSearching
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
            {isSearching && (
              <button
                onClick={() => setHashtagSearch("")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide bg-purple-500 text-white shadow-sm"
              >
                <Hash className="h-3.5 w-3.5" />
                #{hashtagSearch}
              </button>
            )}
          </div>

          {/* Posts */}
          {activeLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
            </div>
          ) : activePosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-center space-y-4 shadow-sm">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                <Users className="h-10 w-10 text-slate-200" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">No posts yet</p>
                <p className="text-sm text-slate-400 font-medium mt-1 max-w-xs">
                  {activeTab === "feed"
                    ? "Follow some community members or be the first to share your experience!"
                    : "No trending posts right now. Check back soon."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activePosts.map((post) => (
                <CommunityPostCard
                  key={post._id}
                  post={post}
                  onLike={(id) => likePost.mutate(id)}
                  onComment={(p) => setSelectedPost(p)}
                  onShare={(id) => sharePost.mutate(id)}
                  onBookmark={(id) => toggleBookmark.mutate(id)}
                  onDelete={(id) => deletePost.mutate(id)}
                  onReport={(id) => reportPost.mutate({ postId: id, reason: "Reported by user" })}
                  onVote={(postId, optionIndex) => votePoll.mutate({ postId, optionIndex })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ────────────────────────────────────────── */}
        <aside className="hidden lg:block space-y-5">

          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search by hashtag..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchTag.trim()) {
                    setHashtagSearch(searchTag.trim().replace(/^#/, ""));
                    setSearchTag("");
                  }
                }}
                className="w-full bg-slate-50 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
              />
            </div>
          </div>

          {/* Trending Hashtags */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-teal-600" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">Trending Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_HASHTAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setHashtagSearch(tag)}
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded-full transition-all",
                    hashtagSearch === tag
                      ? "bg-teal-500 text-white"
                      : "bg-slate-50 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-3">Discover</h3>
            <div className="space-y-1">
              {[
                { icon: Compass, label: "Explore Community", path: "/community/explore" },
                { icon: Bookmark, label: "My Bookmarks",     path: "/community/bookmarks" },
                { icon: Users,   label: "My Profile",        path: `/community/profile/${user?.userId}` },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors group"
                >
                  <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <Icon className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Comment Thread Overlay ──────────────────────────────── */}
      {selectedPost && (
        <CommentThread
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* ── Story Composer Modal ────────────────────────────────── */}
      <StoryComposerModal
        open={storyComposerOpen}
        onClose={() => setStoryComposerOpen(false)}
      />

      {/* ── Story Viewer ─────────────────────────────────────────
          Responsive layout:
          - Phones (any orientation):  full-bleed edge-to-edge card
          - Tablet / desktop:          centered 9:16 card capped at 92vh
          Media is a single absolute layer filling the card; the top bar
          and bottom caption float on top via gradient overlays so the
          image is always fully visible with no cropping.
       */}
      {viewingStory && (() => {
        const isOwn = viewingStory.authorId === user?.userId;
        const initial = (viewingStory.authorName || user?.firstName || "?").charAt(0).toUpperCase();
        const timeAgo = viewingStory.createdAt
          ? formatDistanceToNow(new Date(viewingStory.createdAt), { addSuffix: false })
          : "";

        return (
          <div
            className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-in fade-in"
            onClick={() => setViewingStory(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="
                relative bg-slate-950 overflow-hidden shadow-2xl
                w-full h-[100dvh]
                sm:w-auto sm:h-auto sm:max-h-[92vh] sm:aspect-[9/16] sm:rounded-3xl
              "
              style={{
                // Cap the width on tablet/desktop so a tall 92vh × 9:16 card
                // (which would be ~518px wide on a 1080px viewport) doesn't
                // dominate. Falls back to default sm:aspect sizing on smaller
                // screens.
                maxWidth: 'min(440px, 100vw)',
              }}
            >
              {/* Layer 1 — full-bleed media or text-only gradient backdrop.
                  Uses object-cover for media (the natural story format is
                  9:16; cropping at the edges is the IG-expected behavior).
                  Text-only stories get a teal/emerald gradient. */}
              {viewingStory.mediaUrl ? (
                <img
                  src={viewingStory.mediaUrl}
                  alt="Story media"
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700" />
              )}

              {/* Layer 2 — top gradient + progress bar + header. Uses pb-14
                  so the gradient fades cleanly without a hard line. */}
              <div className="absolute top-0 left-0 right-0 z-20 pt-3 pb-14 px-3 sm:px-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-white/90 w-full" />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                  <Avatar className="h-9 w-9 ring-2 ring-white/30 flex-shrink-0">
                    <AvatarImage src={viewingStory.authorAvatar || (isOwn ? user?.avatarUrl : "")} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-sm">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate drop-shadow">
                      {isOwn ? "Your Story" : (viewingStory.authorName || `User ${String(viewingStory.authorId || "").slice(-6)}`)}
                    </p>
                    {timeAgo && (
                      <p className="text-[11px] text-white/80 font-medium drop-shadow">
                        {timeAgo} ago
                      </p>
                    )}
                  </div>
                  {isOwn && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Delete this story?")) return;
                        try {
                          await deleteStatus.mutateAsync(viewingStory._id);
                          setViewingStory(null);
                        } catch (_) { /* toast handled in hook */ }
                      }}
                      className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      aria-label="Delete story"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewingStory(null)}
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Layer 3 — bottom caption with its own gradient. Renders
                  only when the story has text. The pt-16 sets up a long
                  fade-in from transparent to opaque so the caption strip
                  doesn't end abruptly. */}
              {viewingStory.content && (
                <div className="absolute bottom-0 left-0 right-0 z-20 pt-16 pb-6 px-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none">
                  <p className="text-base font-medium text-white leading-snug whitespace-pre-wrap text-center max-w-md mx-auto drop-shadow">
                    {viewingStory.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CommunityFeedPage;