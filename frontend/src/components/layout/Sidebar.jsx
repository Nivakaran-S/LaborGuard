import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, FileText, PlusCircle, Calendar,
  Briefcase, Users, MessageSquare, ShieldAlert,
  BarChart3, Globe, Settings, ShieldCheck, Gavel,
  Activity, ChevronRight, LogOut, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { Avatar, AvatarFallback } from "../common/Avatar";
import { useTranslation } from "react-i18next";

const Sidebar = ({ className }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavLinks = () => {
    const role = user?.role;
    const links = {
      worker: [
        { title: t("nav.dashboard", "Command Center"),  href: "/worker/dashboard",      icon: LayoutDashboard },
        { title: t("nav.jobs", "Job Board"),             href: "/worker/jobs",            icon: Briefcase },
        { title: t("nav.complaints", "My Case Files"),   href: "/worker/complaints",      icon: FileText },
        { title: t("nav.new_complaint", "New Complaint"),href: "/worker/complaints/new",  icon: PlusCircle },
        { title: t("nav.appointments", "Consultations"), href: "/worker/appointments",    icon: Calendar },
      ],
      employer: [
        { title: t("nav.dashboard", "Recruitment Hub"), href: "/employer/dashboard", icon: LayoutDashboard },
        { title: t("nav.new_job", "Post Vacancy"),       href: "/employer/jobs/new",  icon: PlusCircle },
        { title: t("nav.jobs", "Active Listings"),       href: "/employer/jobs",      icon: Briefcase },
      ],
      lawyer: [
        { title: t("nav.dashboard", "Legal Command"),  href: "/legal/dashboard",      icon: Gavel },
        { title: t("nav.cases", "Active Docket"),      href: "/legal/cases",          icon: ShieldCheck },
        { title: t("nav.complaints", "All Complaints"), href: "/complaints/officer",  icon: FileText },
        { title: t("nav.appointments","Consultations"),href: "/legal/appointments",   icon: Calendar },
      ],
      ngo: [
        { title: t("nav.dashboard", "Advocacy Dashboard"), href: "/ngo/dashboard",  icon: LayoutDashboard },
        { title: t("nav.cases", "Investigations"),          href: "/ngo/cases",      icon: ShieldAlert },
        { title: t("nav.impact", "Impact Hub"),             href: "/ngo/impact",     icon: Globe },
        { title: t("nav.reports", "Reports"),               href: "/ngo/reports",    icon: FileText },
        { title: t("nav.community", "Community Feed"),      href: "/community",      icon: Activity },
      ],
      admin: [
        { title: t("nav.dashboard", "System Governance"), href: "/admin/dashboard",             icon: ShieldAlert },
        { title: t("nav.users", "User Registry"),          href: "/admin/dashboard?tab=users",   icon: Users },
        { title: t("nav.complaints", "Complaints"),        href: "/complaints/admin",            icon: FileText },
        { title: t("nav.appointments", "Appointments"),    href: "/admin/appointments",          icon: Calendar },
        { title: t("nav.analytics", "Global Analytics"),   href: "/admin/dashboard?tab=analytics",icon: BarChart3 },
      ],
    };

    const commonLinks = [
      { title: t("nav.community", "Community"), href: "/community", icon: Users },
      { title: t("nav.messaging", "Messaging"),  href: "/messages",  icon: MessageSquare, badge: "Live" },
    ];

    return [...(links[role] || []), ...commonLinks];
  };

  const navLinks = getNavLinks();

  // FIX: isActive now handles query-string links (admin tabs) correctly
  const isActive = (href) => {
    const fullPath = location.pathname + location.search;
    if (href.includes('?')) return fullPath === href;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getSettingsPath = () => {
    const paths = {
      worker: '/worker/profile',
      employer: '/employer/dashboard',
      lawyer: '/legal/dashboard',
      ngo: '/ngo/dashboard',
      admin: '/admin/dashboard',
    };
    return paths[user?.role] || '/';
  };

  return (
    <aside className={cn(
      "flex flex-col w-72 bg-slate-900 border-r border-white/5 h-full relative overflow-hidden group/sidebar transition-all duration-500",
      className
    )}>
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl opacity-20 pointer-events-none" />

      {/* Brand */}
      <div className="p-8 pb-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transform -rotate-6 group-hover/sidebar:rotate-0 transition-transform duration-500">
            <ShieldCheck className="text-white h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter text-white leading-none">
              Labor<span className="text-primary italic">Guard.</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Sri Lanka Protocol</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-2 py-4 overflow-y-auto custom-scrollbar">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 px-4 mb-3">Navigation Modules</p>

        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center justify-between group px-5 py-4 rounded-[20px] transition-all duration-300 relative",
                active
                  ? "bg-white/10 text-white shadow-2xl shadow-black/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}>
              <div className="flex items-center gap-3.5 relative z-10">
                <Icon className={cn(
                  "w-4 h-4 transition-all duration-500",
                  active ? "text-primary scale-110" : "group-hover:text-primary group-hover:scale-110"
                )} />
                <span className={cn(
                  "text-xs font-black uppercase tracking-widest",
                  active ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                )}>
                  {link.title}
                </span>
              </div>
              {link.badge && (
                <Badge className="bg-primary/20 text-primary border-none font-black text-[7px] tracking-[0.2em] px-2 uppercase shadow-inner z-10">
                  {link.badge}
                </Badge>
              )}
              {active && (
                <div className="absolute right-0 h-4 w-1 bg-primary rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Identity Module */}
      <div className="p-6 pt-0">
        <div className="bg-white/5 rounded-[32px] p-6 space-y-6 border border-white/5 shadow-inner">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 ring-2 ring-white/5 shadow-xl">
              <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-[10px]">
                {user?.firstName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-white truncate uppercase tracking-widest leading-none mb-1">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="text-[8px] text-slate-500 font-bold uppercase tracking-tight truncate flex items-center gap-1.5 leading-none">
                <div className="h-1 w-1 rounded-full bg-green-500" />
                {user?.role} Official
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* FIX: Settings button now navigates to correct profile page instead of doing nothing */}
            <Button
              variant="ghost"
              aria-label="Settings"
              onClick={() => navigate(getSettingsPath())}
              className="h-11 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 p-0 transition-all">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              aria-label="Sign out"
              onClick={() => { logout(); navigate('/login'); }}
              className="h-11 rounded-2xl bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 p-0 transition-all">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="pb-6 text-center">
        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-700">Protocol v4.0.2-SECURE</p>
      </div>
    </aside>
  );
};

export default Sidebar;