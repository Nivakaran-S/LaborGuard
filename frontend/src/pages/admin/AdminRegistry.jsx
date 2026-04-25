import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Gavel, Plus, Search, ShieldCheck, RefreshCw, UserCheck,
  Mail, Tag, Loader2, BadgeCheck, BadgeX
} from "lucide-react";
import { registryApi } from "@/api/registryApi";
import { adminApi } from "@/api/adminApi";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter
} from "@/components/common/Modal";
import { cn } from "@/lib/utils";

const SPECIALIZATIONS = [
  { value: "labor_law",          label: "Labor Law",          desc: "wage_theft, wrongful_termination" },
  { value: "harassment_law",     label: "Harassment Law",     desc: "harassment cases" },
  { value: "discrimination_law", label: "Discrimination Law", desc: "discrimination cases" },
];

const AdminRegistry = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  // Form state
  const [form, setForm] = useState({
    officerId: "",
    name: "",
    email: "",
    specializations: [],
  });

  // Lookup: pull approved lawyer users from auth-service so admins can pick by
  // person rather than pasting a Mongo ObjectId.
  const { data: lawyerUsers = [] } = useQuery({
    queryKey: ["admin-lawyer-users"],
    queryFn: async () => {
      const res = await adminApi.getAllUsers({ role: "lawyer", limit: 100 });
      const users = res.data?.data?.users || res.data?.users || res.data?.data || [];
      return users.filter((u) => u.isApproved !== false && u.isActive !== false);
    },
  });

  const { data: registryData, isLoading, refetch } = useQuery({
    queryKey: ["registry-list"],
    queryFn: async () => {
      const res = await registryApi.getAllOfficers({ limit: 100 });
      return res.data?.data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["registry-stats"],
    queryFn: async () => {
      const res = await registryApi.getStats();
      return res.data?.data || null;
    },
  });

  const officers = useMemo(() => {
    const list = Array.isArray(registryData) ? registryData : [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((o) =>
      (o.name || "").toLowerCase().includes(term) ||
      (o.email || "").toLowerCase().includes(term)
    );
  }, [registryData, search]);

  const registerMutation = useMutation({
    mutationFn: (payload) => registryApi.registerOfficer(payload),
    onSuccess: () => {
      toast.success("Officer registered. They are now eligible for auto-booking.");
      queryClient.invalidateQueries({ queryKey: ["registry-list"] });
      queryClient.invalidateQueries({ queryKey: ["registry-stats"] });
      setShowRegisterModal(false);
      setForm({ officerId: "", name: "", email: "", specializations: [] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to register officer");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (officerId) => registryApi.deactivateOfficer(officerId),
    onSuccess: () => {
      toast.success("Officer deactivated. They will no longer be auto-assigned.");
      queryClient.invalidateQueries({ queryKey: ["registry-list"] });
      queryClient.invalidateQueries({ queryKey: ["registry-stats"] });
      setDeactivateTarget(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to deactivate officer");
    },
  });

  // Auto-fill name + email when admin picks a user from the dropdown
  const onPickLawyer = (userId) => {
    if (!userId) {
      setForm((f) => ({ ...f, officerId: "", name: "", email: "" }));
      return;
    }
    const u = lawyerUsers.find((lu) => (lu._id || lu.userId) === userId);
    if (u) {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
      setForm((f) => ({
        ...f,
        officerId: u._id || u.userId,
        name: name || u.email,
        email: u.email,
      }));
    }
  };

  const toggleSpec = (value) => {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(value)
        ? f.specializations.filter((s) => s !== value)
        : [...f.specializations, value],
    }));
  };

  const handleRegister = (e) => {
    e?.preventDefault?.();
    if (!form.officerId || !form.name || !form.email || form.specializations.length === 0) {
      toast.error("Fill all fields and pick at least one specialization");
      return;
    }
    registerMutation.mutate(form);
  };

  // Officers already registered — exclude them from the dropdown so admins
  // can't double-register
  const registeredIds = new Set((registryData || []).map((o) => String(o.officerId)));
  const availableLawyers = lawyerUsers.filter(
    (u) => !registeredIds.has(String(u._id || u.userId))
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 md:p-8 xl:p-12">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Admin Console</p>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2 flex items-center gap-3">
                <Gavel className="h-7 w-7 text-primary" />
                Legal Officer Registry
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Officers in this registry are eligible for auto-booking when complaints
                are routed to <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">under_review</code>.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="rounded-full px-5 font-black uppercase tracking-widest text-xs"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowRegisterModal(true)}
                className="rounded-full px-5 font-black uppercase tracking-widest text-xs"
              >
                <Plus className="h-4 w-4 mr-2" />
                Register Officer
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total",                    value: stats?.totalOfficers || 0 },
            { label: "Active",                   value: stats?.activeOfficers || 0 },
            { label: "Labor Law",                value: stats?.bySpecialization?.labor_law || 0 },
            { label: "Harassment / Discrimination", value: (stats?.bySpecialization?.harassment_law || 0) + (stats?.bySpecialization?.discrimination_law || 0) },
          ].map((s, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
              <div className="mt-4 text-3xl font-extrabold text-slate-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 rounded-2xl border-slate-200 bg-slate-50/50 h-12 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center">
              <Spinner size="lg" />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Loading registry...
              </p>
            </div>
          ) : officers.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="No officers registered yet"
              description="Auto-booking will fail until at least one active officer is registered for the relevant specialization."
              action={{
                label: "Register First Officer",
                onClick: () => setShowRegisterModal(true),
              }}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {officers.map((o) => (
                <div key={o._id} className="p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 truncate">{o.name}</p>
                        {o.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] tracking-widest uppercase">
                            <BadgeCheck className="h-3 w-3 mr-1" />Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] tracking-widest uppercase">
                            <BadgeX className="h-3 w-3 mr-1" />Deactivated
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                        <Mail className="h-3 w-3" />{o.email}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(o.specializations || []).map((s) => (
                          <Badge key={s} className="bg-blue-50 text-blue-700 border-none font-bold text-[9px] tracking-widest uppercase">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {s.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Cases</p>
                      <p className="text-2xl font-extrabold text-slate-800">{o.activeAppointmentCount || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
                      <p className="text-2xl font-extrabold text-slate-800">{o.totalAssigned || 0}</p>
                    </div>
                    {o.isActive && (
                      <Button
                        variant="outline"
                        onClick={() => setDeactivateTarget(o)}
                        className="rounded-full font-black uppercase tracking-widest text-[10px] text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      <Modal open={showRegisterModal} onOpenChange={(v) => !v && setShowRegisterModal(false)}>
        <ModalContent className="sm:max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Register Legal Officer
            </ModalTitle>
            <ModalDescription>
              Pick an approved lawyer from the user directory and assign their case-type
              specializations. They become eligible for auto-assignment immediately.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleRegister} className="space-y-4 px-6 pb-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                Lawyer
              </label>
              <select
                value={form.officerId}
                onChange={(e) => onPickLawyer(e.target.value)}
                className="w-full h-11 rounded-2xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  {availableLawyers.length === 0
                    ? "No approved lawyer accounts available"
                    : "Select a lawyer..."}
                </option>
                {availableLawyers.map((u) => (
                  <option key={u._id || u.userId} value={u._id || u.userId}>
                    {u.firstName} {u.lastName} — {u.email}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Only approved lawyer-role users not already in the registry are shown.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Display name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="rounded-2xl"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Email
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="lawyer@example.com"
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                Specializations (pick at least one)
              </label>
              <div className="space-y-2">
                {SPECIALIZATIONS.map((s) => {
                  const checked = form.specializations.includes(s.value);
                  return (
                    <label
                      key={s.value}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-colors",
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSpec(s.value)}
                        className="mt-1 h-4 w-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-black text-slate-900">{s.label}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{s.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </form>

          <ModalFooter className="bg-slate-50 p-4 sm:p-6 sm:flex-row-reverse sm:justify-start gap-3 border-t mt-2">
            <Button
              onClick={handleRegister}
              loading={registerMutation.isPending}
              className="rounded-full px-8 font-bold shadow-md"
            >
              {registerMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering...</>
              ) : (
                "Register Officer"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowRegisterModal(false)}
              disabled={registerMutation.isPending}
              className="rounded-full px-8 font-bold text-slate-500"
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => !deactivateMutation.isPending && setDeactivateTarget(null)}
        onConfirm={() => deactivateMutation.mutate(deactivateTarget?.officerId)}
        title={`Deactivate ${deactivateTarget?.name || "this officer"}?`}
        description="They will stop receiving auto-bookings immediately. Existing appointments are unaffected."
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
};

export default AdminRegistry;
