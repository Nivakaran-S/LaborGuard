import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Megaphone, Target, Send, Loader2, Check, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Button } from '@/components/ui/Button';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = {
  labor_rights: 'bg-teal-50 text-teal-700',
  safety: 'bg-amber-50 text-amber-700',
  wages: 'bg-emerald-50 text-emerald-700',
  legislation: 'bg-blue-50 text-blue-700',
  awareness: 'bg-purple-50 text-purple-700',
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    useGetCampaign, useGetCampaignSupporters, useGetCampaignUpdates,
    supportCampaign, unsupportCampaign, addCampaignUpdate, deleteCampaign,
  } = useCampaigns();

  const { data: campaign, isLoading } = useGetCampaign(id);
  const { data: supporters = [] } = useGetCampaignSupporters(id);
  const { data: updates = [] } = useGetCampaignUpdates(id);

  const [updateText, setUpdateText] = useState('');
  const canPostUpdate = campaign && (campaign.createdBy === user?.userId || user?.role === 'admin');

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-2">
        <p className="font-black">Campaign not found</p>
        <button onClick={() => navigate(-1)} className="text-teal-600 font-bold text-sm">Go back</button>
      </div>
    );
  }

  const percent = campaign.targetGoal > 0
    ? Math.min(100, Math.round((campaign.supportersCount / campaign.targetGoal) * 100))
    : 0;

  const handleSupport = () => {
    if (campaign.hasSupported) unsupportCampaign.mutate(id);
    else supportCampaign.mutate(id);
  };

  const handlePostUpdate = (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    const formData = new FormData();
    formData.append('content', updateText.trim());
    addCampaignUpdate.mutate(
      { id, formData },
      { onSuccess: () => setUpdateText('') }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <p className="font-black text-slate-800 text-sm truncate">{campaign.title}</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {campaign.imageUrl ? (
          <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-60 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-teal-100 via-emerald-100 to-cyan-100 flex items-center justify-center">
            <Megaphone className="h-12 w-12 text-teal-400" />
          </div>
        )}

        <div className="bg-white px-6 py-6 border-b border-slate-100 space-y-4">
          <Badge className={cn(CATEGORY_COLORS[campaign.category] || 'bg-slate-100', 'border-none text-[10px] font-black uppercase tracking-wider')}>
            {campaign.category.replace('_', ' ')}
          </Badge>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{campaign.title}</h1>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
          {campaign.cta && (
            <p className="text-sm font-black text-teal-700 bg-teal-50 rounded-2xl px-4 py-3">
              {campaign.cta}
            </p>
          )}

          {campaign.targetGoal > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-600">
                <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {campaign.supportersCount} of {campaign.targetGoal} supporters</span>
                <span className="text-teal-600">{percent}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Avatar className="h-7 w-7">
                <AvatarImage src={campaign.creatorAvatar} />
                <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px] font-black">
                  {(campaign.creatorName || 'N').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>by {campaign.creatorName || 'NGO Partner'}</span>
            </div>
            <Button
              onClick={handleSupport}
              disabled={supportCampaign.isPending || unsupportCampaign.isPending}
              className={cn(
                'h-10 px-5 rounded-full font-black uppercase tracking-widest text-[11px]',
                campaign.hasSupported
                  ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              )}
            >
              {campaign.hasSupported ? <><Check className="h-3.5 w-3.5 mr-1.5" /> Supporting</> : 'Support'}
            </Button>
          </div>
        </div>

        {supporters.length > 0 && (
          <div className="bg-white px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-teal-600" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Supporters ({supporters.length})</h3>
            </div>
            <div className="flex -space-x-2">
              {supporters.slice(0, 15).map((s) => (
                <button
                  key={s.userId}
                  onClick={() => navigate(`/community/profile/${s.userId}`)}
                  className="ring-2 ring-white rounded-full hover:z-10 transition-transform hover:scale-110"
                  title={s.name}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={s.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-[11px] font-black">
                      {s.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ))}
              {supporters.length > 15 && (
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 ring-2 ring-white">
                  +{supporters.length - 15}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest px-2">Campaign Updates</h3>

          {canPostUpdate && (
            <form onSubmit={handlePostUpdate} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-2">
              <input
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="Post an update for supporters..."
                className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <button
                type="submit"
                disabled={!updateText.trim() || addCampaignUpdate.isPending}
                className="h-10 w-10 rounded-full bg-teal-500 text-white flex items-center justify-center disabled:bg-slate-200"
              >
                {addCampaignUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          )}

          {updates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <p className="text-sm text-slate-400 font-bold">No updates yet</p>
            </div>
          ) : (
            updates.map((u) => (
              <div key={u._id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.authorAvatar} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px] font-black">
                      {(u.authorName || 'N').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-black text-slate-700">{u.authorName}</p>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{u.content}</p>
                {u.mediaUrls?.length > 0 && (
                  <div className={cn('mt-3 gap-1', u.mediaUrls.length === 1 ? 'block' : 'grid grid-cols-2')}>
                    {u.mediaUrls.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full h-40 object-cover rounded-xl" />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {canPostUpdate && campaign.status !== 'archived' && (
          <div className="px-6 py-6 text-center">
            <button
              onClick={() => {
                if (confirm('Archive this campaign? Supporters will no longer see it on the list.')) {
                  deleteCampaign.mutate(id, { onSuccess: () => navigate('/community/campaigns') });
                }
              }}
              className="text-xs font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
            >
              Archive Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetailPage;
