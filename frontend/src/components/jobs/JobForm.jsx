import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const INDUSTRY_PRESETS = [
    { id: 'construction', label: 'Construction', icon: '🏗️', url: 'https://images.unsplash.com/photo-1541913057-25e11409ee10?q=80&w=2070&auto=format&fit=crop' },
    { id: 'agriculture', label: 'Agriculture', icon: '🚜', url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cleaning', label: 'Cleaning / Home', icon: '🧹', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?q=80&w=2070&auto=format&fit=crop' },
    { id: 'logistics', label: 'Delivery / logistics', icon: '📦', url: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad21?q=80&w=1965&auto=format&fit=crop' },
    { id: 'security', label: 'Security', icon: '🛡️', url: 'https://images.unsplash.com/photo-1557597774-9d2739f85a94?q=80&w=2073&auto=format&fit=crop' },
    { id: 'other', label: 'Other Service', icon: '⚙️', url: 'https://images.unsplash.com/photo-1541913057-25e11409ee10?q=80&w=2070&auto=format&fit=crop' }
];

const JobForm = () => {
    const navigate = useNavigate();
    const [selectedPreset, setSelectedPreset] = useState(INDUSTRY_PRESETS[0]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        wageAmount: '',
        wageFrequency: 'daily',
        city: '',
        country: 'USA',
        address: '',
        jobType: 'contract',
        compliesWithMinimumWage: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost:5006/api/jobs';

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('accessToken');

            const payload = {
                title: formData.title,
                description: formData.description,
                imageUrl: selectedPreset.url,
                wage: {
                    amount: Number(formData.wageAmount),
                    currency: 'USD',
                    frequency: formData.wageFrequency
                },
                location: {
                    address: formData.address,
                    city: formData.city,
                    country: formData.country
                },
                jobType: formData.jobType,
                compliesWithMinimumWage: formData.compliesWithMinimumWage
            };

            await axios.post(API_URL, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            navigate('/jobs');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post job.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-70px)] bg-bg-secondary p-4 md:p-10 flex justify-center">
            <div className="w-full max-w-[900px] animate-[fadeIn_0.4s_ease-out]">
                <div className="flex justify-center mb-12">
                    <div className="text-center">
                        <h1 className="text-[2.5rem] font-extrabold text-text-primary mb-2">Create New Opportunity</h1>
                        <p className="font-semibold text-text-secondary">Set the visual standard for your vacancy</p>
                    </div>
                </div>

                {error && <div className="bg-[#fee2e2] border border-[#fca5a5] text-accent-danger px-5 py-4 rounded-lg font-medium mb-8 shadow-sm">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* INNOVATIVE IMAGE PICKER */}
                    <div className="bg-white rounded-[20px] p-8 shadow-main border border-slate-200/80 mb-8 transition-shadow hover:shadow-hover">
                        <h2 className="text-[1.1rem] font-extrabold mb-6 uppercase text-text-secondary tracking-wide">1. Visual Industry Asset</h2>
                        
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4 mb-8">
                            {INDUSTRY_PRESETS.map((preset) => (
                                <div 
                                    key={preset.id}
                                    onClick={() => setSelectedPreset(preset)}
                                    className={`relative cursor-pointer p-4 rounded-[15px] text-center transition-all duration-200 border-2 ${selectedPreset.id === preset.id ? 'border-accent-primary bg-accent-primary/5' : 'border-[#edf2f7] bg-white hover:border-slate-300'}`}
                                >
                                    <div className="text-[2rem] mb-2">{preset.icon}</div>
                                    <div className="text-[0.8rem] font-bold">{preset.label}</div>
                                    {selectedPreset.id === preset.id && (
                                        <div className="absolute -top-2 -right-2 bg-accent-primary text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold shadow-md">✓</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="h-[250px] rounded-[15px] bg-cover bg-center flex flex-col justify-end p-8 relative overflow-hidden shadow-inner" style={{ backgroundImage: `url(${selectedPreset.url})` }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="relative text-white font-bold text-[1.2rem] z-10 flex items-center gap-2">
                                <span className="opacity-80">Preview:</span> <span className="text-accent-primary bg-white/20 px-3 py-1 rounded-md backdrop-blur-sm">{selectedPreset.label} Environment</span>
                            </div>
                        </div>
                    </div>

                    {/* CORE DETAILS */}
                    <div className="bg-white rounded-[20px] p-8 shadow-main border border-slate-200/80 mb-8 transition-shadow hover:shadow-hover">
                        <h2 className="text-[1.1rem] font-extrabold mb-6 uppercase text-text-secondary tracking-wide">2. Mission Details</h2>
                        
                        <div className="mb-6">
                            <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">Position Title</label>
                            <input name="title" className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-lg font-sans text-[1rem] transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)]" placeholder="e.g. Masonry / Construction Help" value={formData.title} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">Wage Amount ($)</label>
                                <input type="number" name="wageAmount" className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-lg font-sans text-[1rem] transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)]" placeholder="0.00" value={formData.wageAmount} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">Payment Frequency</label>
                                <select name="wageFrequency" className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-lg font-sans text-[1rem] transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)] appearance-none cursor-pointer" value={formData.wageFrequency} onChange={handleChange}>
                                    <option value="daily">Daily Wage</option>
                                    <option value="per-task">Flat Fee (Per Task)</option>
                                    <option value="hourly">Hourly Rate</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">Job Type</label>
                                <select name="jobType" className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-lg font-sans text-[1rem] transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)] appearance-none cursor-pointer" value={formData.jobType} onChange={handleChange}>
                                    <option value="contract">On-Call Contract</option>
                                    <option value="temporary">Temporary Placement</option>
                                    <option value="full-time">Permanent / Full-Time</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">Region / City</label>
                            <input name="city" className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-lg font-sans text-[1rem] transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)]" placeholder="City Name" value={formData.city} onChange={handleChange} required />
                        </div>

                        <div className="mb-8">
                            <label className="block text-[0.95rem] font-extrabold text-text-primary mb-2">Execution Requirements & Description</label>
                            <textarea name="description" className="w-full px-5 py-3.5 bg-slate-50 border border-black/5 text-slate-800 rounded-lg font-sans text-[1rem] transition-all duration-300 focus:outline-none focus:bg-white focus:border-accent-primary focus:shadow-[0_0_0_4px_rgba(37,137,245,0.15)] min-h-[120px] resize-y" placeholder="Describe the daily duties and skill requirements..." value={formData.description} onChange={handleChange} required />
                        </div>

                        <label className="flex items-start bg-slate-50 p-5 rounded-xl cursor-pointer border border-slate-100 hover:border-slate-200 transition-colors">
                            <input type="checkbox" name="compliesWithMinimumWage" className="mt-1 w-5 h-5 rounded border-gray-300 text-accent-primary focus:ring-accent-primary" checked={formData.compliesWithMinimumWage} onChange={handleChange} />
                            <div className="ml-4 flex flex-col">
                                <span className="font-extrabold text-text-primary text-[1rem]">Fair Wage Compliance</span>
                                <span className="text-text-secondary text-[0.9rem] mt-1">I certify this posting follows local labor laws and fair wage standards.</span>
                            </div>
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 mt-10">
                        <button type="submit" className="flex-[2] bg-accent-primary text-white border-none py-4 px-6 rounded-[50px] text-[1.1rem] font-extrabold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,137,245,0.3)] shadow-[0_4px_15px_rgba(37,137,245,0.2)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Streaming to LaborGuard...
                                </>
                            ) : '🚀 Publish Vacancy Post'}
                        </button>
                        <button type="button" className="flex-1 bg-white text-text-primary border border-slate-200 py-4 px-6 rounded-[50px] text-[1.1rem] font-bold cursor-pointer transition-all hover:bg-slate-50 hover:-translate-y-0.5 shadow-sm hover:shadow-md text-center" onClick={() => navigate('/jobs')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobForm;
