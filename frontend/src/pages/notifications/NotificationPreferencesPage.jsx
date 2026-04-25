import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Save, Loader2 } from 'lucide-react';
import { Spinner } from '@/components/common/Spinner';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const TYPES = [
  { key: 'post_liked',              label: 'Post Likes' },
  { key: 'post_commented',          label: 'Comments on your posts' },
  { key: 'user_followed',           label: 'New followers' },
  { key: 'follow_requested',        label: 'Follow requests' },
  { key: 'follow_request_approved', label: 'Follow requests approved' },
  { key: 'complaint_status',        label: 'Case status updates' },
  { key: 'campaign_update',         label: 'Campaign updates (as supporter)' },
  { key: 'campaign_supported',      label: 'Someone supports your campaign' },
  { key: 'report_resolved',         label: 'Your report resolved' },
  { key: 'user_warned',             label: 'Moderation warnings' },
];

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'h-5 w-9 rounded-full transition-colors relative',
      disabled && 'opacity-40 cursor-not-allowed',
      checked ? 'bg-teal-500' : 'bg-slate-200'
    )}
  >
    <div className={cn(
      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
      checked ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
    )} />
  </button>
);

const NotificationPreferencesPage = () => {
  const navigate = useNavigate();
  const { useGetPreferences, updatePreferences } = useNotifications();
  const { data: prefs, isLoading } = useGetPreferences();

  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (prefs) {
      setLocal({
        emailEnabled: prefs.emailEnabled || false,
        inAppEnabled: prefs.inAppEnabled !== false,
        perType: prefs.perType || {},
      });
    }
  }, [prefs]);

  if (isLoading || !local) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  const updateType = (key, channel, value) => {
    setLocal((s) => ({
      ...s,
      perType: {
        ...s.perType,
        [key]: { ...(s.perType[key] || { inApp: true, email: false }), [channel]: value },
      },
    }));
  };

  const handleSave = () => {
    updatePreferences.mutate(local);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <Bell className="h-5 w-5 text-teal-600" />
        <h1 className="text-lg font-black text-slate-900">Notification Preferences</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Master toggles */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div>
              <p className="font-black text-slate-800">In-app notifications</p>
              <p className="text-xs text-slate-400">Master switch for everything in-app</p>
            </div>
            <Toggle
              checked={local.inAppEnabled}
              onChange={(v) => setLocal((s) => ({ ...s, inAppEnabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-black text-slate-800">Email notifications</p>
              <p className="text-xs text-slate-400">Off by default — enable to receive emails</p>
            </div>
            <Toggle
              checked={local.emailEnabled}
              onChange={(v) => setLocal((s) => ({ ...s, emailEnabled: v }))}
            />
          </div>
        </div>

        {/* Per-type grid */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-50 grid grid-cols-[1fr_auto_auto] gap-6 items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-12">In-App</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-12">Email</p>
          </div>
          {TYPES.map((t) => {
            const cfg = local.perType[t.key] || { inApp: true, email: false };
            return (
              <div key={t.key} className="px-5 py-3.5 grid grid-cols-[1fr_auto_auto] gap-6 items-center border-b border-slate-50 last:border-b-0">
                <p className="text-sm font-bold text-slate-700">{t.label}</p>
                <div className="flex justify-center w-12">
                  <Toggle
                    checked={cfg.inApp !== false}
                    disabled={!local.inAppEnabled}
                    onChange={(v) => updateType(t.key, 'inApp', v)}
                  />
                </div>
                <div className="flex justify-center w-12">
                  <Toggle
                    checked={cfg.email === true}
                    disabled={!local.emailEnabled}
                    onChange={(v) => updateType(t.key, 'email', v)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={updatePreferences.isPending}
            className="h-10 px-6 rounded-full font-black uppercase tracking-widest text-[11px]"
          >
            {updatePreferences.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><Save className="h-3.5 w-3.5 mr-1.5" /> Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
