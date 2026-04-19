import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterPending, setFilterPending] = useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5001/api/admin/users';

    const getHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return { Authorization: `Bearer ${token}` };
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(API_URL, { headers: getHeaders() });
            setUsers(response.data.data.users);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users. Ensure you are logged in as an Admin.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                setTimeout(() => navigate('/dashboard'), 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`${API_URL}/${userId}/role`, { role: newRole }, { headers: getHeaders() });
            setSuccess('User role updated successfully');
            setTimeout(() => setSuccess(''), 3000);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            await axios.put(`${API_URL}/${userId}/status`, { isActive: !currentStatus }, { headers: getHeaders() });
            setSuccess(`User account ${!currentStatus ? 'activated' : 'deactivated'}`);
            setTimeout(() => setSuccess(''), 3000);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleApproval = async (userId) => {
        try {
            await axios.put(`${API_URL}/${userId}/approve`, {}, { headers: getHeaders() });
            setSuccess('User officially approved!');
            setTimeout(() => setSuccess(''), 3000);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to permanently delete this user?')) {
            try {
                await axios.delete(`${API_URL}/${userId}`, { headers: getHeaders() });
                setSuccess('User deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
                fetchUsers();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const filteredUsers = filterPending ? users.filter(u => !u.isApproved && u.role !== 'worker' && u.role !== 'admin') : users;

    if (loading) return (
        <div className="p-12 max-w-[1400px] mx-auto my-8 animate-[fadeIn_0.5s_ease-out] flex flex-col items-center mt-40">
            <div className="w-[60px] h-[60px] border-4 border-[#f3f3f3] border-t-accent-primary rounded-full animate-spin"></div>
            <p className="mt-6 text-text-secondary font-semibold">Loading Administrative Access...</p>
        </div>
    );

    return (
        <div className="p-[3rem_2rem] sm:p-12 max-w-[1400px] mx-auto my-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-8 border-b border-black/5 gap-6">
                <div>
                    <h2 className="text-[2.2rem] font-extrabold text-text-primary tracking-[-1px] m-0">Platform Governance</h2>
                    <p className="text-text-secondary mt-2">
                        Manage platform access, roles, and registration approvals.
                    </p>
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 mr-4">
                        <input 
                            type="checkbox" 
                            id="filterPending" 
                            checked={filterPending} 
                            onChange={() => setFilterPending(!filterPending)}
                            className="w-4 h-4 text-accent-primary rounded border-slate-300 focus:ring-accent-primary"
                        />
                        <label htmlFor="filterPending" className="text-[0.9rem] font-semibold cursor-pointer">Show Pending Only</label>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="py-2.5 px-5 rounded-[50px] text-[0.85rem] font-bold cursor-pointer transition-all duration-200 bg-white border-[1.5px] border-[#e2e8f0] text-text-primary hover:border-accent-primary hover:text-accent-primary">
                        My Profile
                    </button>
                </div>
            </div>

            {error && <div className="p-5 rounded-[20px] mb-8 font-semibold text-[0.95rem] bg-[#fef2f2] text-accent-danger border-[1.5px] border-[#ef444444] animate-[fadeIn_0.3s_ease]">{error}</div>}
            {success && <div className="p-5 rounded-[20px] mb-8 font-semibold text-[0.95rem] bg-[#ecfdf5] text-accent-success border-[1.5px] border-[#10b98144] animate-[fadeIn_0.3s_ease]">{success}</div>}

            <div className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-black/5 overflow-x-auto w-full">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr>
                            <th className="bg-[#f8fafc] p-6 text-left text-[0.85rem] font-bold uppercase text-text-secondary border-b border-[#edf2f7]">User Profile</th>
                            <th className="bg-[#f8fafc] p-6 text-left text-[0.85rem] font-bold uppercase text-text-secondary border-b border-[#edf2f7]">Verification Check</th>
                            <th className="bg-[#f8fafc] p-6 text-left text-[0.85rem] font-bold uppercase text-text-secondary border-b border-[#edf2f7]">Platform Role</th>
                            <th className="bg-[#f8fafc] p-6 text-left text-[0.85rem] font-bold uppercase text-text-secondary border-b border-[#edf2f7]">Approval Actions</th>
                            <th className="bg-[#f8fafc] p-6 text-left text-[0.85rem] font-bold uppercase text-text-secondary border-b border-[#edf2f7]">Account Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-16 text-text-secondary font-medium">
                                    No users found matching current filters.
                                </td>
                            </tr>
                        ) : filteredUsers.map(user => (
                            <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6 border-b border-[#f8fafc] align-middle">
                                    <div className="font-bold text-[1.05rem] text-text-primary">
                                        {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-[0.85rem] text-text-secondary mt-1">{user.email}</div>
                                    <div className="text-[0.8rem] text-accent-primary font-semibold mt-1">{user.phone}</div>
                                </td>
                                <td className="p-6 border-b border-[#f8fafc] align-middle">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full inline-block ${user.isEmailVerified ? 'bg-accent-success shadow-[0_0_10px_rgba(16,185,129,0.27)]' : 'bg-accent-danger shadow-[0_0_10px_rgba(239,68,68,0.27)]'}`}></span>
                                            <span className="text-[0.8rem] font-semibold">Email {user.isEmailVerified ? 'Verified' : 'Unverified'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full inline-block ${user.isApproved ? 'bg-accent-success shadow-[0_0_10px_rgba(16,185,129,0.27)]' : 'bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.27)]'}`}></span>
                                            <span className="text-[0.8rem] font-semibold">Status: {user.isApproved ? 'Approved' : 'Pending Approval'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 border-b border-[#f8fafc] align-middle">
                                    <select
                                        className="py-2.5 pr-8 pl-4 rounded-xl border border-slate-200 text-[0.9rem] font-semibold text-text-primary cursor-pointer appearance-none outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(37,137,245,0.1)] bg-white bg-no-repeat bg-[position:right_0.8rem_center]"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'%3E%3C/path%3E%3C/svg%3E")` }}
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                    >
                                        <option value="worker">Worker</option>
                                        <option value="lawyer">Lawyer</option>
                                        <option value="ngo">NGO</option>
                                        <option value="employer">Employer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="p-6 border-b border-[#f8fafc] align-middle">
                                    {user.isApproved ? (
                                        <button className="py-2 px-5 rounded-[10px] text-[0.75rem] font-extrabold uppercase tracking-[0.5px] transition-all duration-200 bg-[#d1fae5] text-[#065f46] border-none opacity-80 cursor-default">
                                            Validated ✓
                                        </button>
                                    ) : (
                                        <button 
                                            className="py-2 px-5 rounded-[10px] text-[0.75rem] font-extrabold uppercase tracking-[0.5px] transition-all duration-200 bg-[#ffedd5] text-[#9a3412] cursor-pointer border-none shadow-[0_4px_10px_rgba(217,119,6,0.2)] hover:-translate-y-[2px] hover:shadow-[0_8px_15px_rgba(0,0,0,0.1)] hover:brightness-95" 
                                            onClick={() => handleApproval(user._id)}
                                        >
                                            APPROVE USER 🛡️
                                        </button>
                                    )}
                                </td>
                                <td className="p-6 border-b border-[#f8fafc] align-middle">
                                    <div className="flex gap-2.5">
                                        <button
                                            onClick={() => handleStatusToggle(user._id, user.isActive)}
                                            className="py-2.5 px-5 rounded-[50px] text-[0.85rem] font-bold cursor-pointer transition-all duration-200 bg-white border-[1.5px] border-[#e2e8f0] text-text-primary hover:border-accent-primary hover:text-accent-primary"
                                            title={user.isActive ? 'Block Access' : 'Restore Access'}
                                        >
                                            {user.isActive ? 'Suspend' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            className="py-2.5 px-5 rounded-[50px] text-[0.85rem] font-bold cursor-pointer transition-all duration-200 bg-white border-[1.5px] border-[#fee2e2] text-accent-danger hover:bg-accent-danger hover:text-white hover:border-accent-danger"
                                            title="Permanently Delete"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
