import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Grid3X3, Heart, Settings, UserPlus, UserCheck,
  MapPin, ShieldCheck, MessageCircle,
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
  ngo_representative: { label: "NGO Representative", color: "bg-purple-50 text-purple-700" },
  employer: { label: "Employer", color: "bg-orange-50 text-orange-700" },
  admin: { label: "Administrator", color: "bg-slate-100 text-slate-700" },
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { useGetProfile, followUser, unfollowUser } = useCommunity();

  const { data: profile, isLoading: profileLoading } = useGetProfile(userId);
  const [following, setFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [editorOpen, setEditorOpen] = useState(false);

  const isMe = userId === currentUser?.userId;
  const roleInfo = ROLE_CONFIG[profile?.role] || ROLE_CONFIG.worker;

  const handleFollow = () => {
    if (following) {
      setFollowing(false);
      unfollowUser.mutate(userId);
    } else {
      setFollowing(true);
      followUser.mutate(userId);
    }
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back nav */}
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
        {/* Profile header */}
        <div className="bg-white pt-8 pb-5 px-6 flex flex-col items-center text-center border-b border-slate-100">
          {/* Avatar */}
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

          <h1 className="text-xl font-black text-slate-900">{displayName}</h1>
          <Badge className={cn("border-none text-[10px] font-black uppercase tracking-wide mt-1.5", roleInfo.color)}>
            {roleInfo.label}
          </Badge>

          {profile.bio && (
            <p className="text-sm text-slate-600 font-medium mt-3 max-w-xs leading-relaxed">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-8 mt-5">
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{profile.followers?.length || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Followers</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{profile.following?.length || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Following</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{profile.bookmarks?.length || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bookmarks</p>
            </div>
          </div>

          {/* Action buttons */}
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
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                    following
                      ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-500"
                      : "bg-teal-500 text-white hover:bg-teal-600 shadow-sm"
                  )}
                >
                  {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {following ? "Following" : "Follow"}
                </button>
                <button
                  onClick={() => navigate(`/messages?userId=${userId}`)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wide transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-slate-100 flex">
          {[{ id: "posts", icon: Grid3X3, label: "Posts" }].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wide border-b-2 transition-colors",
                activeTab === id
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Posts — Note: backend doesn't have GET /posts/user/:userId yet, show empty state */}
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <Grid3X3 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">Posts from this user will appear here</p>
            <p className="text-xs text-slate-400 mt-1">This feature requires a backend endpoint: GET /posts/author/:userId</p>
          </div>
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
