import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Try to grab the email if we navigated here from the ForgotPassword page
    const initialEmail = location.state?.email || '';

    const [formData, setFormData] = useState({
        email: initialEmail,
        code: '',
        newPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost:5001/api/auth';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(`${API_URL}/reset-password`, formData);
            setSuccess(response.data.message);

            // Redirect to login after successful reset
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card glass-container">
                <div className="auth-header">
                    <h2>Choose New Password</h2>
                    <p>Enter the 6-digit code sent to your email and your new password.</p>
                </div>

                {error && <div style={{ color: 'var(--accent-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
                {success && <div style={{ color: 'var(--accent-success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="modern-input"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">6-Digit Reset Code</label>
                        <input
                            type="text"
                            maxLength={6}
                            name="code"
                            className="modern-input"
                            placeholder="000000"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '600' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            className="modern-input"
                            placeholder="••••••••"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                            * Needs 8 chars, 1 uppercase, 1 lowercase, 1 number, & 1 special char.
                        </p>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '2rem' }}>
                    <Link to="/login">Back to log in</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
