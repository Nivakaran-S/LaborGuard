import { useEffect, useState } from "react";
import { X, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { communityApi } from "@/api/communityApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_BIO = 200;
const HIDDEN_FIELD_OPTIONS = [
  { key: 'bio', label: 'Hide bio from strangers' },
  { key: 'followers', label: 'Hide followers list' },
  { key: 'following', label: 'Hide following list' },
];

const ProfileEditorModal = ({ open, onClose, profile, userId }) => {
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [hiddenFields, setHiddenFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && profile) {
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatarUrl || "");
      setIsPrivate(Boolean(profile.isPrivate));
      setHiddenFields(profile.hiddenFields || []);
    }
  }, [open, profile]);

  if (!open) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await communityApi.createOrUpdateProfile({
        userId,
        name: profile?.name,
        role: profile?.role,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        isPrivate,
        hiddenFields,
      });
      await queryClient.invalidateQueries({ queryKey: ["community-profile", userId] });
      toast.success("Profile updated!");
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
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
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Edit Community Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avatar URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…/avatar.jpg"
              className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Bio <span className="ml-1 text-slate-300">({bio.length}/{MAX_BIO})</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              placeholder="Tell the community about yourself…"
              className="w-full min-h-[100px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
            />
          </div>

          {/* Privacy controls (Phase 3.1) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setIsPrivate((v) => !v)}
                className={cn(
                  'h-5 w-9 rounded-full transition-colors relative flex-shrink-0',
                  isPrivate ? 'bg-teal-500' : 'bg-slate-200'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                  isPrivate ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                )} />
              </button>
              <span className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                <Lock className="h-3.5 w-3.5" /> Private Account
              </span>
            </label>
            <p className="text-[10px] text-slate-400 font-medium ml-12 -mt-2">
              When on, only approved followers can see your posts and full profile.
            </p>

            {HIDDEN_FIELD_OPTIONS.map((f) => (
              <label key={f.key} className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hiddenFields.includes(f.key)}
                  onChange={(e) => {
                    setHiddenFields((cur) =>
                      e.target.checked ? [...cur, f.key] : cur.filter((h) => h !== f.key)
                    );
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-300"
                />
                <span className="text-xs font-bold text-slate-600">{f.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-full text-xs font-black text-slate-500 hover:bg-slate-100 uppercase tracking-widest"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-full font-black uppercase tracking-widest text-[11px]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { ProfileEditorModal };
