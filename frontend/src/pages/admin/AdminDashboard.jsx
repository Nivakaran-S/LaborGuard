import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/authApi";
import { complaintApi } from "@/api/complaintApi";
import { 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Filter,
  ShieldAlert,
  Search,
  Activity,
  UserCheck,
  UserPlus,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Settings,
  Bell,
  Lock,
  Globe,
  PieChart,
  HardDrive,
  Cpu,
  RefreshCw,
  Database,
  History,
  FileText,
  Server,
  Zap,
  Terminal,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Avatar, AvatarFallback } from "@/components/common/Avatar";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminApi } from '../../api/adminApi';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "users";
    
    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [filterPending, setFilterPending] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [aiResult, setAiResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // UI States for actions
    const [isConfirmingApprove, setIsConfirmingApprove] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // Fetch users (Governance Registry)
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
             const res = await adminApi.getAllUsers();
             return res.data.data.users;
        }
    });

    const approveMutation = useMutation({
        mutationFn: (userId) => adminApi.approveUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success("User identity verified and role authorized.");
            setSelectedUser(null);
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ userId, reason }) => adminApi.rejectUser(userId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success("User registration rejected.");
            setSelectedUser(null);
        }
    });


    const analyzeMutation = useMutation({
        mutationFn: (userId) => adminApi.analyzeUserDocuments(userId),
        onMutate: () => {
            setIsAnalyzing(true);
            setAiResult(null);
        },
        onSuccess: (res) => {
            setAiResult(res.data.data);
            setIsAnalyzing(false);
            toast.success("AI Document Validation Complete.");
        },
        onError: (err) => {
            setIsAnalyzing(false);
            toast.error(err.response?.data?.message || "AI Analysis Failed");
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ userId, isActive }) => adminApi.updateUserStatus(userId, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success("User status updated successfully.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (userId) => adminApi.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success("Identity permanently deleted from registry.");
        }
    });

    const handleApprove = () => {
        approveMutation.mutate(selectedUser._id);
    };

    const handleReject = () => {
        rejectMutation.mutate({ userId: selectedUser._id, reason: rejectReason || "Did not meet verification standards." });
    };

    const handleAiValidate = () => {
        analyzeMutation.mutate(selectedUser._id);
    };

    const handleToggleStatus = (u) => {
        statusMutation.mutate({ userId: u._id, isActive: u.isActive === false });
    };

    const handleDelete = (u) => {
        deleteMutation.mutate(u._id);
    };

    const filteredUsers = (usersData || []).filter(u => {
        const matchesSearch = 
            u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPending = filterPending ? !u.isApproved : true;
        return matchesSearch && matchesPending;
    });

    if (usersLoading) return (
        <div className="p-32 flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">INITIALIZING GOVERNANCE PROTOCOLS...</p>
        </div>
    );

    const stats = [
        { label: "Total Residents", value: usersData?.length || 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
        { label: "Unverified Roles", value: usersData?.filter(u => !u.isApproved).length || 0, icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "System Uptime", value: "99.98%", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
        { label: "Audit Log Integrity", value: "100%", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50" },
    ];

    return (
        <div className="space-y-12 animate-fade-in pb-20 mt-4 px-2 lg:px-6">
            {/* Header: Root System Authority */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-4">
                    <Badge variant="outline" className="text-destructive border-red-200 font-black uppercase tracking-[0.3em] text-[10px] px-6 py-2 rounded-full bg-red-50 shadow-sm ring-2 ring-red-50/50">Root System Authority</Badge>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none">
                        Platform <br />
                        <span className="text-primary italic">Governance.</span>
                    </h1>
                    <p className="text-base font-bold text-slate-400 max-w-xl leading-relaxed uppercase italic">
                        Logged as <span className="text-slate-800 not-italic font-black">Cluster Admin</span>. Managing global state, encryption keys, and identity protocols.
                    </p>
                </div>
                
                <div className="flex gap-4">
                     <div className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-[24px] shadow-2xl">
                        {[
                            { id: "users", icon: Users, label: "Registry" },
                            { id: "health", icon: Cpu, label: "Hardware" },
                            { id: "audit", icon: History, label: "Logs" }
                        ].map((tab) => (
                            <Button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300",
                                    activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-transparent text-slate-500 hover:text-white"
                                )}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Global Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border", s.bg, s.color)}>
                                <s.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{s.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {activeTab === "users" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Search by name, email, or digital signature..." 
                                className="pl-14 h-14 rounded-[28px] bg-slate-50/50 border-none shadow-inner focus:bg-white text-sm font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant={filterPending ? "default" : "outline"}
                            onClick={() => setFilterPending(!filterPending)}
                            className={cn(
                                "h-14 px-8 rounded-full font-black uppercase tracking-widest text-[9px] transition-all",
                                filterPending ? "bg-amber-500 text-white border-none shadow-lg shadow-amber-200" : "border-2 border-slate-100 text-slate-400"
                            )}
                        >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Identity Verification Queue
                        </Button>
                    </div>

                    <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Governance Role</th>
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Status Matrix</th>
                                    <th className="p-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Vault Mgmt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.map((u) => (
                                    <tr key={u._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="p-8">
                                            <div className="flex items-center gap-6">
                                                <Avatar className="h-14 w-14 border-2 border-white shadow-sm ring-4 ring-slate-50">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">{u.firstName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{u.firstName} {u.lastName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <Badge className={cn(
                                                "px-4 py-1.5 rounded-xl font-black uppercase tracking-widest text-[8px]",
                                                u.role === 'admin' ? 'bg-red-900 text-white' : 'bg-slate-100 text-slate-500'
                                            )}>
                                                {u.role}
                                            </Badge>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-2.5 w-2.5 rounded-full", u.isApproved ? "bg-green-500 shadow-glow" : "bg-amber-500")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{u.isApproved ? "Verified" : "Pending"}</span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-right space-x-3">
                                            {!u.isApproved && (
                                                <Button 
                                                    size="sm" 
                                                    className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[9px] bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100"
                                                    onClick={() => setSelectedUser(u)}
                                                >
                                                    Review & Validate
                                                </Button>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-all">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-100 bg-white">
                                                    {u.isApproved && (
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(u)} className="rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-widest cursor-pointer mb-1 hover:bg-slate-50">
                                                            {u.isActive === false ? "Activate Account" : "Deactivate Account"}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDelete(u)} className="rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-widest cursor-pointer text-red-600 focus:text-red-700 hover:bg-red-50 focus:bg-red-50">
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Identity
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "health" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-5 duration-700">
                    <div className="bg-slate-900 rounded-[64px] p-16 text-white space-y-12 shadow-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-60 h-60 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-4">
                                    <Server className="h-8 w-8 text-primary shadow-glow-primary" />
                                    Cluster Diagnostics
                                </h3>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic">Global Microservices Pipeline Status</p>
                            </div>
                            <Button variant="outline" className="h-14 w-14 rounded-[24px] border-white/10 hover:bg-white/5 p-0 transition-all">
                                <RefreshCw className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-6 relative z-10">
                            {[
                                { name: "Auth Vault Interface", status: "Operational", lat: "12ms", icon: Lock },
                                { name: "Case Intelligence Core", status: "Operational", lat: "24ms", icon: Database },
                                { name: "Messaging Uplink", status: "Optimized", lat: "8ms", icon: Zap },
                                { name: "Advocacy Engine", status: "Operational", lat: "18ms", icon: Globe },
                            ].map((svc, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[36px] border border-white/10 group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="h-12 w-12 rounded-[20px] bg-slate-800 flex items-center justify-center border border-white/5">
                                            <svc.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-widest leading-none mb-1">{svc.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{svc.lat} Average Latency</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-green-500/10 text-green-400 border-none font-black text-[9px] uppercase px-4 py-1.5 shadow-sm">
                                        {svc.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[64px] p-16 border border-slate-100 shadow-xl space-y-12 relative overflow-hidden">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-4 text-slate-900">
                                <HardDrive className="h-8 w-8 text-primary" />
                                Hardware Integrity
                            </h3>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">Cloud Infrastructure Resource Allocation</p>
                        </div>
                        <div className="space-y-12">
                            {[
                                { label: "Vault Cloud Storage", val: "42%", cap: "1.0 PB", color: "bg-primary" },
                                { label: "Concurrent Request Load", val: "124", cap: "10K", color: "bg-blue-500" },
                                { label: "Global Key Health", val: "100%", cap: "ROTATION: 12d", color: "bg-green-500" },
                            ].map((m, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{m.label}</span>
                                        <span className="text-base font-black text-slate-900">{m.val} <span className="text-xs text-slate-300 font-bold ml-1">/ {m.cap}</span></span>
                                    </div>
                                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                        <div className={cn("h-full rounded-full shadow-glow transition-all duration-1000", m.color || "bg-primary")} style={{ width: m.val }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-10 bg-red-50 rounded-[48px] border-2 border-red-100 space-y-6 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 h-40 w-40 bg-red-100 rounded-full -mr-20 -mt-20 blur-[60px] opacity-20" />
                            <div className="flex items-center gap-4">
                                <AlertTriangle className="h-6 w-6 text-red-500 shadow-glow-red" />
                                <h4 className="text-sm font-black uppercase tracking-tight text-red-700">Protocol: Emergency Sanitization</h4>
                            </div>
                            <p className="text-[11px] font-bold text-red-500/70 leading-relaxed uppercase italic">Manual purge and global session termination are authorized only via secure physical terminal keys.</p>
                            <Button className="w-full h-16 rounded-[28px] bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-200 transition-all hover:scale-[1.02]">
                                Global Unauthorized Handshake Reset
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "audit" && (
                <div className="bg-slate-50 rounded-[64px] border border-slate-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-700">
                    <div className="p-12 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic flex items-center gap-4">
                                <Terminal className="h-8 w-8 text-slate-800" />
                                Immutable Record
                            </h3>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">End-to-end cryptographic history of system governance actions.</p>
                        </div>
                        <Button variant="outline" className="h-14 px-10 rounded-[28px] border-slate-200 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm transition-all hover:bg-slate-50">
                            Download Cryptographic Proof (.PDF)
                        </Button>
                    </div>
                    <div className="p-12 space-y-6">
                        {[
                            { action: "ROLE_ELEVATION", actor: "ROOT", meta: "Moderator -> Cluster Admin", time: "2m", status: "HASHED" },
                            { action: "CRYPTO_KEY_ROTATION", actor: "SYSTEM", meta: "RS256 Private key rolled", time: "14m", status: "VERIFIED" },
                            { action: "AUDIT_RECONCILIATION", actor: "SEC_OPS", meta: "Database consistency check: 100%", time: "1h", status: "SIGNED" },
                            { action: "USER_SANCTION", actor: "ADMIN_02", meta: "Suspicious identity quarantined", time: "3h", status: "PENDING" },
                        ].map((log, i) => (
                            <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white rounded-[40px] border border-slate-100 group hover:border-slate-300 transition-all shadow-sm">
                                <div className="flex items-center gap-8">
                                    <div className="h-14 w-14 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex gap-2 mb-2">
                                            <Badge className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 uppercase">{log.action}</Badge>
                                            <Badge className="bg-green-50 text-green-600 border-none text-[8px] font-black uppercase">{log.status}</Badge>
                                        </div>
                                        <p className="text-base font-black text-slate-900 tracking-tight">{log.actor}</p>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight italic">{log.meta}</p>
                                    </div>
                                </div>
                                <div className="text-right mt-6 md:mt-0 space-y-1">
                                    <p className="text-xl font-black text-slate-900 tracking-tighter">{log.time} <span className="text-[9px] uppercase text-slate-300 tracking-widest font-bold">AGO</span></p>
                                    <p className="text-[10px] font-mono text-slate-300">0x76a...92b4</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        {/* Identity Verification Modal */}
        <Dialog open={!!selectedUser} onOpenChange={() => {
            setSelectedUser(null);
            setAiResult(null);
            setIsConfirmingApprove(false);
            setIsRejecting(false);
            setRejectReason("");
        }}>
            <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden rounded-[40px] border-none shadow-3xl bg-white max-h-[95vh] flex flex-col">
                <div className="bg-slate-900 px-8 py-5 text-white flex items-center justify-between gap-4 border-b border-white/5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                             <Badge className="bg-amber-500/20 text-amber-500 border-none px-3 py-1 rounded-full font-black uppercase tracking-widest text-[8px]">Review Protocol</Badge>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">ID: {selectedUser?._id?.substring(0,8)}</span>
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                Verify <span className="text-primary italic">{selectedUser?.firstName} {selectedUser?.lastName}</span>
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Assigned Role</p>
                        <Badge className="bg-white/10 text-white border-none font-bold text-xs uppercase px-4 py-1 rounded-lg">{selectedUser?.role}</Badge>
                    </div>
                </div>

                <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* Documents View */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Support Documents
                            </h4>
                            <Badge variant="outline" className="text-[9px] font-bold">{selectedUser?.documents?.length || 0} Files Attached</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedUser?.documents?.map((doc, i) => (
                                <a 
                                    key={i} 
                                    href={`http://localhost:5001/api/auth/documents/${doc}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between group hover:border-primary/30 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">Document_{i+1}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* AI Validation Panel */}
                    <div className="space-y-6">
                        <div className="p-0.5 bg-slate-50/50 rounded-[32px] border border-slate-100">
                             <div className={cn(
                                "p-8 rounded-[30px] space-y-6 transition-all duration-500",
                                aiResult ? (aiResult.isValid ? "bg-green-50/50 border border-green-100" : "bg-red-50/50 border border-red-100") : "bg-white"
                             )}>
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                         <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <Cpu className="h-4 w-4" />
                                            Groq Llama Intelligence
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">Multi-modal identity correlation</p>
                                    </div>
                                    {!aiResult && (
                                        <Button 
                                            onClick={handleAiValidate}
                                            disabled={isAnalyzing || analyzeMutation.isPending}
                                            className="h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-purple-200 transition-all active:scale-95"
                                        >
                                            {isAnalyzing || analyzeMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "AI Validate"}
                                        </Button>
                                    )}
                                </div>

                                {aiResult && (
                                    <div className="space-y-8 animate-in fade-in duration-700">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "h-20 w-20 rounded-[32px] flex items-center justify-center text-4xl font-black shadow-2xl shrink-0",
                                                aiResult.isValid ? "bg-green-500 text-white shadow-green-200" : "bg-red-500 text-white shadow-red-200"
                                            )}>
                                                {aiResult.validationScore}%
                                            </div>
                                            <div>
                                                <Badge className={cn(
                                                    "px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px] mb-2",
                                                    aiResult.isValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    Result: {aiResult.assessment}
                                                </Badge>
                                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                    Heuristic Conclusion
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-8">
                                            <div className="space-y-3 bg-white/60 p-6 rounded-3xl border border-white/40 shadow-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                    <FileText className="h-3 w-3" />
                                                    Document Summary
                                                </p>
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                                                    "{aiResult.summary}"
                                                </p>
                                            </div>

                                            <div className="space-y-3 bg-white/60 p-6 rounded-3xl border border-white/40 shadow-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Appropriateness Assessment
                                                </p>
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                                                    "{aiResult.appropriateness}"
                                                </p>
                                            </div>

                                            <div className="space-y-3 bg-white/60 p-6 rounded-3xl border border-white/40 shadow-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                    <Terminal className="h-3 w-3" />
                                                    Detailed Reasoning
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                                    "{aiResult.reasoning}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-4">
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Information Found</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {aiResult.details.foundInformation.map((info, i) => (
                                                        <Badge key={i} variant="outline" className="text-[8px] border-slate-200 bg-white/50">{info}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Concerns / Notes</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {aiResult.details.concerns.map((note, i) => (
                                                        <Badge key={i} variant="outline" className="text-[8px] border-red-200 text-red-500 bg-white/50">{note}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!aiResult && !isAnalyzing && (
                                    <div className="py-10 text-center space-y-4">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-dashed border-slate-200">
                                            <ShieldCheck className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase italic">Click validate to run AI heuristics on the attached proof.</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-end shadow-inner transition-all duration-300">
                    {isConfirmingApprove ? (
                        <div className="flex w-full items-center justify-between animate-in fade-in zoom-in-95">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest pl-2">Confirm Authorization?</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setIsConfirmingApprove(false)} className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px]">Cancel</Button>
                                <Button onClick={handleApprove} disabled={approveMutation.isPending} className="h-12 px-8 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-200">
                                    {approveMutation.isPending ? "Hold..." : "Yes, Authorize"}
                                </Button>
                            </div>
                        </div>
                    ) : isRejecting ? (
                        <div className="flex w-full items-center gap-3 animate-in fade-in zoom-in-95">
                            <Input 
                                placeholder="Reason for rejection (e.g. invalid document)..." 
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="flex-1 h-12 rounded-xl text-xs font-bold"
                                autoFocus
                            />
                            <Button variant="ghost" onClick={() => setIsRejecting(false)} className="h-12 px-4 rounded-xl font-bold uppercase tracking-widest text-[9px]">Cancel</Button>
                            <Button 
                                onClick={handleReject} 
                                disabled={rejectMutation.isPending || !rejectReason.trim()} 
                                className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-200"
                            >
                                {rejectMutation.isPending ? "Hold..." : "Confirm Reject"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-end gap-3 fade-in">
                            <Button variant="ghost" onClick={() => setSelectedUser(null)} className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-[9px]">Close</Button>
                            <Button variant="outline" onClick={() => setIsRejecting(true)} disabled={rejectMutation.isPending || approveMutation.isPending} className="h-14 px-6 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black uppercase tracking-widest text-[9px] shadow-sm">
                                Reject
                            </Button>
                            <Button className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-green-100" onClick={() => setIsConfirmingApprove(true)} disabled={approveMutation.isPending}>
                                APPROVE IDENTITY
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    );
};

export default AdminDashboard;
