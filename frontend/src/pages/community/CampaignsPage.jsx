import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, TrendingUp, Clock, Target } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAuth } from '@/hooks/useAuth';
import { CampaignCreateModal } from '@/components/community/CampaignCreateModal';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'labor_rights', label: 'Labor Rights' },
  { value: 'safety', label: 'Safety' },
  { value: 'wages', label: 'Wages' },
  { value: 'legislation', label: 'Legislation' },
  { value: 'awareness', label: 'Awareness' },
];

const CATEGORY_COLORS = {
  labor_rights: 'bg-teal-50 text-teal-700',
  safety: 'bg-amber-50 text-amber-700',
  wages: 'bg-emerald-50 text-emerald-700',
  legislation: 'bg-blue-50 text-blue-700',
  awareness: 'bg-purple-50 text-purple-700',
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useGetCampaigns } = useCampaigns();
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('trending');
  const [createOpen, setCreateOpen] = useState(false);

  const filters = { status: 'active', sort };
  if (category) filters.category = category;

  const { data: campaigns = [], isLoading } = useGetCampaigns(filters);

  const canCreate = ['ngo', 'ngo_representative', 'admin'].includes(user?.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-teal-600" />
            <h1 className="text-lg font-black text-slate-900">Campaigns</h1>
          </div>
          {canCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-teal-600 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Launch
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value || 'all'}
              onClick={() => setCategory(c.value)}
              className={cn(
                'text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all',
                category === c.value
                  ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                  : 'bg-white text-teal-700 border-teal-100 hover:border-teal-400'
              )}
            >
              {c.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 bg-white rounded-full border border-slate-100 p-0.5">
            <button
              onClick={() => setSort('trending')}
              className={cn(
                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1',
                sort === 'trending' ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              <TrendingUp className="h-3 w-3" /> Trending
            </button>
            <button
              onClick={() => setSort('recent')}
              className={cn(
                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1',
                sort === 'recent' ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              <Clock className="h-3 w-3" /> Recent
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
            <Megaphone className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No campaigns yet</p>
            {canCreate && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-3 text-xs font-black text-teal-600 hover:underline uppercase tracking-widest"
              >
                Be the first to launch one
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c) => {
              const percent = c.targetGoal > 0 ? Math.min(100, Math.round((c.supportersCount / c.targetGoal) * 100)) : 0;
              return (
                <button
                  key={c._id}
                  onClick={() => navigate(`/community/campaigns/${c._id}`)}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  {c.imageUrl ? (
                    <div className="w-full h-40 bg-slate-100 overflow-hidden">
                      <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-teal-100 via-emerald-100 to-cyan-100 flex items-center justify-center">
                      <Megaphone className="h-10 w-10 text-teal-400" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <Badge className={cn(CATEGORY_COLORS[c.category] || 'bg-slate-100', 'border-none text-[9px] font-black uppercase tracking-wider')}>
                      {c.category.replace('_', ' ')}
                    </Badge>
                    <h2 className="font-black text-slate-900 leading-tight">{c.title}</h2>
                    <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                    {c.targetGoal > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {c.supportersCount} / {c.targetGoal}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 font-medium">by {c.creatorName || 'NGO Partner'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CampaignCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(c) => c?._id && navigate(`/community/campaigns/${c._id}`)}
      />
    </div>
  );
};

export default CampaignsPage;
