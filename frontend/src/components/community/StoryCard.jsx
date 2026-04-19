import { 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  MoreVertical, 
  Quote, 
  UserCheck, 
  ShieldCheck,
  Calendar,
  ExternalLink,
  Lock
} from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import { cn } from "@/lib/utils";

/**
 * StoryCard — Community experience post renderer.
 *
 * Backend Post model shape:
 *   { _id, authorId, content, mediaUrls, likes, shareCount, hashtags, poll, createdAt }
 *
 * The component also accepts optional enrichment fields: user, isAnonymous, isVerified, category
 */
const StoryCard = ({ story, onLike, onComment, onShare }) => {
    const {
        _id,
        content,
        authorId,
        user,          // may be undefined if not populated
        mediaUrls,     // Post model uses mediaUrls (array of strings)
        media,         // legacy field (array of objects with .url)
        likes,
        comments,
        createdAt,
        isAnonymous,
        isVerified,
        category,
        hashtags
    } = story;

    // Normalize media: backend stores mediaUrls (string[]), some enriched data may use media (object[])
    const displayMedia = media?.length > 0 
        ? media 
        : mediaUrls?.length > 0 
            ? mediaUrls.map(url => ({ url })) 
            : [];

    // Author display — authorId is always available; user object may or may not be populated
    const authorName = user?.firstName 
        ? `${user.firstName} ${user.lastName?.charAt(0) || ''}.`
        : isAnonymous 
            ? 'Anonymous Citizen' 
            : `Citizen ${authorId?.slice(-4) || ''}`;

    const authorInitial = user?.firstName?.charAt(0) || authorId?.charAt(0)?.toUpperCase() || '?';

    return (
        <div className="group break-inside-avoid mb-8 bg-white rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col hover:-translate-y-2">
            {/* Story Visual (if any) */}
            {displayMedia.length > 0 && (
                <div className="relative h-64 overflow-hidden shrink-0">
                    <img 
                        src={displayMedia[0].url} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 grayscale-[0.2] group-hover:grayscale-0" 
                        alt="Story visual"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-8">
                        <Badge className="bg-primary/90 text-white border-none font-black uppercase tracking-widest text-[9px] px-3">
                            {category || (hashtags?.length > 0 ? `#${hashtags[0]}` : 'Community Experience')}
                        </Badge>
                    </div>
                </div>
            )}

            {/* Narrative Section */}
            <div className="p-10 space-y-8 flex-1 flex flex-col">
                <div className="relative space-y-4">
                    <div className="absolute -top-4 -left-4 text-primary/10 transition-colors group-hover:text-primary/20">
                        <Quote className="h-12 w-12 fill-current" />
                    </div>

                    {/* Hashtag tags */}
                    {hashtags?.length > 0 && !displayMedia.length && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {hashtags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} className="bg-primary/5 text-primary/80 border-none font-bold text-[8px] tracking-widest uppercase">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <p className="text-lg font-bold text-slate-700 leading-relaxed italic relative z-10 line-clamp-6">
                        "{content}"
                    </p>
                </div>

                <div className="pt-6 border-t border-slate-50 mt-auto flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 ring-4 ring-slate-50 shadow-inner">
                                {isAnonymous ? (
                                    <AvatarFallback className="bg-slate-900 text-white"><Lock className="h-4 w-4" /></AvatarFallback>
                                ) : (
                                    <>
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`} />
                                        <AvatarFallback className="bg-primary/20 text-primary font-black uppercase text-xs">{authorInitial}</AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 leading-tight">
                                    {authorName}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {isVerified && <ShieldCheck className="h-3 w-3 text-blue-500" />}
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {isVerified ? "Verified Laborer" : "Community Member"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            <Calendar className="h-3 w-3 inline mr-1" /> {new Date(createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Social Engine */}
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-6">
                            <button 
                                onClick={() => onLike?.(_id)}
                                className="flex items-center gap-2 group/btn"
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-all">
                                    <ThumbsUp className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-black text-slate-500 group-hover/btn:text-slate-900">{likes?.length || 0}</span>
                            </button>
                            <button 
                                onClick={() => onComment?.(_id)}
                                className="flex items-center gap-2 group/btn"
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover/btn:bg-blue-100 group-hover/btn:text-blue-600 transition-all">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-black text-slate-500 group-hover/btn:text-slate-900">{comments?.length || 0}</span>
                            </button>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full hover:bg-primary/5 text-slate-300 hover:text-primary transition-all"
                            onClick={() => onShare?.(_id)}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { StoryCard };
