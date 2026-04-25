import { X, Loader2, Heart, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { useCommunity } from "@/hooks/useCommunity";

const ROLE_BADGE = {
  lawyer: { label: "Legal", className: "bg-blue-50 text-blue-600" },
  ngo: { label: "NGO", className: "bg-purple-50 text-purple-600" },
  ngo_representative: { label: "NGO", className: "bg-purple-50 text-purple-600" },
  admin: { label: "Admin", className: "bg-amber-50 text-amber-600" },
};

const LikersModal = ({ open, onClose, postId }) => {
  const navigate = useNavigate();
  const { useGetPostLikers } = useCommunity();
  const { data: likers = [], isLoading } = useGetPostLikers(open ? postId : null);

  if (!open) return null;

  const goToProfile = (userId) => {
    navigate(`/community/profile/${userId}`);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Likes</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading && (
            <div className="flex justify-center p-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          )}
          {!isLoading && likers.length === 0 && (
            <p className="text-center text-sm text-slate-400 p-10">No likes yet</p>
          )}
          {!isLoading && likers.map((u) => {
            const badge = ROLE_BADGE[u.role];
            return (
              <button
                key={u.userId}
                onClick={() => goToProfile(u.userId)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-sm">
                    {u.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 truncate">{u.name || "Anonymous"}</p>
                    {u.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                    {badge && (
                      <Badge className={`${badge.className} border-none text-[9px] font-black uppercase tracking-wider px-1.5 py-0`}>
                        {badge.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { LikersModal };
