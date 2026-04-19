import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'worker',
        documents: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5001/api/auth';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        // Normalize phone number (Sri Lanka style)
        let normalizedPhone = formData.phone.replace(/\D/g, ''); 
        if (normalizedPhone.length === 9) {
            normalizedPhone = '0' + normalizedPhone;
        }

        if (normalizedPhone.length !== 10) {
            setError("Please enter a valid 10-digit phone number (e.g., 077... or 071...)");
            setIsLoading(false);
            return;
        }

        // Age validation
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            setError("You must be at least 18 years old to register");
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        // Non-workers must upload documents
        if (formData.role !== 'worker' && formData.role !== 'admin' && selectedFiles.length === 0) {
            setError("Please upload at least one verification document (ID, License, etc.)");
            setIsLoading(false);
            return;
        }

        try {
            // Use FormData for file upload
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'documents') {
                    data.append(key, formData[key]);
                }
            });
            
            // Overwrite phone with normalized version
            data.set('phone', normalizedPhone);

            // Append each file to the 'documents' field
            selectedFiles.forEach(file => {
                data.append('documents', file);
            });

            const response = await axios.post(`${API_URL}/register`, data);
            
            setSuccess(response.data.message);
            setTimeout(() => navigate('/verify', { state: { userId: response.data.data.userId } }), 1000);
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors && data.errors.length > 0) {
                // Show the specific validation error if available
                setError(data.errors[0].message);
            } else {
                setError(data?.message || 'Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/google`;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="auth-wrapper register-bg">
            <div className={`auth-card glass-container ${formData.role === 'worker' ? 'register-card-wide' : 'register-card-extra-wide'}`}>
                <div className="auth-header">
                    <h2>Join LaborGuard</h2>
                    <p>Create an account to access the platform</p>
                </div>

                {error && <div style={{ color: 'var(--accent-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
                {success && <div style={{ color: 'var(--accent-success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{success}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-grid">
                        {/* Row 1: Names */}
                        <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input name="firstName" className="modern-input" placeholder="First Name" onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input name="lastName" className="modern-input" placeholder="Last Name" onChange={handleChange} required />
                        </div>

                        {/* Row 2: Role & DOB */}
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select name="role" className="modern-select" onChange={handleChange}>
                                <option value="worker">Worker</option>
                                <option value="lawyer">Lawyer / Legal Officer</option>
                                <option value="ngo">NGO Member</option>
                                <option value="employer">Employer</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input name="birthDate" type="date" className="modern-input" onChange={handleChange} required />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>You must be at least 18 years old.</small>
                        </div>

                        {/* Row 3: Email & Phone */}
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input name="email" type="email" className="modern-input" placeholder="name@example.com" onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number (Sri Lanka)</label>
                            <input name="phone" className="modern-input" placeholder="07XXXXXXXX" onChange={handleChange} required />
                        </div>

                        {/* Row 4: Passwords */}
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input name="password" type="password" className="modern-input" placeholder="••••••••" onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input name="confirmPassword" type="password" className="modern-input" placeholder="••••••••" onChange={handleChange} required />
                        </div>
                    </div>

                    {['lawyer', 'employer', 'ngo'].includes(formData.role) && (
                        <div className="form-group animate-fade-in full-width" style={{ marginTop: '1rem' }}>
                            <label className="form-label" style={{ color: 'var(--accent-primary)' }}>Verification Documents Required (PDF/Images)</label>
                            
                            <div 
                                className="drop-zone"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                <div className="drop-zone-content">
                                    <span className="drop-zone-icon">📁</span>
                                    <p>Drag & drop files here or <strong>click to browse</strong></p>
                                    <small>Upload your ID, Professional License, or NGO Certificate</small>
                                </div>
                                <input 
                                    id="fileInput"
                                    type="file" 
                                    multiple 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="file-list">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="file-item">
                                            <span className="file-icon">
                                                {file.type.includes('pdf') ? '📄' : '🖼️'}
                                            </span>
                                            <span className="file-name">{file.name}</span>
                                            <button 
                                                type="button" 
                                                className="file-remove" 
                                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem' }} disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Register Now'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }}></div>
                    <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }}></div>
                </div>

                <button onClick={handleGoogleLogin} className="btn-google">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                <div className="auth-footer">
                    Already have an account? 
                    <Link to="/login">Log in here</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
