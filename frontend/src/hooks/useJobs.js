import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobApi } from "@/api/jobApi";
import { toast } from "sonner";

export const useJobs = (id) => {
  const queryClient = useQueryClient();

  // Fetch all jobs with filters (public)
  const useGetJobs = (params) => useQuery({
    queryKey: ["jobs", params],
    queryFn: async () => {
      const res = await jobApi.getJobs(params);
      return res.data.data || [];
    },
    placeholderData: (prev) => prev,
  });

  // Fetch single job
  const useGetJob = (jobId) => useQuery({
    queryKey: ["job", jobId || id],
    queryFn: async () => {
      const res = await jobApi.getJobById(jobId || id);
      return res.data.data;
    },
    enabled: !!(jobId || id),
  });

  // Employer: fetch their own listings
  const useGetEmployerJobs = () => useQuery({
    queryKey: ["employer-jobs"],
    queryFn: async () => {
      const res = await jobApi.getEmployerJobs();
      return res.data.data || [];
    },
  });

  // Employer: fetch applicants for a job
  const useGetJobApplications = (jobId) => useQuery({
    queryKey: ["job-applicants", jobId],
    queryFn: async () => {
      const res = await jobApi.getJobApplications(jobId);
      return res.data.data || [];
    },
    enabled: !!jobId,
  });

  // Employer: fetch ALL applications across own jobs
  const useGetEmployerApplications = () => useQuery({
    queryKey: ["employer-applications"],
    queryFn: async () => {
      const res = await jobApi.getEmployerApplications();
      return res.data.data || [];
    },
  });

  // Worker: fetch own applications
  const useGetMyApplications = () => useQuery({
    queryKey: ["my-applications"],
    queryFn: async () => {
      const res = await jobApi.getMyApplications();
      return res.data.data || [];
    },
  });

  // FIX: was missing — createJobMutation was referenced in return but never defined
  const createJobMutation = useMutation({
    mutationFn: (data) => jobApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["employer-jobs"]);
      queryClient.invalidateQueries(["jobs"]);
      toast.success("Job posted successfully!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to post job"),
  });

  // FIX: was missing — updateJobMutation was referenced in return but never defined
  const updateJobMutation = useMutation({
    mutationFn: ({ id: jobId, data }) => jobApi.updateJob(jobId, data),
    onSuccess: (res, { id: jobId }) => {
      queryClient.invalidateQueries(["job", jobId]);
      queryClient.invalidateQueries(["employer-jobs"]);
      toast.success("Job updated successfully!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update job"),
  });

  // FIX: was missing — deleteJobMutation was referenced in return but never defined
  const deleteJobMutation = useMutation({
    mutationFn: (jobId) => jobApi.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(["employer-jobs"]);
      queryClient.invalidateQueries(["jobs"]);
      toast.success("Job deleted successfully!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete job"),
  });

  // Worker: apply for a job
  const applyForJobMutation = useMutation({
    mutationFn: ({ jobId, data }) => jobApi.applyForJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-applications"]);
      toast.success("Application submitted successfully!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to apply"),
  });

  // Employer: update an applicant's status
  const updateApplicationStatusMutation = useMutation({
    mutationFn: ({ appId, ...data }) => jobApi.updateApplicationStatus(appId, data),
    onSuccess: (res, { jobId }) => {
      queryClient.invalidateQueries(["job-applicants", jobId]);
      toast.success("Application status updated");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update status"),
  });

  return {
    useGetJobs,
    useGetJob,
    useGetEmployerJobs,
    useGetJobApplications,
    useGetEmployerApplications,
    useGetMyApplications,
    createJob:               createJobMutation,
    updateJob:               updateJobMutation,
    deleteJob:               deleteJobMutation,
    applyForJob:             applyForJobMutation,
    updateApplicationStatus: updateApplicationStatusMutation,
  };
};