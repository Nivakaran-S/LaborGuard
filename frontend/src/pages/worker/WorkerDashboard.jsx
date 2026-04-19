import {
  FileText,
  Briefcase,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  PlusCircle,
  Bell,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/hooks/useComplaints";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Avatar, AvatarFallback } from "@/components/common/Avatar";
import { Spinner } from "@/components/common/Spinner";
import { cn } from "@/lib/utils";
import { ComplaintCard } from "@/components/complaint/ComplaintCard";

const WorkerDashboard = () => {
  const { user } = useAuth();
  const { useGetMyComplaints } = useComplaints();
  const { useGetUnreadCount } = useNotifications();

  const { data: complaintsData, isLoading: complaintsLoading } = useGetMyComplaints({ limit: 5 });
  const { data: notifUnread } = useGetUnreadCount();

  const complaints = complaintsData?.complaints || [];

  // FIX: Was "<d" (JSX crash) — now properly using <div> throughout
  const stats = {
    total:    complaintsData?.pagination?.total || 0,
    pending:  complaints.filter((c) => c.status === "pending").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    critical: complaints.filter((c) => c.priority === "critical").length,
  };

  if (complaintsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-32">
        <Spinner size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Syncing Labor Profile...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-20">

      {/* ── Hero Welcome Banner ─────────────────────────────────────── */}
      <div className="relative p-10 md:p-14 bg-slate-900 rounded-[56px] overflow-hidden group shadow-2xl shadow-slate-200">
        {/* ambient glow */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[100px] animate-pulse pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Headline + CTAs */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">
                Worker Command Center
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
                Protecting Your <br />
                <span className="text-primary italic">Labor Rights.</span>
              </h1>
              <p className="text-lg font-bold text-slate-400 max-w-md">
                Welcome back,&nbsp;{user?.firstName}. You have{" "}
                <span className="text-white font-black">{stats.total}</span> active
                {stats.total === 1 ? " case" : " cases"} in your dashboard today.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30">
                <Link to="/worker/complaints/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  File New Case
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-[10px] text-white border-2 border-white/10 hover:bg-white/5">
                <Link to="/worker/jobs">Explore Job Board</Link>
              </Button>
            </div>
          </div>

          {/* Right: Stat mini-cards — FIX: was "<d" (crash), now correct <div> tags */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { label: "Resolved",    value: stats.resolved, icon: CheckCircle2, color: "text-green-500" },
              { label: "Pending",     value: stats.pending,  icon: Clock,        color: "text-amber-500" },
              { label: "Critical",    value: stats.critical, icon: ShieldAlert,  color: "text-red-500"   },
              { label: "Total Files", value: stats.total,    icon: FileText,     color: "text-primary"   },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10 space-y-4 hover:border-white/20 transition-all">
                <div className={cn("h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-black text-white tracking-tighter">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-10">

        {/* ── Left: Case Feed (2/3 width) ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center px-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Recent Developments
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Tracking your active labor disputes
              </p>
            </div>
            <Button
              variant="ghost"
              asChild
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
              <Link to="/worker/complaints">Show All Cases</Link>
            </Button>
          </div>

          {complaints.length > 0 ? (
            <div className="space-y-4">
              {complaints.map((c) => (
                <ComplaintCard key={c._id} complaint={c} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                <FileText className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black text-slate-800">Your Case File is Clear.</p>
                <p className="text-sm font-bold text-slate-500 max-w-xs leading-relaxed uppercase italic">
                  If your labor rights were violated, we can help you find justice immediately.
                </p>
              </div>
              <Button
                asChild
                className="rounded-full px-10 h-14 font-black uppercase tracking-widest text-xs">
                <Link to="/worker/complaints/new">Get Help Now</Link>
              </Button>
            </div>
          )}
        </div>

        {/* ── Right: Profile & Quick Links (1/3 width) ─────────────── */}
        <div className="space-y-8">

          {/* Mini Profile Card */}
          <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-slate-50">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-black uppercase">
                  {user?.firstName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {user?.firstName} {user?.lastName}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Verified Worker
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-50 w-full" />

            {/* Quick Link Nav */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Account Utilities
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "My Profile Settings",   icon: User,          path: "/worker/profile"       },
                  { label: "Assigned Appointments",  icon: Calendar,      path: "/worker/appointments"  },
                  { label: "Community Feed",          icon: TrendingUp,    path: "/community"            },
                  { label: "Secure Messaging",        icon: MessageSquare, path: "/messages"             },
                  {
                    label: "Notifications",
                    icon: Bell,
                    path: "/worker/dashboard",
                    badge: notifUnread || 0,
                  },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.path}
                    className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl
                               hover:bg-primary/5 hover:border-primary/10 border border-transparent
                               transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary shadow-sm transition-colors">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge > 0 && (
                        <Badge className="h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-white text-[9px] font-black px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="bg-slate-900 p-8 rounded-[48px] text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-3xl group-hover:blur-2xl transition-all pointer-events-none" />
            <ShieldCheck className="h-10 w-10 text-primary" />
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight leading-tight">
                Securing Your <br /> Future.
              </h3>
              <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase italic">
                Every case filed is encrypted and shared only with verified legal officers
                and NGO partners.
              </p>
            </div>
          </div>

          {/* Job Board CTA */}
          <div className="p-8 bg-blue-50 border border-blue-100 rounded-[48px] space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                Now Hiring
              </p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                Browse Verified Job Opportunities
              </h3>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase italic">
              Find employers committed to LaborGuard's fair wage standards.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full h-14 rounded-full font-black uppercase tracking-widest text-[10px]
                         border-2 border-blue-200 text-blue-700 bg-white hover:bg-blue-50 shadow-sm">
              <Link to="/worker/jobs">
                <Briefcase className="h-4 w-4 mr-2" />
                Explore Opportunities
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;