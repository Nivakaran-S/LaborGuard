import { Plus } from "lucide-react";
import { StoryBubble } from "./StoryBubble";
import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/hooks/useCommunity";
import { useRef } from "react";

/**
 * StoriesBar — Horizontal scrollable row of story bubbles.
 * First bubble is always "Add Story" for the current user.
 */
const StoriesBar = ({ onAddStory, onViewStory }) => {
  const { user } = useAuth();
  const { useGetStatuses } = useCommunity();
  const { data: statuses = [] } = useGetStatuses();
  const scrollRef = useRef(null);

  // Group statuses by author (first status per author for the bubble)
  const authorMap = {};
  statuses.forEach((s) => {
    if (!authorMap[s.authorId]) authorMap[s.authorId] = s;
  });
  const uniqueStatuses = Object.values(authorMap);

  return (
    <div className="bg-white border-b border-slate-100 px-4 py-3">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Add Story bubble */}
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
                  {user?.name?.charAt(0)?.toUpperCase() || "?"}
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

        {/* Other users' stories */}
        {uniqueStatuses
          .filter((s) => s.authorId !== user?.userId)
          .map((status) => (
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
