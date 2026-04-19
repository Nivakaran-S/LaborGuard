import { useState } from "react";
import { Bookmark, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommunity } from "@/hooks/useCommunity";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PostSkeleton } from "@/components/community/PostSkeleton";
import { CommentThread } from "@/components/community/CommentThread";

const BookmarksPage = () => {
  const navigate = useNavigate();
  const { useGetBookmarks, likePost, sharePost, toggleBookmark, deletePost, reportPost, votePoll } = useCommunity();
  const { data: bookmarks = [], isLoading } = useGetBookmarks();
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Bookmark className="h-4 w-4 text-teal-600" />
        <p className="font-black text-slate-800 text-sm">My Bookmarks</p>
        <span className="ml-auto text-xs font-bold text-slate-400">{bookmarks.length} saved</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <PostSkeleton key={i} />)
        ) : bookmarks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 flex flex-col items-center text-center space-y-3">
            <Bookmark className="h-12 w-12 text-slate-200" />
            <p className="font-black text-slate-600 text-lg">No bookmarks yet</p>
            <p className="text-sm text-slate-400 font-medium max-w-xs">
              Tap the bookmark icon on any post to save it here for later.
            </p>
            <button
              onClick={() => navigate("/community")}
              className="mt-2 px-5 py-2 bg-teal-500 text-white rounded-full text-xs font-black uppercase tracking-wide hover:bg-teal-600 transition-colors shadow-sm"
            >
              Browse Community
            </button>
          </div>
        ) : (
          bookmarks.map((post) => (
            <CommunityPostCard
              key={post._id}
              post={post}
              isBookmarked
              onLike={(id) => likePost.mutate(id)}
              onComment={(p) => setSelectedPost(p)}
              onShare={(id) => sharePost.mutate(id)}
              onBookmark={(id) => toggleBookmark.mutate(id)}
              onDelete={(id) => deletePost.mutate(id)}
              onReport={(id) => reportPost.mutate({ postId: id, reason: "Reported by user" })}
              onVote={(postId, optionIndex) => votePoll.mutate({ postId, optionIndex })}
            />
          ))
        )}
      </div>

      {selectedPost && <CommentThread post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
};

export default BookmarksPage;
