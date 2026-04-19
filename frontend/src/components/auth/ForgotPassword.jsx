import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5001/api/auth';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(`${API_URL}/forgot-password`, { email });
            setSuccess(response.data.message);

            // Redirect to Reset Password page, passing the email so they don't have to type it again
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request reset code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card glass-container">
                <div className="auth-header">
                    <h2>Forgot Password</h2>
                    <p>Enter your registered email address to receive a 6-digit password reset code.</p>
                </div>

                {error && <div style={{ color: 'var(--accent-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
                {success && <div style={{ color: 'var(--accent-success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="modern-input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Sending Request...' : 'Send Reset Code'}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '2rem' }}>
                    Remember your password? 
                    <Link to="/login">Back to log in</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
