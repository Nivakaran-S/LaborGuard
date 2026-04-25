import { useEffect, useState } from "react";
import { X, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCommunity } from "@/hooks/useCommunity";

const MAX_CONTENT = 2000;
const MAX_HASHTAGS = 5;

const PostEditorModal = ({ open, onClose, post }) => {
  const { editPost } = useCommunity();
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");

  useEffect(() => {
    if (open && post) {
      setContent(post.content || "");
      setHashtags(post.hashtags || []);
    }
  }, [open, post]);

  if (!open || !post) return null;

  const addHashtag = (e) => {
    e.preventDefault();
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (!tag || hashtags.includes(tag) || hashtags.length >= MAX_HASHTAGS) return;
    setHashtags((t) => [...t, tag]);
    setHashtagInput("");
  };

  const removeHashtag = (tag) =>
    setHashtags((t) => t.filter((h) => h !== tag));

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("content", content);
    formData.append("hashtags", JSON.stringify(hashtags));
    // Preserve existing media — backend skips media update if none in body/files
    if (post.mediaUrls?.length) {
      formData.append("mediaUrls", JSON.stringify(post.mediaUrls));
    }
    editPost.mutate(
      { postId: post._id, formData },
      { onSuccess: () => onClose?.() }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Edit Post</h3>
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
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Content <span className="ml-1 text-slate-300">({content.length}/{MAX_CONTENT})</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              className="w-full min-h-[140px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Hashtags <span className="ml-1 text-slate-300">({hashtags.length}/{MAX_HASHTAGS})</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeHashtag(tag)}
                  className="text-[11px] font-bold text-teal-700 bg-teal-50 rounded-full px-2 py-1 hover:bg-red-50 hover:text-red-500"
                >
                  #{tag} ×
                </button>
              ))}
            </div>
            {hashtags.length < MAX_HASHTAGS && (
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addHashtag(e)}
                    placeholder="add hashtag"
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium text-slate-800"
                  />
                </div>
                <Button type="button" onClick={addHashtag} variant="secondary" className="h-10 rounded-full text-xs font-black uppercase tracking-widest">
                  Add
                </Button>
              </div>
            )}
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
              disabled={editPost.isPending || !content.trim()}
              className="h-10 px-6 rounded-full font-black uppercase tracking-widest text-[11px]"
            >
              {editPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { PostEditorModal };
