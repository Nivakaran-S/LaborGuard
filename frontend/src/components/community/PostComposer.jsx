import { useState, useRef } from "react";
import { Image as ImageIcon, X, Hash, BarChart3, Send, ShieldCheck, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/hooks/useCommunity";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * PostComposer — Inline Instagram-inspired post creation box.
 * Supports text, images (up to 4), and hashtag extraction.
 */
const PostComposer = ({ onSuccess }) => {
  const { user } = useAuth();
  const { createPost } = useCommunity();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // Array of { file, preview }
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [showHashtags, setShowHashtags] = useState(false);
  const fileInputRef = useRef(null);

  const authorName = user?.name || "You";
  const initial = authorName.charAt(0).toUpperCase();

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, 4 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 4));
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addHashtag = (e) => {
    if (e.key === "Enter" && hashtagInput.trim()) {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, "");
      if (tag && !hashtags.includes(tag) && hashtags.length < 5) {
        setHashtags((prev) => [...prev, tag]);
      }
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag) => setHashtags((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    const formData = new FormData();
    formData.append("content", content.trim());
    formData.append("hashtags", JSON.stringify(hashtags));
    images.forEach(({ file }) => formData.append("media", file));

    createPost.mutate(formData, {
      onSuccess: () => {
        setContent("");
        setImages([]);
        setHashtags([]);
        images.forEach((img) => URL.revokeObjectURL(img.preview));
        onSuccess?.();
      },
    });
  };

  const canSubmit = (content.trim() || images.length > 0) && !createPost.isPending;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      {/* Author row */}
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-sm">
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <textarea
            placeholder="Share your experience with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={content.length > 80 ? 4 : 2}
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed bg-transparent transition-all"
            maxLength={1000}
          />

          {/* Hashtags display */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors"
                  onClick={() => removeHashtag(tag)}
                >
                  #{tag} <X className="h-2.5 w-2.5" />
                </span>
              ))}
            </div>
          )}

          {/* Hashtag input */}
          {showHashtags && (
            <div className="mt-2">
              <input
                placeholder="Type a hashtag and press Enter (max 5)"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={addHashtag}
                className="w-full text-xs bg-slate-50 rounded-lg px-3 py-2 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
              />
            </div>
          )}

          {/* Image previews */}
          {images.length > 0 && (
            <div className={cn("mt-3 gap-2", images.length === 1 ? "block" : "grid grid-cols-2")}>
              {images.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Image upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
          >
            <ImageIcon className="h-4 w-4" /> Photo
          </button>

          {/* Hashtag toggle */}
          <button
            type="button"
            onClick={() => setShowHashtags((s) => !s)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
              showHashtags ? "bg-teal-50 text-teal-600" : "text-slate-500 hover:bg-teal-50 hover:text-teal-600"
            )}
          >
            <Hash className="h-4 w-4" /> Tags
          </button>

          {/* Encrypted indicator */}
          <div className="flex items-center gap-1 px-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Encrypted</span>
          </div>
        </div>

        {/* Post button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-all",
            canSubmit
              ? "bg-teal-500 text-white hover:bg-teal-600 shadow-md hover:shadow-teal-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          {createPost.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {createPost.isPending ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

export { PostComposer };
