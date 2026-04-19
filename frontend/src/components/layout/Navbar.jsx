import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import {
  Menu, X, LogOut, User, Bell, Globe, ChevronDown,
  LayoutDashboard, Briefcase, FileText, MessageSquare,
  CheckCheck, Clock, Users, Gavel, ShieldAlert
} from 'lucide-react';
// FIX: Was '@/components/ui/Button' — correct path is '@/components/common/Button'
import { Button } from '@/components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const { useGetUnreadCount, useGetNotifications, markAllAsRead, markAsRead } = useNotifications();
  const { data: unreadCount } = useGetUnreadCount();
  const { data: notifications } = useGetNotifications();
  const storeUnread = useNotificationStore((s) => s.unreadCount);
  const displayUnread = Math.max(unreadCount || 0, storeUnread || 0);

  const getDashboardLink = () => {
    if (!user) return '/';
    const routes = {
      admin: '/admin/dashboard',
      worker: '/worker/dashboard',
      employer: '/employer/dashboard',
      lawyer: '/legal/dashboard',
      ngo: '/ngo/dashboard',
    };
    return routes[user.role] || '/';
  };

  const getProfileLink = () => {
    if (user?.role === 'worker') return '/worker/profile';
    return getDashboardLink();
  };

  const getComplaintsLink = () => {
    const links = {
      worker: '/worker/complaints',
      lawyer: '/legal/cases',
      admin: '/complaints/admin',
      ngo: '/ngo/cases',
      employer: '/employer/jobs',
    };
    return links[user?.role] || '/community';
  };

  const getComplaintsLabel = () => {
    const labels = {
      worker: 'My Complaints',
      lawyer: 'Case Docket',
      ngo: 'Investigations',
      admin: 'All Complaints',
      employer: 'My Job Listings',
    };
    return labels[user?.role] || 'Dashboard';
  };

  const getComplaintsIcon = () => {
    if (user?.role === 'lawyer') return Gavel;
    if (user?.role === 'ngo') return ShieldAlert;
    if (user?.role === 'admin') return FileText;
    if (user?.role === 'employer') return Briefcase;
    return FileText;
  };

  const ComplaintsIcon = getComplaintsIcon();
  const recentNotifications = Array.isArray(notifications) ? notifications.slice(0, 5) : [];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6 md:px-10 max-w-7xl mx-auto">

        {/* Logo + Desktop Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-extrabold tracking-tighter text-foreground">
              Labor<span className="text-primary">Guard</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link to="/" className="text-sm font-semibold transition-colors hover:text-primary">Home</Link>
            <Link to="/jobs" className="text-sm font-semibold transition-colors hover:text-primary">Job Board</Link>
            <Link to="/community" className="text-sm font-semibold transition-colors hover:text-primary">Community</Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Messages */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/messages')}
                aria-label="Messages">
                <MessageSquare className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    {displayUnread > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-primary text-[9px] font-black text-white rounded-full shadow-lg shadow-primary/30">
                        {displayUnread > 99 ? '99+' : displayUnread}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0 rounded-2xl border border-slate-100 shadow-2xl" align="end" forceMount>
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Notifications</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {displayUnread > 0 ? `${displayUnread} unread` : 'All caught up'}
                      </p>
                    </div>
                    {displayUnread > 0 && (
                      <Button variant="ghost" size="sm"
                        className="text-[10px] font-bold text-primary hover:bg-primary/5 uppercase tracking-widest"
                        onClick={() => markAllAsRead?.mutate()}>
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Read All
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map((n, i) => (
                        <div key={n._id || i}
                          onClick={() => {
                            if (!n.isRead) markAsRead?.mutate(n._id);
                          }}
                          className={cn(
                            "p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer",
                            !n.isRead && "bg-primary/5"
                          )}>
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              n.type === 'message' ? 'bg-blue-100 text-blue-600' :
                              n.type === 'complaint' ? 'bg-amber-100 text-amber-600' :
                              'bg-slate-100 text-slate-500'
                            )}>
                              {n.type === 'message' ? <MessageSquare className="h-4 w-4" /> :
                               n.type === 'complaint' ? <FileText className="h-4 w-4" /> :
                               <Bell className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 line-clamp-1">{n.title}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{n.body}</p>
                              <div className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                <Clock className="h-3 w-3" />
                                {new Date(n.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            {!n.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Bell className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-400">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-50">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold text-primary hover:bg-primary/5 uppercase tracking-widest"
                      onClick={() => navigate('/notifications')}>
                      View All Notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost"
                    className="relative h-10 px-3 rounded-full flex items-center gap-2 hover:bg-slate-100"
                    aria-label="User menu">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm uppercase">
                      {user?.firstName?.charAt(0)}
                    </div>
                    <span className="hidden md:block text-sm font-bold text-slate-700">{user?.firstName}</span>
                    <ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl border shadow-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal pb-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black leading-none">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                      <Badge variant="outline" className="w-fit mt-2 text-[9px] font-black uppercase tracking-widest">
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(getDashboardLink())}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(getProfileLink())}>
                    <User className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(getComplaintsLink())}>
                    <ComplaintsIcon className="h-4 w-4" />
                    {getComplaintsLabel()}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate('/messages')}>
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate('/community')}>
                    <Globe className="h-4 w-4" />
                    Community
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-red-500 focus:text-red-500 focus:bg-red-50"
                    onClick={() => { logout(); navigate('/login'); }}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" className="font-bold text-sm">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full font-bold text-sm px-5">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* FIX: Fully completed mobile menu — was missing body content */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg">
          <nav className="px-6 py-4 space-y-1">
            <Link to="/" onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 py-3 px-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/5 transition-all">
              Home
            </Link>
            <Link to="/jobs" onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 py-3 px-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/5 transition-all">
              <Briefcase className="h-4 w-4" /> Job Board
            </Link>
            <Link to="/community" onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 py-3 px-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/5 transition-all">
              <Globe className="h-4 w-4" /> Community
            </Link>

            {isAuthenticated ? (
              <>
                <div className="h-px bg-slate-100 my-2" />
                <Link to={getDashboardLink()} onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/5 transition-all">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link to={getComplaintsLink()} onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/5 transition-all">
                  <FileText className="h-4 w-4" /> {getComplaintsLabel()}
                </Link>
                <Link to="/messages" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/5 transition-all">
                  <MessageSquare className="h-4 w-4" /> Messages
                </Link>
                <Link to={getProfileLink()} onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/5 transition-all">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <div className="h-px bg-slate-100 my-2" />
                <button
                  onClick={() => { logout(); navigate('/login'); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 py-3 px-2 w-full rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild variant="outline" className="rounded-full font-bold w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="rounded-full font-bold w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/register">Get Started</Link>
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </nav>
  );
};

export default Navbar;