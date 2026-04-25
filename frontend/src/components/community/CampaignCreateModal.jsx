import { useState } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCampaigns } from '@/hooks/useCampaigns';

const CATEGORIES = [
  { value: 'labor_rights', label: 'Labor Rights' },
  { value: 'safety', label: 'Safety' },
  { value: 'wages', label: 'Wages' },
  { value: 'legislation', label: 'Legislation' },
  { value: 'awareness', label: 'Awareness' },
];

const CampaignCreateModal = ({ open, onClose, onCreated }) => {
  const { createCampaign } = useCampaigns();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cta, setCta] = useState('');
  const [category, setCategory] = useState('labor_rights');
  const [targetGoal, setTargetGoal] = useState('1000');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  if (!open) return null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.length < 10 || description.length < 50) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('cta', cta);
    formData.append('category', category);
    formData.append('targetGoal', targetGoal || '0');
    if (image) formData.append('image', image);

    createCampaign.mutate(formData, {
      onSuccess: (res) => {
        onCreated?.(res.data);
        setTitle('');
        setDescription('');
        setCta('');
        setTargetGoal('1000');
        setImage(null);
        setImagePreview('');
        onClose?.();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">New Campaign</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title (10–150 chars)</label>
            <input
              required
              minLength={10}
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stop wage theft in garment sector"
              className="mt-1 w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Description ({description.length}/5000, min 50)
            </label>
            <textarea
              required
              minLength={50}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the issue, impact, and what support looks like..."
              className="mt-1 w-full min-h-[160px] bg-slate-50 rounded-2xl p-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Call to Action (optional)</label>
            <input
              maxLength={300}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Sign the petition / Share your story"
              className="mt-1 w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Goal</label>
              <input
                type="number"
                min="0"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="mt-1 w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hero Image (optional)</label>
            <label className="mt-1 flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 cursor-pointer hover:bg-slate-100">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">{image ? image.name : 'Choose an image...'}</span>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="mt-2 rounded-2xl w-full h-40 object-cover" />
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
              disabled={createCampaign.isPending || title.length < 10 || description.length < 50}
              className="h-10 px-6 rounded-full font-black uppercase tracking-widest text-[11px]"
            >
              {createCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Launch Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CampaignCreateModal };
