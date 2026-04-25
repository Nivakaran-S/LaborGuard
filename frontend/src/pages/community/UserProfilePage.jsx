import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Grid3X3, Heart, Settings, UserPlus, UserCheck,
  ShieldCheck, MessageCircle, Lock, Clock, List, Image as ImageIcon, Camera,
  Layers
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { CommentThread } from "@/components/community/CommentThread";
import { ProfileEditorModal } from "@/components/community/ProfileEditorModal";
import { cn } from "@/lib/utils";

const ROLE_CONFIG = {
  worker: { label: "Worker", color: "bg-teal-50 text-teal-700" },
  lawyer: { label: "Legal Officer", color: "bg-blue-50 text-blue-700" },
  ngo: { label: "NGO Representative", color: "bg-purple-50 text-purple-700" },
  ngo_representative: { label: "NGO Representative", color: "bg-purple-50 text-purple-700" },
  employer: { label: "Employer", color: "bg-orange-50 text-orange-700" },
  admin: { label: "Administrator", color: "bg-slate-100 text-slate-700" },
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const {
    useGetProfile, useGetProfileStats, useGetPostsByAuthor,
    followUser, unfollowUser,
    likePost, sharePost, toggleBookmark, deletePost, reportPost, votePoll,
  } = useCommunity();

  const { data: profile, isLoading: profileLoading } = useGetProfile(userId);
  const { data: stats } = useGetProfileStats(userId);
  const [activeTab, setActiveTab] = useState("posts");
  // IG-style: grid view by default, list view as a fallback for full text/poll posts
  const [viewMode, setViewMode] = useState("grid");
  const { data: authorPosts = [], isLoading: postsLoading, error: postsError } = useGetPostsByAuthor(userId);

  const [selectedPost, setSelectedPost] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);

  const isMe = userId === currentUser?.userId;
  const roleInfo = ROLE_CONFIG[profile?.role] || ROLE_CONFIG.worker;

  useEffect(() => {
    if (profile && currentUser) {
      setFollowing(Boolean(profile.followers?.includes(currentUser.userId)));
    }
  }, [profile, currentUser]);

  const handleFollow = () => {
    if (following) {
      setFollowing(false);
      unfollowUser.mutate(userId);
      return;
    }
    // Private profile → enters pending state (backend will create FollowRequest)
    if (profile?.isPrivate) {
      setFollowPending(true);
      followUser.mutate(userId);
      return;
    }
    setFollowing(true);
    followUser.mutate(userId);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-2xl">👤</p>
          <p className="font-black text-slate-800">Profile not found</p>
          <button onClick={() => navigate(-1)} className="text-teal-600 text-sm font-bold hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.name || `User ${profile.userId?.slice(-4)}`;
  const initial = displayName.charAt(0).toUpperCase();

  const statPostCount = stats?.postCount ?? authorPosts.length;
  const statFollowers = stats?.followers ?? profile.followers?.length ?? 0;
  const statFollowing = stats?.following ?? profile.following?.length ?? 0;
  const statTotalLikes = stats?.totalLikes ?? 0;

  const isPrivateBlocked = profile.isPrivate && !isMe && !following;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-black text-slate-800 text-sm">{displayName}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white pt-8 pb-5 px-6 flex flex-col items-center text-center border-b border-slate-100">
          <div className="relative mb-4">
            <div className="p-1 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500">
              <div className="p-0.5 bg-white rounded-full">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-3xl font-black">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-1 right-1 h-7 w-7 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">{displayName}</h1>
            {profile.isPrivate && <Lock className="h-3.5 w-3.5 text-slate-400" />}
          </div>
          <Badge className={cn("border-none text-[10px] font-black uppercase tracking-wide mt-1.5", roleInfo.color)}>
            {roleInfo.label}
          </Badge>

          {profile.bio && !profile.hiddenFields?.includes("bio") && (
            <p className="text-sm text-slate-600 font-medium mt-3 max-w-xs leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex items-center gap-8 mt-5">
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{statPostCount}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Posts</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{statTotalLikes}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Likes</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{statFollowers}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Followers</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{statFollowing}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Following</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 w-full max-w-xs">
            {isMe ? (
              <button
                onClick={() => setEditorOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wide transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  disabled={followPending}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                    following
                      ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-500"
                      : followPending
                      ? "bg-amber-50 text-amber-700"
                      : "bg-teal-500 text-white hover:bg-teal-600 shadow-sm"
                  )}
                >
                  {followPending ? <Clock className="h-3.5 w-3.5" />
                    : following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {followPending ? "Requested"
                    : following ? "Following"
                    : profile.isPrivate ? "Request to Follow" : "Follow"}
                </button>
                <button
                  onClick={() => navigate(`/messages?userId=${userId}`, {
                    state: {
                      name: profile?.name || displayName,
                      role: profile?.role || "",
                      email: profile?.email || "",
                    },
                  })}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wide transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border-b border-slate-100 flex justify-center gap-8">
          <button
            onClick={() => { setActiveTab("posts"); setViewMode("grid"); }}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wide border-t-2 transition-colors",
              activeTab === "posts" && viewMode === "grid"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            Posts
          </button>
          <button
            onClick={() => { setActiveTab("posts"); setViewMode("list"); }}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wide border-t-2 transition-colors",
              activeTab === "posts" && viewMode === "list"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="h-4 w-4" />
            Feed View
          </button>
        </div>

        <div className={cn(viewMode === "grid" ? "p-1 sm:p-1.5" : "p-4 space-y-4")}>
          {isPrivateBlocked ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center mx-3 my-4">
              <Lock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600">This account is private</p>
              <p className="text-xs text-slate-400 mt-1">Follow to see their posts</p>
            </div>
          ) : postsLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : postsError ? (
            <div className="bg-white rounded-2xl border border-dashed border-red-200 py-10 text-center mx-3 my-4">
              <p className="text-sm font-bold text-red-400">Unable to load posts</p>
            </div>
          ) : authorPosts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-16 text-center mx-3 my-4">
              <div className="h-16 w-16 mx-auto mb-3 rounded-full border-2 border-slate-300 flex items-center justify-center">
                <Camera className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="font-black text-2xl text-slate-700 mb-1">No Posts Yet</p>
              <p className="text-xs text-slate-400">When {isMe ? "you share" : "they share"}, posts appear here.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {authorPosts.map((post) => {
                const firstImage = Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;
                const isMulti = Array.isArray(post.mediaUrls) && post.mediaUrls.length > 1;
                return (
                  <button
                    key={post._id}
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square bg-slate-100 overflow-hidden group"
                  >
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 p-3 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                        <p className="text-[10px] sm:text-xs font-medium text-slate-600 line-clamp-6 leading-tight text-center">
                          {post.content || "—"}
                        </p>
                      </div>
                    )}
                    {isMulti && (
                      <div className="absolute top-1.5 right-1.5">
                        <Layers className="h-4 w-4 text-white drop-shadow-md" />
                      </div>
                    )}
                    {/* Hover overlay (desktop) — IG-style likes/comments count */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5 text-white">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Heart className="h-5 w-5 fill-white" />
                        {post.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold">
                        <MessageCircle className="h-5 w-5 fill-white" />
                        {post.commentCount || 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            authorPosts.map((post) => (
              <CommunityPostCard
                key={post._id}
                post={post}
                onLike={(id) => likePost.mutate(id)}
                onComment={setSelectedPost}
                onShare={(id) => sharePost.mutate(id)}
                onBookmark={(id) => toggleBookmark.mutate(id)}
                onDelete={(id) => deletePost.mutate(id)}
                onReport={(id) => reportPost.mutate({ postId: id, reason: "Inappropriate content" })}
                onVote={(id, optionIndex) => votePoll.mutate({ postId: id, optionIndex })}
              />
            ))
          )}
        </div>
      </div>

      {selectedPost && <CommentThread post={selectedPost} onClose={() => setSelectedPost(null)} />}

      <ProfileEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        profile={profile}
        userId={userId}
      />
    </div>
  );
};

export default UserProfilePage;
