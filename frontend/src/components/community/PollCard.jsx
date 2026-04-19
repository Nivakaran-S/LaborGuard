import { useState } from "react";
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  Target,
  ChevronRight,
  TrendingDown,
  PieChart
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";

const PollCard = ({ poll: rawPoll, onVote }) => {
    // Normalize: data may be a full post object with .poll inside, or a flat poll
    const pollData = rawPoll?.poll || rawPoll;
    const {
        question,
        options = [],
        totalVotes,
        hasVoted,
        category,
        expiresAt
    } = pollData || {};
    const _id = rawPoll?._id || pollData?._id;

    const [votedOption, setVotedOption] = useState(null);

    // Backend stores votes as userId arrays — calculate totals from array lengths
    const calculatedTotal = options.reduce((sum, opt) => sum + (Array.isArray(opt.votes) ? opt.votes.length : (opt.votes || 0)), 0);
    const displayTotal = totalVotes || calculatedTotal;

    const handleVote = (optionIndex) => {
        if (hasVoted) return;
        setVotedOption(optionIndex);
        onVote?.(_id, optionIndex);
    };

    return (
        <div className="group break-inside-avoid mb-8 bg-slate-900 rounded-[48px] p-10 text-white shadow-xl shadow-slate-200/20 relative overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-700">
            {/* Visual Branding */}
            <div className="absolute top-0 right-0 w-24 h-full bg-primary/10 -mr-10 -skew-x-12 opacity-50 transition-all pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full space-y-10">
                <div className="space-y-6">
                    <div className="flex justify-between items-start">
                        <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] text-[10px]">
                            <BarChart3 className="h-3 w-3 mr-1.5" />
                            Community Sentiment
                        </Badge>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{displayTotal} Citizens Voted</span>
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-black tracking-tight leading-tight uppercase italic break-words">
                        {question}
                    </h2>
                </div>

                {/* Poll Options System */}
                <div className="space-y-4 flex-1">
                    {options.map((opt, i) => {
                        const optVoteCount = Array.isArray(opt.votes) ? opt.votes.length : (opt.votes || 0);
                        const percentage = displayTotal > 0 ? Math.round((optVoteCount / displayTotal) * 100) : 0;
                        const isSelected = votedOption === i || (hasVoted && i === opt.selectedIndex);

                        return (
                            <button 
                                key={i}
                                onClick={() => handleVote(i)}
                                disabled={hasVoted}
                                className={cn(
                                    "w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all relative overflow-hidden group/opt",
                                    hasVoted ? "cursor-default" : "hover:bg-white/10 hover:border-white/20 active:scale-[0.98]",
                                    isSelected && "border-primary bg-primary/10"
                                )}
                            >
                                {/* Progress Bar Background */}
                                {hasVoted && (
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-all duration-1000 ease-out" 
                                        style={{ width: `${percentage}%` }}
                                    />
                                )}

                                <div className="relative z-10 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                            isSelected ? "border-primary bg-primary" : "border-white/20",
                                            hasVoted && !isSelected && "opacity-50"
                                        )}>
                                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                        </div>
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-widest whitespace-pre-wrap leading-tight",
                                            isSelected ? "text-primary" : "text-slate-300 group-hover/opt:text-white"
                                        )}>
                                            {opt.text || opt.label}
                                        </span>
                                    </div>
                                    {hasVoted && (
                                        <div className="text-right">
                                            <p className="text-xl font-black tracking-tighter text-white">{percentage}%</p>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer/Analytics Preview */}
                <div className="pt-6 border-t border-white/5 mt-auto flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Pulse Status:</p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 shadow-glow animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white">Aggregating Global Trends</p>
                        </div>
                    </div>
                    {hasVoted ? (
                        <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Insight Recorded</span>
                        </div>
                    ) : (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic leading-tight text-right shrink-0">
                           Cast your vote to see <br /> community intelligence.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export { PollCard };
