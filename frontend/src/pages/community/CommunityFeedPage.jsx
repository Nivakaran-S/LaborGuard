import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Users, Bookmark, Hash, Compass } from "lucide-react";
import { useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { StoriesBar } from "@/components/community/StoriesBar";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PostComposer } from "@/components/community/PostComposer";
import { PostSkeleton } from "@/components/community/PostSkeleton";
import { CommentThread } from "@/components/community/CommentThread";
import { StoryComposerModal } from "@/components/community/StoryComposerModal";
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

      {/* ── Story Viewer (basic overlay) ───────────────────────── */}
      {viewingStory && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-in fade-in"
          onClick={() => setViewingStory(null)}
        >
          <div className="max-w-sm w-full mx-4 rounded-3xl overflow-hidden bg-slate-900 aspect-[9/16] relative flex items-end">
            {viewingStory.mediaUrl && (
              <img src={viewingStory.mediaUrl} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="relative z-10 p-6 bg-gradient-to-t from-black/80 via-transparent">
              <p className="text-sm font-bold text-white">{viewingStory.content}</p>
              <p className="text-xs text-white/60 mt-1">{viewingStory.authorName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityFeedPage;