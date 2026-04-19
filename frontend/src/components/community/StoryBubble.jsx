import { cn } from "@/lib/utils";

/**
 * StoryBubble — Single circular story bubble for the stories bar.
 * Shows a gradient ring when unread, muted ring when all seen.
 */
const StoryBubble = ({ status, isSelf = false, isViewed = false, onClick }) => {
  const authorName = status?.authorName || (isSelf ? "Your Story" : `User`);
  const avatarUrl  = status?.authorAvatar || "";
  const initial    = authorName.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
    >
      <div
        className={cn(
          "p-[2px] rounded-full transition-all duration-300",
          isSelf
            ? "bg-gradient-to-br from-slate-200 to-slate-300"
            : isViewed
            ? "bg-slate-200"
            : "bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500"
        )}
      >
        <div className="p-[2px] bg-white rounded-full">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={authorName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-black text-teal-700">{initial}</span>
            )}
          </div>
        </div>
      </div>
      <span className="text-[9px] font-bold text-slate-500 truncate max-w-[64px] group-hover:text-teal-700 transition-colors">
        {isSelf ? "Your Story" : authorName.split(" ")[0]}
      </span>
    </button>
  );
};

export { StoryBubble };
