import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../contexts/complaint/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setSession } = useContext(AuthContext);

    // Make sure this matches your backend API URL
    const API_URL = 'http://localhost:5001/api/auth';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            const token = response.data.data.accessToken;
            const role = response.data.data.user.role;
            setSession({ accessToken: token, userRole: role, profile: response.data.data.user });
            
            // Navigate based on role: Workers to complaints, others to dashboard
            if (role === 'worker') {
                navigate('/complaints/my');
            } else if (role === 'admin') {
                navigate('/complaints/admin');
            } else if (role === 'legal_officer') {
                navigate('/complaints/officer');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/google`;
    };

    return (
        <div className="auth-wrapper login-bg">
            <div className="auth-card glass-container animate-fade-in">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Log in to your LaborGuard account</p>
                </div>

                {error && <div style={{ color: 'var(--accent-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleLogin}>
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
                    
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.85rem' }}>Forgot Password?</Link>
                        </div>
                        <input
                            type="password" 
                            className="modern-input" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={isLoading}>
                        {isLoading ? 'Logging In...' : 'Log In'}
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
                    Don't have an account? 
                    <Link to="/register">Sign up here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
