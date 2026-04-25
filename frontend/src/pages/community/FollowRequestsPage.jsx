import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Spinner } from '@/components/common/Spinner';
import { useCommunity } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';

const FollowRequestsPage = () => {
  const navigate = useNavigate();
  const { useGetFollowRequests, approveFollowRequest, rejectFollowRequest } = useCommunity();
  const { data: requests = [], isLoading } = useGetFollowRequests();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <UserPlus className="h-5 w-5 text-teal-600" />
        <h1 className="text-lg font-black text-slate-900">Follow Requests</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
            <UserPlus className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No pending requests</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {requests.map((r) => (
              <div key={r._id} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => navigate(`/community/profile/${r.requesterId}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={r.requesterAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-black">
                      {r.requesterName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{r.requesterName}</p>
                    <p className="text-xs text-slate-400 font-medium">
                      {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveFollowRequest.mutate(r._id)}
                    disabled={approveFollowRequest.isPending}
                    className="h-9 w-9 rounded-full bg-teal-500 text-white hover:bg-teal-600 flex items-center justify-center"
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => rejectFollowRequest.mutate(r._id)}
                    disabled={rejectFollowRequest.isPending}
                    className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowRequestsPage;
