import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { communityApi } from "@/api/communityApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MAX_BIO = 200;

const ProfileEditorModal = ({ open, onClose, profile, userId }) => {
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && profile) {
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatarUrl || "");
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
