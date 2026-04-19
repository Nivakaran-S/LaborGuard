/** PostSkeleton — Animated placeholder while posts are loading */
const PostSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    {/* Header */}
    <div className="flex items-center gap-3 p-4">
      <div className="h-10 w-10 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 bg-slate-200 rounded-full" />
        <div className="h-2.5 w-20 bg-slate-100 rounded-full" />
      </div>
    </div>
    {/* Media */}
    <div className="h-56 bg-slate-100" />
    {/* Content */}
    <div className="p-4 space-y-2">
      <div className="h-3 bg-slate-200 rounded-full" />
      <div className="h-3 w-5/6 bg-slate-200 rounded-full" />
      <div className="h-3 w-3/4 bg-slate-100 rounded-full" />
    </div>
    {/* Actions */}
    <div className="flex items-center gap-4 px-4 pb-4">
      <div className="h-5 w-14 bg-slate-100 rounded-full" />
      <div className="h-5 w-14 bg-slate-100 rounded-full" />
      <div className="h-5 w-14 bg-slate-100 rounded-full" />
    </div>
  </div>
);

export { PostSkeleton };
