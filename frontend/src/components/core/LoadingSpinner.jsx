const LoadingSpinner = () => (
  <div className="flex items-center justify-center gap-3 text-text-secondary">
    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-accent-primary animate-spin"></div>
    <span className="text-sm font-semibold">Loading...</span>
  </div>
);

export default LoadingSpinner;
