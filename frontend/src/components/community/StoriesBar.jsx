import { Plus } from "lucide-react";
import { StoryBubble } from "./StoryBubble";
import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/hooks/useCommunity";
import { useRef } from "react";

/**
 * StoriesBar — horizontal row of story bubbles.
 *
 * The first bubble is always the current user's own bubble. If they have an
 * active story it shows the actual story (with the IG-style gradient ring +
 * a small "+" badge to add another). Otherwise it's the dashed "Add Story"
 * placeholder. Previously the user's own stories were filtered out entirely,
 * so after posting one they had no way to see it.
 */
const StoriesBar = ({ onAddStory, onViewStory }) => {
  const { user } = useAuth();
  const { useGetStatuses } = useCommunity();
  const { data: statuses = [] } = useGetStatuses();
  const scrollRef = useRef(null);

  // First status per author = the bubble we show
  const authorMap = {};
  statuses.forEach((s) => {
    if (!authorMap[s.authorId]) authorMap[s.authorId] = s;
  });
  const myStatus = user?.userId ? authorMap[user.userId] : null;
  const otherStatuses = Object.values(authorMap).filter((s) => s.authorId !== user?.userId);

  const myInitial = (user?.firstName || user?.name || "?").charAt(0).toUpperCase();

  return (
    <div className="bg-white border-b border-slate-100 px-4 py-3">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Self bubble — view your own story OR add one */}
        {myStatus ? (
          <button
            onClick={() => onViewStory?.(myStatus)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group relative"
            aria-label="Your story"
          >
            <div className="relative">
              <div className="p-[2px] rounded-full bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500">
                <div className="p-[2px] bg-white rounded-full">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center overflow-hidden">
                    {myStatus.mediaUrl ? (
                      <img src={myStatus.mediaUrl} alt="Your story" className="h-full w-full object-cover" />
                    ) : user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="You" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-teal-700">{myInitial}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* "+" badge — tap to add another */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddStory?.(); }}
                aria-label="Add story"
                className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow-sm hover:bg-teal-600 transition-colors"
              >
                <Plus className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </button>
            </div>
            <span className="text-[9px] font-bold text-slate-700 truncate max-w-[64px]">
              Your Story
            </span>
          </button>
        ) : (
          <button
            onClick={onAddStory}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center group-hover:border-teal-400 group-hover:bg-teal-50 transition-all">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="You"
                    className="h-full w-full rounded-full object-cover opacity-60 group-hover:opacity-80"
                  />
                ) : (
                  <span className="text-lg font-black text-slate-400 group-hover:text-teal-600">
                    {myInitial}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow-sm">
                <Plus className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-500 truncate max-w-[64px]">
              Add Story
            </span>
          </button>
        )}

        {otherStatuses.map((status) => (
          <StoryBubble
            key={status._id}
            status={status}
            onClick={() => onViewStory?.(status)}
          />
        ))}
      </div>
    </div>
  );
};

export { StoriesBar };
