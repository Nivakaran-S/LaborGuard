const EmptyState = ({ title, description }) => (
  <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center shadow-sm">
    <div className="text-5xl mb-4">📭</div>
    <h3 className="text-xl font-extrabold text-text-primary mb-2">{title}</h3>
    <p className="text-text-secondary max-w-[520px] mx-auto">{description}</p>
  </div>
);

export default EmptyState;
