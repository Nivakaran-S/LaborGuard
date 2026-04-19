import { useState } from "react";
import { UserPlus, UserCheck, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * UserSuggestion — Compact card for "People You Might Know" sidebar.
 * Shows avatar, name, role badge, and follow/unfollow button.
 */
const UserSuggestion = ({ profile }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { followUser, unfollowUser } = useCommunity();
  const [following, setFollowing] = useState(false);

  const isMe = profile.userId === user?.userId;
  if (isMe) return null;

  const displayName = profile.name || `User ${profile.userId?.slice(-4)}`;
  const initial = displayName.charAt(0).toUpperCase();

  const handleFollow = (e) => {
    e.stopPropagation();
    if (following) {
      setFollowing(false);
      unfollowUser.mutate(profile.userId);
    } else {
      setFollowing(true);
      followUser.mutate(profile.userId);
    }
  };

  const roleConfig = {
    lawyer: { label: "Legal Officer", color: "bg-blue-50 text-blue-600" },
    ngo_representative: { label: "NGO", color: "bg-purple-50 text-purple-600" },
    employer: { label: "Employer", color: "bg-orange-50 text-orange-600" },
    worker: { label: "Worker", color: "bg-teal-50 text-teal-600" },
    admin: { label: "Admin", color: "bg-slate-100 text-slate-600" },
  };
  const roleInfo = roleConfig[profile.role] || roleConfig.worker;

  return (
    <div
      onClick={() => navigate(`/community/profile/${profile.userId}`)}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={profile.avatarUrl} />
        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-sm">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-bold text-slate-800 truncate leading-tight">{displayName}</p>
          {profile.isVerified && (
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
          )}
        </div>
        <Badge className={cn("border-none text-[9px] font-black uppercase tracking-wide px-1.5 py-0 mt-0.5", roleInfo.color)}>
          {roleInfo.label}
        </Badge>
      </div>
      <button
        onClick={handleFollow}
        className={cn(
          "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all",
          following
            ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500"
            : "bg-teal-500 text-white hover:bg-teal-600 shadow-sm"
        )}
      >
        {following ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
};

export { UserSuggestion };
