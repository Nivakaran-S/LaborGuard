import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const JobDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    // Application Modal State
    const [selectedJob, setSelectedJob] = useState(null);
    const [experience, setExperience] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const JOBS_API = `${import.meta.env.VITE_JOB_SERVICE_URL || 'http://localhost:5006'}/api/jobs`;
    const userRole = localStorage.getItem('userRole');

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [jobsRes, appsRes] = await Promise.all([
                axios.get(JOBS_API),
                token && userRole === 'worker' ? axios.get(`${JOBS_API}/my-applications`, { headers }) : Promise.resolve({ data: { data: [] } })
            ]);

            setJobs(jobsRes.data.data);
            setMyApplications(appsRes.data.data || []);
            setError('');
        } catch (err) {
            setError('Failed to fetch jobs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${JOBS_API}/${selectedJob._id}/apply`, {
                workerExperience: experience,
                additionalDetails: details
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Application submitted successfully!');
            setSelectedJob(null);
            setExperience('');
            setDetails('');
            fetchJobs();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to apply');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.delete(`${JOBS_API}/${pendingDeleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Job deleted');
            fetchJobs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete job');
        } finally {
            setPendingDeleteId(null);
        }
    };

    const handleApplyClick = (job) => {
        if (!userRole) {
            // Guest -> Redirect to login
            navigate('/login');
            return;
        }

        if (userRole !== 'worker') {
            // Other Role (Employer/Admin) -> Show toast
            toast.info('Only registered workers can apply to this vacancy.');
            return;
        }

        // Worker -> Show modal
        setSelectedJob(job);
    };

    const hasApplied = (jobId) => myApplications.some(app => app.jobId?._id === jobId);

    return (
        <div className="min-h-[calc(100vh-70px)] bg-bg-secondary p-4 md:p-10 flex justify-center">
            <div className="w-full max-w-[1400px] animate-[fadeIn_0.4s_ease-out]">
                <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/60 pb-6">
                    <div>
                        <h1 className="text-[2.5rem] md:text-[2.8rem] font-extrabold text-text-primary mb-1">Opportunity Portal</h1>
                        <p className="font-semibold text-text-secondary">Official Vacancies For Informal Workers</p>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6 md:mt-0">
                        {(userRole === 'employer' || userRole === 'admin') && (
                            <button className="bg-accent-primary text-white border-none py-3.5 px-6 rounded-xl font-bold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,137,245,0.3)] shadow-[0_4px_15px_rgba(37,137,245,0.2)]" onClick={() => navigate('/jobs/new')}>
                                + Create Vacancy
                            </button>
                        )}
                        <button className="bg-white text-text-primary border border-slate-200 py-3.5 px-6 rounded-xl font-bold cursor-pointer transition-all hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/dashboard')}>
                            Command Center
                        </button>
                    </div>
                </div>

                {success && <div className="bg-[#dcfce7] border border-[#bbf7d0] text-[#166534] px-5 py-4 rounded-lg font-medium mb-8 animate-[fadeIn_0.3s_ease] shadow-sm">{success}</div>}

                {loading ? (
                    <div className="text-center p-20">
                        <div className="w-12 h-12 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto"></div>
                        <p className="mt-6 font-bold text-text-secondary">Syncing vacancies...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {jobs.map(job => (
                            <div key={job._id} className="bg-white rounded-[20px] shadow-main border border-slate-200/80 hover:shadow-hover transition-all duration-200 p-0 overflow-hidden flex flex-col h-full group">
                                <div className="h-[200px] bg-cover bg-center relative transition-transform duration-500 overflow-hidden" style={{ backgroundImage: `url(${job.imageUrl})` }}>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
                                    <div className="absolute bottom-4 left-6 right-6 text-white group-hover:-translate-y-1 transition-transform duration-300">
                                        <div className="text-[0.7rem] font-extrabold uppercase tracking-[1px] opacity-90 mb-1">{job.jobType}</div>
                                        <h3 className="m-0 text-[1.4rem] font-extrabold leading-[1.2] text-white">{job.title}</h3>
                                    </div>
                                </div>

                                <div className="p-7 flex flex-col flex-1">
                                    <div className="flex gap-3 mb-5">
                                        <div className="bg-[#f1f5f9] text-text-primary px-3 py-1.5 rounded-lg text-[0.75rem] font-extrabold uppercase flex items-center">
                                            💰 {job.wage.amount} {job.wage.currency} / {job.wage.frequency}
                                        </div>
                                        <div className="bg-[#f1f5f9] text-text-primary px-3 py-1.5 rounded-lg text-[0.75rem] font-extrabold uppercase flex items-center">
                                            📍 {job.location?.city || 'Remote'}
                                        </div>
                                    </div>

                                    <p className="text-text-secondary text-[0.95rem] leading-[1.6] mb-8 flex-1">
                                        {job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description}
                                    </p>

                                    <div className="flex justify-between items-center mt-auto pt-5 border-t border-[#f1f5f9]">
                                        {userRole === 'worker' && hasApplied(job._id) ? (
                                            <button disabled className="w-full bg-[#dcfce7] text-[#166534] border-none py-3.5 px-3 rounded-xl font-bold text-center transition-all cursor-not-allowed">Applied Successfully ✓</button>
                                        ) : (
                                            <button className="w-full bg-[#f8fafc] text-text-primary border border-[#e2e8f0] py-3.5 px-3 rounded-xl font-bold cursor-pointer transition-all hover:bg-accent-primary hover:text-white hover:border-accent-primary text-center" onClick={() => handleApplyClick(job)}>Apply Now</button>
                                        )}
 
                                        {(userRole === 'admin' || userRole === 'employer') && (
                                            <button
                                                onClick={() => setPendingDeleteId(job._id)}
                                                className="ml-4 bg-[#fee2e2] text-accent-danger border-none pt-[0.8rem] pb-[0.8rem] px-4 rounded-xl cursor-pointer transition-transform duration-200 hover:scale-110 flex items-center justify-center"
                                            >🗑️</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!pendingDeleteId}
                onClose={() => setPendingDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete job?"
                description="This permanently removes the job posting."
                confirmLabel="Delete"
                variant="destructive"
            />

            {/* APPLICATION MODAL */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-4">
                    <div className="bg-white rounded-[20px] shadow-main border border-slate-200/80 max-w-[600px] w-full p-10 relative animate-[fadeIn_0.3s_ease-out]">
                        <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 bg-transparent border-none text-[1.5rem] cursor-pointer text-text-secondary hover:text-text-primary transition-colors">✕</button>

                        <div className="mb-8 border-b border-slate-100 pb-6">
                            <span className="text-[0.85rem] font-extrabold text-accent-primary uppercase tracking-wide">Submitting Application For</span>
                            <h2 className="text-[1.8rem] font-extrabold text-text-primary mt-1 mb-0">{selectedJob.title}</h2>
                        </div>

                        <form onSubmit={handleApplySubmit}>
                            <div className="mb-6">
                                <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">1. Your Relevant Experience</label>
                                <textarea
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-xl font-sans text-[1rem] leading-relaxed transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)] min-h-[120px] resize-y"
                                    placeholder="Describe your past work, skills, and why you're a good fit for this role..."
                                    value={experience}
                                    onChange={(e) => setExperience(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-8">
                                <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">2. Additional Details (Availability/Phone)</label>
                                <textarea
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-xl font-sans text-[1rem] leading-relaxed transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)] min-h-[80px] resize-y"
                                    placeholder="Any Other info for the employer?"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button type="submit" className="flex-[2] bg-accent-primary text-white border-none py-4 px-4 rounded-[50px] text-[1.05rem] font-bold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,137,245,0.3)] shadow-[0_4px_15px_rgba(37,137,245,0.2)] text-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none" disabled={submitting}>
                                    {submitting ? 'Submitting Portfolio...' : '🚀 Submit My Application'}
                                </button>
                                <button type="button" className="flex-1 bg-white text-text-primary border border-black/10 py-4 px-4 rounded-[50px] text-[1.05rem] font-bold cursor-pointer transition-all hover:bg-slate-50 hover:-translate-y-0.5 shadow-[0_2px_5px_rgba(0,0,0,0.02)] hover:shadow-md text-center" onClick={() => setSelectedJob(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDashboard;
