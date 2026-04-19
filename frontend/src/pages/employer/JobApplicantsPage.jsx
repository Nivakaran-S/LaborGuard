import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import {
  Users, ChevronLeft, Clock, CheckCircle2, XCircle,
  FileText, BadgeCheck, MessageSquare, Briefcase,
  ArrowRight, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { Avatar, AvatarFallback } from "@/components/common/Avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/Dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const JobApplicantsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetJob, useGetJobApplications, updateApplicationStatus } = useJobs();

  const { data: job, isLoading: jobLoading } = useGetJob(id);
  const { data: applicants, isLoading: appsLoading } = useGetJobApplications(id);

  // FIX: Modal state now properly tracks which applicant + which action
  const [activeAction, setActiveAction] = useState(null); // { appId, status }
  const [formData, setFormData] = useState({
    arrivalDate: "",
    location: "",
    orgDetails: "",
    rejectionReason: "",
  });

  const handleOpenModal = (appId, status) => {
    setActiveAction({ appId, status });
    setFormData({
      arrivalDate: "",
      location: job?.location?.city || "",
      orgDetails: "",
      rejectionReason: "",
    });
  };

  // FIX: Validate required fields before submitting
  const submitStatusUpdate = async () => {
    if (!activeAction) return;
    if (
      activeAction.status === "rejected" &&
      !formData.rejectionReason.trim()
    ) {
      toast.error("Please provide rejection feedback before confirming.");
      return;
    }
    try {
      await updateApplicationStatus.mutateAsync({
        appId: activeAction.appId,
        status: activeAction.status,
        jobId: id,
        ...formData,
      });
      toast.success(
        `Application successfully ${activeAction.status}.`,
        {
          description:
            activeAction.status === "accepted"
              ? "Formal contract generated and emailed to worker."
              : "Rejection feedback sent to applicant.",
        }
      );
      setActiveAction(null);
    } catch {
      toast.error("Failed to update application status. Please try again.");
    }
  };

  if (jobLoading || appsLoading) {
    return (
      <div className="p-32 flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
          SCANNING VERIFIED PROFILES...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-20 mt-4">
      {/* Navigation */}
      <div className="flex justify-between items-center px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="rounded-full font-black uppercase tracking-widest text-[9px] text-slate-400 hover:text-primary transition-all">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Command Center
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tracking Code:</span>
          <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] tracking-widest uppercase py-1">
            APPS-REVIEW-v3
          </Badge>
        </div>
      </div>

      {/* Header */}
      <header className="space-y-3 px-4">
        <Badge
          variant="outline"
          className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full bg-primary/5">
          Talent Acquisition
        </Badge>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Review <br />
              <span className="text-primary italic">Applications.</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {job?.title}
            </p>
          </div>
        </div>
      </header>

      {/* Applicant List */}
      <div className="space-y-8 px-2">
        {!applicants || applicants.length === 0 ? (
          <div className="p-32 bg-slate-50 rounded-[56px] border-2 border-dashed border-slate-100 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-slate-200 shadow-sm border border-slate-100">
              <Users className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-slate-800 tracking-tight">
                No Candidates have Applied Yet.
              </p>
              <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed uppercase italic">
                Our engine is currently promoting this listing to verified workers in your region.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {applicants.map((app) => (
              <div
                key={app._id}
                className="bg-white p-8 md:p-12 rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-full bg-slate-50/50 -mr-10 -skew-x-12 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row gap-12">
                  {/* Left: Identity */}
                  <div className="lg:w-1/3 space-y-8">
                    <div className="flex items-center gap-5">
                      <Avatar className="h-20 w-20 ring-8 ring-slate-50 shadow-inner">
                        <AvatarFallback className="bg-primary/20 text-primary text-2xl font-black uppercase">
                          {app.workerName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">
                          {app.workerName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Identity Verified
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-5 bg-slate-50 rounded-3xl space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Communication
                        </p>
                        <p className="text-sm font-bold text-slate-700 truncate">{app.workerEmail}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          File Date: {new Date(app.appliedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Experience */}
                  <div className="flex-1 space-y-8 lg:px-10 lg:border-x lg:border-slate-100">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-4 w-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Experience Statement
                        </h4>
                      </div>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                        &ldquo;{app.workerExperience}&rdquo;
                      </p>
                    </div>

                    {app.additionalDetails && (
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Notes & Availability
                        </h4>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {app.additionalDetails}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="lg:w-1/4 flex flex-col gap-4 justify-center">
                    {/* FIX: Buttons now correctly call handleOpenModal with the applicant's ID */}
                    {app.status === "pending" && (
                      <>
                        <Button
                          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 transition-all"
                          onClick={() => handleOpenModal(app._id, "accepted")}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accept Candidate
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                          onClick={() => handleOpenModal(app._id, "rejected")}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    )}

                    {app.status === "accepted" && (
                      <div className="flex items-center gap-2 px-5 py-3 bg-green-50 rounded-2xl border border-green-100">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Accepted</span>
                      </div>
                    )}

                    {app.status === "rejected" && (
                      <div className="flex items-center gap-2 px-5 py-3 bg-red-50 rounded-2xl border border-red-100">
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Declined</span>
                      </div>
                    )}

                    {/* FIX: Direct Message button now navigates to messages with context */}
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] border-2 border-primary/10 text-primary hover:bg-primary/5 transition-all group"
                      onClick={() => navigate(`/messages?workerId=${app.workerId}`)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Direct Message
                      <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Dialog open={!!activeAction} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <div
            className={cn(
              "px-8 py-6 text-white border-b border-white/10",
              activeAction?.status === "accepted" ? "bg-green-600" : "bg-red-500"
            )}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {activeAction?.status === "accepted"
                  ? "Formalize Employment"
                  : "Decline Candidate"}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-bold text-xs">
                {activeAction?.status === "accepted"
                  ? "Configure AI Contract Variables"
                  : "Provide feedback for AI coaching"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-slate-50">
            {activeAction?.status === "accepted" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6">
                  <p className="text-[10px] uppercase font-black tracking-widest text-blue-600 flex items-center gap-2">
                    <BadgeCheck className="h-3 w-3" />
                    AI Agent Enabled
                  </p>
                  <p className="text-xs font-bold text-slate-600 mt-1">
                    Submitting this will automatically generate a legally formatted Employment Contract
                    and email it to the worker.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Arrival Date & Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monday 9:00 AM"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Site Location Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Building C, North Gate"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Organization / Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe, Supervisor"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                    value={formData.orgDetails}
                    onChange={(e) => setFormData({ ...formData, orgDetails: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeAction?.status === "rejected" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Rejection Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain why they weren't selected so they can improve..."
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all resize-none"
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setActiveAction(null)}
              className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[9px]">
              Cancel
            </Button>
            <Button
              onClick={submitStatusUpdate}
              disabled={
                updateApplicationStatus.isPending ||
                (activeAction?.status === "rejected" && !formData.rejectionReason.trim())
              }
              className={cn(
                "h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg text-white",
                activeAction?.status === "accepted"
                  ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                  : "bg-red-500 hover:bg-red-600 shadow-red-200"
              )}>
              {updateApplicationStatus.isPending ? "Processing..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobApplicantsPage;