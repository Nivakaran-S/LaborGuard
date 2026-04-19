import { useState } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useCommunity } from "@/hooks/useCommunity";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const MAX_CHARS = 280;

const StoryComposerModal = ({ open, onClose }) => {
  const { createStatus } = useCommunity();
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleClose = () => {
    setContent("");
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    const formData = new FormData();
    formData.append("content", content.trim());
    if (file) formData.append("media", file);
    try {
      await createStatus.mutateAsync(formData);
      handleClose();
    } catch {
      /* error handled in hook via toast */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Share a Story</h3>
          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder="What's happening?"
            className="w-full min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>{content.length}/{MAX_CHARS}</span>
          </div>

          {previewUrl && (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className={cn(
              "flex items-center gap-2 text-xs font-bold text-teal-600 cursor-pointer hover:text-teal-700"
            )}>
              <ImageIcon className="h-4 w-4" />
              Add photo
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>

            <Button
              type="submit"
              disabled={createStatus.isPending || (!content.trim() && !file)}
              className="h-10 px-6 rounded-full font-black uppercase tracking-widest text-[11px]"
            >
              {createStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post story"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { StoryComposerModal };
