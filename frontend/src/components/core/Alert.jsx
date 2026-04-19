const Alert = ({ type = 'info', message }) => {
  const colors = {
    info: 'bg-slate-50 text-text-primary border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  return (
    <div className={`border px-4 py-3 rounded-xl ${colors[type]}`}>{message}</div>
  );
};

export default Alert;
