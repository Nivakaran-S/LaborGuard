import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    
    // Role-specific data
    const [workerStats, setWorkerStats] = useState({ total: 0, pending: 0, approved: 0 });
    const [applications, setApplications] = useState([]);
    const [employerApplications, setEmployerApplications] = useState([]);
    
    const [adminUsers, setAdminUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    const AUTH_API = 'http://localhost:5001/api';
    const JOBS_API = 'http://localhost:5006/api';
    const COMPLAINT_API = 'http://localhost:3003/api';

    const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return navigate('/login');

            // 1. Fetch Basic Profile
            const profileRes = await axios.get(`${AUTH_API}/users/me`, { headers: getHeaders() });
            const userData = profileRes.data.data;
            setProfile(userData);
            localStorage.setItem('userRole', userData.role);

            // 2. Fetch Role-Specific Data in Parallel
            if (userData.role === 'worker') {
                const appsRes = await axios.get(`${JOBS_API}/jobs/my-applications`, { headers: getHeaders() }).catch(() => ({ data: { data: [] } }));
                const apps = appsRes.data.data || [];
                setApplications(apps);
                setWorkerStats({
                    total: apps.length,
                    pending: apps.filter(a => a.status === 'pending').length,
                    approved: apps.filter(a => a.status === 'accepted').length
                });
            } else if (userData.role === 'employer') {
                const [jobsRes, appsRes] = await Promise.all([
                    axios.get(`${JOBS_API}/jobs?employerId=${userData.userId}`, { headers: getHeaders() }).catch(() => ({ data: { data: [] } })),
                    axios.get(`${JOBS_API}/jobs/employer/applications`, { headers: getHeaders() }).catch(() => ({ data: { data: [] } }))
                ]);
                setJobs(jobsRes.data.data || []);
                setEmployerApplications(appsRes.data.data || []);
            } else if (userData.role === 'admin') {
                const [usersRes, complaintsRes, jobsRes] = await Promise.all([
                    axios.get(`${AUTH_API}/admin/users`, { headers: getHeaders() }).catch(() => ({ data: { data: { users: [] } } })),
                    axios.get(`${COMPLAINT_API}/complaints`, { headers: getHeaders() }).catch(() => ({ data: { data: [] } })),
                    axios.get(`${JOBS_API}/jobs`, { headers: getHeaders() }).catch(() => ({ data: { data: [] } }))
                ]);
                setAdminUsers(usersRes.data.data.users || []);
                setComplaints(complaintsRes.data.data || []);
                setJobs(jobsRes.data.data || []);
            }
        } catch (err) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('accessToken');
            setTimeout(() => navigate('/login'), 2000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [navigate]);

    // ADMIN ACTIONS
    const handleApproval = async (userId) => {
        try {
            await axios.put(`${AUTH_API}/admin/users/${userId}/approve`, {}, { headers: getHeaders() });
            setSuccess('User registration approved!');
            fetchDashboardData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) { alert(err.response?.data?.message || 'Approval failed'); }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Permanently delete this user?')) {
            try {
                await axios.delete(`${AUTH_API}/admin/users/${userId}`, { headers: getHeaders() });
                setSuccess('User removed from platform');
                fetchDashboardData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) { alert('Deletion failed'); }
        }
    };

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            await axios.put(`${JOBS_API}/jobs/applications/${appId}/status`, { status: newStatus }, { headers: getHeaders() });
            setSuccess(`Application ${newStatus} successfully! Notification sent.`);
            fetchDashboardData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) return (
        <div className="min-h-[calc(100vh-70px)] bg-bg-secondary p-4 md:p-10 flex justify-center items-start">
            <div className="text-center mt-40">
                <div className="w-12 h-12 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto"></div>
                <p className="mt-6 font-bold text-text-primary text-xl">Initializing Mission Control...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-70px)] bg-bg-secondary p-4 md:p-8 xl:p-12 flex justify-center">
            <div className="w-full max-w-[1400px] animate-[fadeIn_0.5s_ease-out]">
                {/* Header Information */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <span className="text-[0.9rem] text-text-secondary font-extrabold uppercase tracking-wider block mb-1">
                            {profile.role === 'admin' ? 'Administrative Access' : profile.role === 'employer' ? 'Management Portal' : 'Worker Portal'}
                        </span>
                        <h1 className="text-[2.2rem] md:text-[2.8rem] font-extrabold text-text-primary m-0 tracking-tight leading-none">
                            {profile.role === 'admin' ? 'Platform Governance' : profile.role === 'employer' ? 'Workforce Management' : 'Command Center'}
                        </h1>
                    </div>
                </div>

                {success && <div className="bg-[#dcfce7] border border-[#bbf7d0] text-[#166534] px-5 py-4 rounded-xl font-medium mb-8 animate-[fadeIn_0.3s_ease] shadow-sm">{success}</div>}

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300">
                        <div className="text-[0.9rem] uppercase tracking-wider text-text-secondary font-bold mb-3">Complaint center</div>
                        <div className="text-[1.9rem] font-extrabold text-text-primary mb-2">{profile.role === 'worker' ? 'Track your cases' : profile.role === 'admin' ? 'Review every complaint' : 'Officer action center'}</div>
                        <div className="text-[0.95rem] text-text-secondary">{profile.role === 'worker' ? 'Submit and monitor complaints from your portal.' : profile.role === 'admin' ? 'Open the admin complaint board for full case control.' : 'View your assigned officer workspace and update status.'}</div>
                    </div>
                    <div className="bg-[#f8fafc] rounded-[20px] p-6 shadow-main border border-slate-200/80">
                        <div className="text-[0.85rem] uppercase tracking-wider text-text-secondary font-semibold mb-3">Tip</div>
                        <p className="text-text-secondary leading-relaxed">Use the complaint module to access the most important labor dispute actions in one place.</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 flex flex-col justify-between">
                        <div>
                            <div className="text-[0.85rem] uppercase tracking-wider text-text-secondary font-semibold mb-3">Quick link</div>
                            <div className="text-[1rem] font-bold text-text-primary">{profile.role === 'worker' ? 'Launch your complaint dashboard' : profile.role === 'admin' ? 'Open complaint management' : 'Access officer resources'}</div>
                        </div>
                    </div>
                </div>

                {/* ROLE: ADMIN VIEW */}
                {profile.role === 'admin' ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col cursor-pointer" onClick={() => setActiveTab('users')}>
                                <span className="text-[0.9rem] text-text-primary font-bold uppercase tracking-wider mb-2">Pending Access</span>
                                <div className="text-[3rem] font-extrabold leading-none text-[#f59e0b] mb-1">{adminUsers.filter(u => !u.isApproved && u.role !== 'worker').length}</div>
                                <div className="text-[0.85rem] text-text-secondary font-medium">Sign-up requests</div>
                            </div>
                            <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col cursor-pointer" onClick={() => setActiveTab('disputes')}>
                                <span className="text-[0.9rem] text-text-primary font-bold uppercase tracking-wider mb-2">Active Disputes</span>
                                <div className="text-[3rem] font-extrabold leading-none text-accent-primary mb-1">{complaints.filter(c => c.status !== 'resolved').length}</div>
                                <div className="text-[0.85rem] text-text-secondary font-medium">Pending resolution</div>
                            </div>
                            <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col">
                                <span className="text-[0.9rem] text-text-primary font-bold uppercase tracking-wider mb-2">Job Postings</span>
                                <div className="text-[3rem] font-extrabold leading-none text-text-primary mb-1">{jobs.length}</div>
                                <div className="text-[0.85rem] text-text-secondary font-medium">Total vacancies</div>
                            </div>
                            <div className="bg-accent-primary rounded-[20px] p-6 shadow-[0_10px_25px_rgba(37,137,245,0.3)] hover:-translate-y-1 transition-all duration-300 flex justify-center items-center flex-col text-white">
                                <span className="text-[0.9rem] font-bold uppercase tracking-wider mb-2 text-white/90">Platform Trust</span>
                                <div className="text-[2.5rem] font-extrabold leading-none mb-1 text-white">High</div>
                                <div className="text-[0.85rem] font-medium text-white/90">Secure Governance</div>
                            </div>
                        </div>

                        {/* Admin Multi-Tab Layout */}
                        <div className="bg-white rounded-[20px] p-8 shadow-main border border-slate-200/80 mt-10 min-h-[500px]">
                            <div className="border-b-2 border-[#f1f5f9] mb-6">
                                <div className="flex gap-8 overflow-x-auto">
                                    <button onClick={() => setActiveTab('overview')} className={`pb-4 px-2 whitespace-nowrap bg-transparent border-none border-b-[3px] font-extrabold cursor-pointer transition-all duration-200 text-[1rem] ${activeTab === 'overview' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Requests</button>
                                    <button onClick={() => setActiveTab('disputes')} className={`pb-4 px-2 whitespace-nowrap bg-transparent border-none border-b-[3px] font-extrabold cursor-pointer transition-all duration-200 text-[1rem] ${activeTab === 'disputes' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Labor Disputes</button>
                                    <button onClick={() => setActiveTab('jobs')} className={`pb-4 px-2 whitespace-nowrap bg-transparent border-none border-b-[3px] font-extrabold cursor-pointer transition-all duration-200 text-[1rem] ${activeTab === 'jobs' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Job Listings</button>
                                    <button onClick={() => setActiveTab('management')} className={`pb-4 px-2 whitespace-nowrap bg-transparent border-none border-b-[3px] font-extrabold cursor-pointer transition-all duration-200 text-[1rem] ${activeTab === 'management' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Management</button>
                                </div>
                            </div>

                            <div className="py-4">
                                {/* TAB 1: USER REQUESTS */}
                                {(activeTab === 'overview' || activeTab === 'users') && (
                                    <div className="animate-[fadeIn_0.3s_ease]">
                                        <h3 className="mb-6 font-extrabold text-[1.4rem] text-text-primary">Registration Request Queue</h3>
                                        <div className="w-full overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="text-left text-text-secondary text-[0.85rem] border-b border-[#f1f5f9]">
                                                        <th className="pb-4 font-bold uppercase tracking-wider">Organization / User</th>
                                                        <th className="pb-4 font-bold uppercase tracking-wider">Role Request</th>
                                                        <th className="pb-4 font-bold uppercase tracking-wider">Contact</th>
                                                        <th className="pb-4 font-bold uppercase tracking-wider text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {adminUsers.filter(u => !u.isApproved && u.role !== 'worker').length === 0 ? (
                                                        <tr><td colSpan="4" className="text-center py-12 text-text-secondary font-medium">Queue is clear. No pending approvals.</td></tr>
                                                    ) : adminUsers.filter(u => !u.isApproved && u.role !== 'worker').map(user => (
                                                        <tr key={user._id} className="border-b border-[#f1f5f9] hover:bg-slate-50 transition-colors">
                                                            <td className="py-5 pr-4">
                                                                <div className="font-extrabold text-[1.1rem] text-text-primary">{user.firstName} {user.lastName}</div>
                                                                <div className="text-[0.85rem] text-text-secondary mt-1">{user.email}</div>
                                                            </td>
                                                            <td className="pr-4">
                                                                <span className="bg-[#e0f2fe] text-[#0369a1] px-3 py-1.5 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider inline-block">
                                                                    {user.role.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="text-[0.95rem] text-text-secondary font-medium pr-4">{user.phone || 'No Phone'}</td>
                                                            <td className="text-right whitespace-nowrap">
                                                                <button onClick={() => handleApproval(user._id)} className="bg-[#059669] hover:bg-[#047857] text-white border-none py-2 px-4 rounded-lg cursor-pointer font-extrabold transition-all mr-3 shadow-sm hover:shadow-md hover:-translate-y-0.5">APPROVE</button>
                                                                <button onClick={() => handleDeleteUser(user._id)} className="bg-transparent hover:bg-[#fee2e2] border border-[#fca5a5] text-[#dc2626] py-2 px-4 rounded-lg cursor-pointer font-bold transition-all">REJECT</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: DISPUTES */}
                                {activeTab === 'disputes' && (
                                    <div className="animate-[fadeIn_0.3s_ease]">
                                        <h3 className="mb-6 font-extrabold text-[1.4rem] text-text-primary">Labor Complaint Management</h3>
                                        {complaints.length === 0 ? (
                                            <p className="text-center py-12 text-text-secondary font-medium">No disputes recorded on platform.</p>
                                        ) : (
                                            <div className="w-full overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="text-left text-text-secondary text-[0.85rem] border-b border-[#f1f5f9]">
                                                            <th className="pb-4 font-bold uppercase tracking-wider">Complainant</th>
                                                            <th className="pb-4 font-bold uppercase tracking-wider">Type</th>
                                                            <th className="pb-4 font-bold uppercase tracking-wider">Status</th>
                                                            <th className="pb-4 font-bold uppercase tracking-wider text-right">Management</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {complaints.map(complaint => (
                                                            <tr key={complaint._id} className="border-b border-[#f1f5f9] hover:bg-slate-50 transition-colors">
                                                                <td className="py-5 pr-4">
                                                                    <div className="font-extrabold text-[1.05rem] text-text-primary">Complaint #{complaint._id.substring(18)}</div>
                                                                    <div className="text-[0.85rem] text-text-secondary mt-1">Date: {new Date(complaint.createdAt).toLocaleDateString()}</div>
                                                                </td>
                                                                <td className="pr-4"><span className="bg-[#fef3c7] text-[#92400e] px-3 py-1.5 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider">Ref: Law-B12</span></td>
                                                                <td className="pr-4"><span className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider ${complaint.status === 'resolved' ? 'bg-[#dcfce7] text-[#166534]' : complaint.status === 'in-progress' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>{complaint.status}</span></td>
                                                                <td className="text-right">
                                                                    <button className="bg-transparent border-none text-accent-primary font-extrabold cursor-pointer hover:underline text-[0.95rem]">Assign Officer</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: JOBS */}
                                {activeTab === 'jobs' && (
                                    <div className="animate-[fadeIn_0.3s_ease]">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="font-extrabold text-[1.4rem] text-text-primary m-0">Active Vacancies Moderation</h3>
                                            <button onClick={() => navigate('/jobs/new')} className="bg-accent-primary hover:bg-accent-hover text-white border-none py-2.5 px-5 rounded-xl font-bold cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-[0.95rem]">+ Create Admin Vacancy</button>
                                        </div>
                                        {jobs.length === 0 ? <p className="text-center py-12 text-text-secondary font-medium">No jobs found.</p> : (
                                            <div className="flex flex-col gap-3">
                                                {jobs.slice(0, 5).map(job => (
                                                    <div key={job._id} className="flex justify-between items-center p-5 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all bg-slate-50/50">
                                                        <div>
                                                            <div className="font-extrabold text-[1.1rem] text-text-primary mb-1">{job.title}</div>
                                                            <div className="text-[0.85rem] text-text-secondary font-medium">Posted by: Official System • {job.location?.city}</div>
                                                        </div>
                                                        <button className="bg-[#fee2e2] hover:bg-[#fca5a5] text-[#991b1b] border-none p-3 rounded-xl cursor-pointer transition-transform hover:scale-110 flex items-center justify-center">🗑️</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 4: MANAGEMENT */}
                                {activeTab === 'management' && (
                                    <div className="text-center py-16 animate-[fadeIn_0.3s_ease]">
                                        <div className="text-[4rem] mb-4 drop-shadow-sm">🛡️</div>
                                        <h3 className="font-extrabold text-[2rem] text-text-primary mb-2">Administrative Power</h3>
                                        <p className="text-text-secondary text-[1.1rem] max-w-[450px] mx-auto mb-8 leading-relaxed">Manage legal officers, configure system parameters, and monitor overall platform health.</p>
                                        <button className="bg-accent-primary text-white border-none py-4 px-8 rounded-full font-extrabold cursor-pointer transition-all hover:bg-accent-hover hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(37,137,245,0.3)] shadow-[0_4px_15px_rgba(37,137,245,0.2)] text-[1.05rem]">Manage Legal Repository</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : profile.role === 'employer' ? (
                    /* ROLE: EMPLOYER VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] text-text-primary font-bold uppercase tracking-wider mb-2">My Vacancies</span>
                            <div className="text-[3.5rem] font-extrabold leading-none text-text-primary mb-1">{jobs.length}</div>
                            <div className="text-[0.85rem] text-text-secondary font-medium">Active listings</div>
                        </div>
                        <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] font-bold uppercase tracking-wider mb-2 text-accent-primary">New Applicants</span>
                            <div className="text-[3.5rem] font-extrabold leading-none mb-1 text-accent-primary">{employerApplications.filter(a => a.status === 'pending').length}</div>
                            <div className="text-[0.85rem] text-text-secondary font-medium">Awaiting decision</div>
                        </div>
                        <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] font-bold uppercase tracking-wider mb-2 text-[#059669]">Confirmed Placements</span>
                            <div className="text-[3.5rem] font-extrabold leading-none mb-1 text-[#059669]">{employerApplications.filter(a => a.status === 'accepted').length}</div>
                            <div className="text-[0.85rem] text-text-secondary font-medium">Ready for work</div>
                        </div>
                        <div className="bg-accent-primary rounded-[20px] p-6 shadow-[0_10px_25px_rgba(37,137,245,0.3)] hover:-translate-y-1 transition-all duration-300 flex justify-center items-center flex-col text-white md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] font-bold uppercase tracking-wider mb-2 text-white/90">Platform Rating</span>
                            <div className="text-[3rem] font-extrabold leading-none mb-1 text-white">4.9</div>
                            <div className="text-[0.85rem] font-medium text-white/90">Top Verified</div>
                        </div>

                        {/* Employer Candidate Queue */}
                        <div className="bg-white rounded-[20px] p-8 shadow-main border border-slate-200/80 col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 min-h-[500px]">
                            <div className="flex justify-between items-center border-b-2 border-[#f1f5f9] mb-6 pb-4">
                                <h3 className="text-[1.4rem] font-extrabold text-text-primary m-0">Candidate Management Queue</h3>
                                <button onClick={() => navigate('/jobs/new')} className="bg-accent-primary text-white border-none py-2.5 px-6 rounded-xl font-bold cursor-pointer hover:bg-accent-hover transition-all shadow-sm">+ Post New Job</button>
                            </div>
                            
                            {employerApplications.length === 0 ? <p className="text-center py-20 text-text-secondary font-medium">No candidates have applied yet. Your jobs are live!</p> : (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="text-left text-text-secondary text-[0.85rem] border-b border-[#f1f5f9]">
                                                <th className="pb-4 font-bold uppercase tracking-wider">Applicant Profile</th>
                                                <th className="pb-4 font-bold uppercase tracking-wider">Job Applied For</th>
                                                <th className="pb-4 font-bold uppercase tracking-wider">Experience Highlight</th>
                                                <th className="pb-4 font-bold uppercase tracking-wider">Status</th>
                                                <th className="pb-4 font-bold uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employerApplications.map(app => (
                                                <tr key={app._id} className="border-b border-[#f1f5f9] hover:bg-slate-50 transition-colors">
                                                    <td className="py-5 pr-4">
                                                        <div className="font-extrabold text-[1.1rem] text-text-primary">{app.workerName}</div>
                                                        <div className="text-[0.85rem] text-text-secondary mt-0.5">{app.workerEmail}</div>
                                                    </td>
                                                    <td className="pr-4">
                                                        <div className="font-bold text-text-primary text-[0.95rem]">{app.jobId?.title}</div>
                                                    </td>
                                                    <td className="pr-4 max-w-[300px]">
                                                        <p className="text-[0.9rem] text-text-secondary line-clamp-1 italic">"{app.workerExperience}"</p>
                                                    </td>
                                                    <td className="pr-4">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider inline-block ${app.status === 'accepted' ? 'bg-[#dcfce7] text-[#166534]' : app.status === 'pending' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>{app.status}</span>
                                                    </td>
                                                    <td className="text-right whitespace-nowrap">
                                                        {app.status === 'pending' ? (
                                                            <>
                                                                <button onClick={() => handleStatusUpdate(app._id, 'accepted')} className="bg-[#059669] hover:bg-[#047857] text-white border-none py-2 px-4 rounded-lg cursor-pointer font-extrabold transition-all mr-3 shadow-sm hover:shadow-md hover:-translate-y-0.5">ACCEPT</button>
                                                                <button onClick={() => handleStatusUpdate(app._id, 'rejected')} className="bg-transparent hover:bg-[#fee2e2] border border-[#fca5a5] text--[#dc2626] py-2 px-4 rounded-lg cursor-pointer font-bold transition-all">REJECT</button>
                                                            </>
                                                        ) : (
                                                            <span className="text-[0.85rem] font-bold text-text-secondary italic">Processed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ROLE: WORKER VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Stats Row */}
                        <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] text-text-primary font-bold uppercase tracking-wider mb-2">Applied Jobs</span>
                            <div className="text-[3.5rem] font-extrabold leading-none text-text-primary mb-1">{workerStats.total}</div>
                            <div className="text-[0.85rem] text-text-secondary font-medium">Total trackings</div>
                        </div>
                        <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] font-bold uppercase tracking-wider mb-2 text-[#f59e0b]">Pending Review</span>
                            <div className="text-[3.5rem] font-extrabold leading-none mb-1 text-[#f59e0b]">{workerStats.pending}</div>
                            <div className="text-[0.85rem] text-text-secondary font-medium">Awaiting employer</div>
                        </div>
                        <div className="bg-white rounded-[20px] p-6 shadow-main border border-slate-200/80 hover:-translate-y-1 hover:shadow-hover transition-all duration-300 flex justify-center items-center flex-col md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] font-bold uppercase tracking-wider mb-2 text-[#059669]">Approved Jobs</span>
                            <div className="text-[3.5rem] font-extrabold leading-none mb-1 text-[#059669]">{workerStats.approved}</div>
                            <div className="text-[0.85rem] text-text-secondary font-medium">Active placements</div>
                        </div>
                        <div className="bg-accent-primary rounded-[20px] p-6 shadow-[0_10px_25px_rgba(37,137,245,0.3)] hover:-translate-y-1 transition-all duration-300 flex justify-center items-center flex-col md:col-span-1 lg:col-span-1 xl:col-span-1">
                            <span className="text-[0.9rem] font-bold uppercase tracking-wider mb-2 text-white/90">Platform Points</span>
                            <div className="text-[3.5rem] font-extrabold leading-none mb-1 text-white">100</div>
                            <div className="text-[0.85rem] font-medium text-white/90">Trust Level 1</div>
                        </div>

                        {/* Profile Sidebar */}
                        <div className="bg-white rounded-[20px] p-8 shadow-main border border-slate-200/80 flex flex-col items-center col-span-1 md:col-span-2 lg:col-span-1 h-full">
                            <div className="w-[100px] h-[100px] border-[5px] border-[#f0f4f8] rounded-full bg-gradient-to-br from-accent-primary to-[#60a5fa] text-white flex justify-center items-center text-[2.5rem] font-extrabold mb-5 shadow-inner">{profile.firstName.charAt(0)}</div>
                            <h2 className="text-[1.6rem] font-extrabold text-text-primary text-center mb-1">{profile.firstName} {profile.lastName}</h2>
                            <p className="text-text-secondary mb-8 text-[0.95rem]">{profile.email}</p>
                            
                            <div className="w-full mt-auto flex flex-col gap-3">
                                <Link to="#" className="block w-full text-center bg-accent-primary text-white py-3.5 px-4 rounded-xl font-bold transition-all hover:bg-accent-hover hover:-translate-y-0.5 shadow-sm hover:shadow-md">Edit My Profile</Link>
                                <Link to="/jobs" className="block w-full text-center bg-slate-50 text-text-primary border border-slate-200 py-3.5 px-4 rounded-xl font-bold transition-all hover:bg-slate-100">Browse New Jobs</Link>
                            </div>
                        </div>

                        {/* Recent Applications Feed */}
                        <div className="bg-white rounded-[20px] p-8 shadow-main border border-slate-200/80 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3 min-h-[450px]">
                            <div className="border-b-2 border-[#f1f5f9] mb-6 pb-4">
                                <h3 className="text-[1.4rem] font-extrabold text-text-primary m-0">Recent Applications</h3>
                            </div>
                            
                            {applications.length === 0 ? <p className="text-center py-16 text-text-secondary font-medium text-[1.1rem]">No applications yet. Start exploring jobs!</p> : (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="text-left text-text-secondary text-[0.85rem] border-b border-[#f1f5f9]">
                                                <th className="pb-4 font-bold uppercase tracking-wider">Job Opportunity</th>
                                                <th className="pb-4 font-bold uppercase tracking-wider">Status</th>
                                                <th className="pb-4 font-bold uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map(app => (
                                                <tr key={app._id} className="border-b border-[#f1f5f9] hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 pr-4">
                                                        <div className="font-extrabold text-[1.05rem] text-text-primary">{app.jobId?.title}</div>
                                                        <div className="text-[0.85rem] text-text-secondary mt-1">Applied: {/* Add date format here if available in model */} Recent</div>
                                                    </td>
                                                    <td className="pr-4">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider inline-block ${app.status === 'accepted' ? 'bg-[#dcfce7] text-[#166534]' : app.status === 'pending' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>{app.status}</span>
                                                    </td>
                                                    <td className="text-right">
                                                        <button className="bg-transparent border-none text-accent-primary font-extrabold cursor-pointer hover:underline text-[0.95rem]">View Details</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
