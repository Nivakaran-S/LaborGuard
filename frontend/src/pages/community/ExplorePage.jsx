import { useState, useEffect } from "react";
import { Compass, Hash, TrendingUp, Search, BarChart3, Users, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCommunity } from "@/hooks/useCommunity";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PollCard } from "@/components/community/PollCard";
import { PostSkeleton } from "@/components/community/PostSkeleton";
import { CommentThread } from "@/components/community/CommentThread";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";

const POPULAR_TAGS = [
  "WageTheft", "SafetyRights", "WorkersUnite", "FairPay", "LabourLaw",
  "Apparel", "Construction", "TeaWorkers", "DomesticWorkers", "Transport",
  "ChildLabour", "Harassment", "Overtime", "MinimumWage", "Healthcare",
];

const ROLE_BADGE = {
  lawyer: { label: "Legal", className: "bg-blue-50 text-blue-600" },
  ngo: { label: "NGO", className: "bg-purple-50 text-purple-600" },
  ngo_representative: { label: "NGO", className: "bg-purple-50 text-purple-600" },
  admin: { label: "Admin", className: "bg-amber-50 text-amber-600" },
};

const ExplorePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    useGetTrending, useSearchByHashtag, useGetPolls,
    useSearchPosts, useSearchProfiles,
    likePost, sharePost, toggleBookmark, deletePost, reportPost, votePoll,
  } = useCommunity();
  const [selectedTag, setSelectedTag] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  // debounce keyword input (300ms) — fires user + post search
  useEffect(() => {
    const id = setTimeout(() => setDebounced(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: trending = [], isLoading: trendingLoading } = useGetTrending();
  const { data: tagPosts = [],  isLoading: tagLoading }     = useSearchByHashtag(selectedTag);
  const { data: polls = [] } = useGetPolls();
  const { data: keywordPosts = [], isLoading: keywordLoading } = useSearchPosts(debounced);
  const { data: keywordProfiles = [], isLoading: profilesLoading } = useSearchProfiles(debounced);

  const isKeywordSearch = debounced.length >= 2 && !selectedTag;
  const posts = selectedTag ? tagPosts : isKeywordSearch ? keywordPosts : trending;
  const loading = selectedTag ? tagLoading : isKeywordSearch ? keywordLoading : trendingLoading;

  const searchTag = (tag) => {
    setSelectedTag(tag.replace(/^#/, "").trim());
    setSearchInput("");
    setDebounced("");
  };

  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    if (tagFromUrl) setSelectedTag(tagFromUrl.replace(/^#/, "").trim());
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-teal-600" />
            <h1 className="text-lg font-black text-slate-900">Explore</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search posts, people, or hashtags (type # first for tags)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchInput.trim().startsWith("#")) {
                  searchTag(searchInput);
                }
              }}
              className="w-full bg-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* User results (only when keyword search active) */}
        {isKeywordSearch && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <Users className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wide">People</h2>
            </div>
            {profilesLoading ? (
              <div className="px-4 py-6 text-xs text-slate-400 font-bold uppercase tracking-widest text-center">Searching…</div>
            ) : keywordProfiles.length === 0 ? (
              <div className="px-4 py-6 text-xs text-slate-400 font-bold text-center">No users found</div>
            ) : (
              (() => {
                // Defensive: dedupe by userId (in case the backend ever returns
                // the same profile twice) and also count name collisions so we
                // can show a userId tail to disambiguate same-named accounts
                // that don't yet have a denormalised email.
                const byId = new Map();
                keywordProfiles.forEach((p) => { if (!byId.has(p.userId)) byId.set(p.userId, p); });
                const unique = [...byId.values()];
                const nameCount = unique.reduce((m, p) => {
                  const k = (p.name || "").toLowerCase();
                  m[k] = (m[k] || 0) + 1;
                  return m;
                }, {});
                return unique.map((u) => {
                  const badge = ROLE_BADGE[u.role];
                  const ambiguous = nameCount[(u.name || "").toLowerCase()] > 1;
                  // Subtitle: prefer email, fall back to bio, fall back to a
                  // userId tail when names collide so you can tell two
                  // "Nivakaran"s apart at a glance.
                  const subtitle =
                    u.email ||
                    u.bio ||
                    (ambiguous && u.userId ? `id ending in ${u.userId.slice(-6)}` : "");
                  return (
                    <button
                      key={u.userId}
                      onClick={() => navigate(`/community/profile/${u.userId}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left border-t border-slate-50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-sm">
                          {u.name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                          {u.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                          {badge && (
                            <Badge className={`${badge.className} border-none text-[9px] font-black uppercase tracking-wider px-1.5 py-0`}>
                              {badge.label}
                            </Badge>
                          )}
                        </div>
                        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
                      </div>
                    </button>
                  );
                });
              })()
            )}
          </div>
        )}

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

        {!selectedTag && !isKeywordSearch && polls.length > 0 && (
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

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide">
            {selectedTag
              ? `Posts tagged #${selectedTag}`
              : isKeywordSearch
              ? `Posts matching "${debounced}"`
              : "Trending Now"}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <Hash className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">
              {isKeywordSearch ? "No posts match your search" : `No posts found for #${selectedTag}`}
            </p>
            {selectedTag && (
              <button onClick={() => setSelectedTag("")} className="mt-3 text-xs font-bold text-teal-600 hover:underline">
                View trending posts instead
              </button>
            )}
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
