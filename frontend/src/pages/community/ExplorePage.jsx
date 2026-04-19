import { useState, useEffect } from "react";
import { Compass, Hash, TrendingUp, Search, BarChart3 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCommunity } from "@/hooks/useCommunity";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PollCard } from "@/components/community/PollCard";
import { PostSkeleton } from "@/components/community/PostSkeleton";
import { CommentThread } from "@/components/community/CommentThread";
import { cn } from "@/lib/utils";

const POPULAR_TAGS = [
  "WageTheft", "SafetyRights", "WorkersUnite", "FairPay", "LabourLaw",
  "Apparel", "Construction", "TeaWorkers", "DomesticWorkers", "Transport",
  "ChildLabour", "Harassment", "Overtime", "MinimumWage", "Healthcare",
];

const ExplorePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { useGetTrending, useSearchByHashtag, useGetPolls, likePost, sharePost, toggleBookmark, deletePost, reportPost, votePoll } = useCommunity();
  const [selectedTag, setSelectedTag] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: trending = [], isLoading: trendingLoading } = useGetTrending();
  const { data: tagPosts = [],  isLoading: tagLoading }     = useSearchByHashtag(selectedTag);
  const { data: polls = [] } = useGetPolls();

  const posts = selectedTag ? tagPosts : trending;
  const loading = selectedTag ? tagLoading : trendingLoading;

  const searchTag = (tag) => setSelectedTag(tag.replace(/^#/, "").trim());

  // Accept ?tag=XYZ from hashtag clicks in feed
  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    if (tagFromUrl) setSelectedTag(tagFromUrl.replace(/^#/, "").trim());
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-teal-600" />
            <h1 className="text-lg font-black text-slate-900">Explore</h1>
          </div>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search hashtags (press Enter)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchInput.trim()) {
                  searchTag(searchInput);
                  setSearchInput("");
                }
              }}
              className="w-full bg-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hashtag chips */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-teal-600" />
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-wide">
              {selectedTag ? `#${selectedTag}` : "Popular Hashtags"}
            </h2>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag("")}
                className="ml-auto text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors"
              >
                Clear → Trending
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => searchTag(tag)}
                className={cn(
                  "text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all",
                  selectedTag === tag
                    ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                    : "bg-white text-teal-700 border-teal-100 hover:border-teal-400 hover:bg-teal-50"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Active polls */}
        {!selectedTag && polls.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide">Active Polls</h2>
            </div>
            {polls.slice(0, 2).map((poll) => (
              <PollCard
                key={poll._id}
                poll={poll}
                onVote={(postId, optionIndex) => votePoll.mutate({ postId, optionIndex })}
              />
            ))}
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide">
            {selectedTag ? `Posts tagged #${selectedTag}` : "Trending Now"}
          </h2>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <Hash className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No posts found for #{selectedTag}</p>
            <button
              onClick={() => setSelectedTag("")}
              className="mt-3 text-xs font-bold text-teal-600 hover:underline"
            >
              View trending posts instead
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
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

      {selectedPost && <CommentThread post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
};

export default ExplorePage;
