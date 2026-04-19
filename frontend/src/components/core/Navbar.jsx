import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/complaint/AuthContext';

const Navbar = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, userRole, logout } = useContext(AuthContext);
    const token = isAuthenticated;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
    const closeDrawer = () => setIsDrawerOpen(false);

    return (
        <>
            {/* Drawer Overlay Backdrop */}
            {isDrawerOpen && <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-[4px] z-[2000] animate-[fadeIn_0.3s_ease]" onClick={closeDrawer}></div>}
            
            {/* Side Drawer */}
            <aside className={`fixed top-0 w-[320px] h-screen bg-bg-primary shadow-[10px_0_30px_rgba(0,0,0,0.1)] z-[2001] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col p-8 ${isDrawerOpen ? 'left-0' : '-left-[320px]'}`}>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-black/5">
                    <h3 className="text-[1.5rem] text-text-primary m-0 font-extrabold">Menu</h3>
                    <button className="bg-transparent border-none text-[1.5rem] text-text-secondary cursor-pointer transition-all duration-200 hover:text-accent-danger hover:rotate-90" onClick={closeDrawer}>✕</button>
                </div>
                
                <div className="flex flex-col gap-5">
                    <Link to="/" className="text-[1.2rem] font-semibold text-text-primary no-underline py-2 transition-all duration-200 hover:text-accent-primary hover:translate-x-1" onClick={closeDrawer}>Home</Link>
                    <Link to="/jobs" className="text-[1.2rem] font-semibold text-text-primary no-underline py-2 transition-all duration-200 hover:text-accent-primary hover:translate-x-1" onClick={closeDrawer}>Jobs</Link>
                    {token && (
                      <Link
                        to={userRole === 'worker' ? '/complaints/my' : userRole === 'admin' ? '/complaints/admin' : userRole === 'legal_officer' ? '/complaints/officer' : '/dashboard'}
                        className="text-[1.2rem] font-semibold text-text-primary no-underline py-2 transition-all duration-200 hover:text-accent-primary hover:translate-x-1"
                        onClick={closeDrawer}
                      >
                        Complaints
                      </Link>
                    )}
                    <Link to="#" className="text-[1.2rem] font-semibold text-text-primary no-underline py-2 transition-all duration-200 hover:text-accent-primary hover:translate-x-1" onClick={closeDrawer}>News</Link>
                    <Link to="#" className="text-[1.2rem] font-semibold text-text-primary no-underline py-2 transition-all duration-200 hover:text-accent-primary hover:translate-x-1" onClick={closeDrawer}>About</Link>
                    
                    {!token && (
                        <div className="mt-8 flex flex-col gap-4 border-t border-black/5 pt-8">
                            <Link to="/login" className="bg-transparent text-text-primary border border-black/10 text-center p-4 rounded-[50px] font-semibold no-underline transition-all duration-300 hover:bg-black/5" onClick={closeDrawer}>Log In</Link>
                            <Link to="/register" className="bg-accent-primary text-white text-center p-4 rounded-[50px] font-semibold no-underline transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_4px_15px_rgba(37,137,245,0.3)]" onClick={closeDrawer}>Sign up</Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Standard Navbar */}
            <nav className="sticky top-0 z-[1000] px-8 py-6 bg-bg-primary border-b border-black/5">
                <div className="max-w-[1280px] mx-auto flex justify-between items-center">
                    
                    {/* Left Section: Hamburger + Logo */}
                    <div className="flex items-center gap-6">
                        <button className="bg-transparent border-none text-text-primary cursor-pointer flex items-center justify-center transition-all duration-200 hover:text-accent-primary hover:scale-105" onClick={toggleDrawer} aria-label="Open menu">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>

                        <Link to="/" className="text-[1.8rem] font-extrabold text-text-primary no-underline tracking-[-0.5px]">
                            Labor<span className="text-accent-primary">Guard</span>
                        </Link>
                    </div>

                    {/* Right Section: Desktop Menu + Profile */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="font-semibold text-[1.05rem] text-text-secondary transition-colors duration-300 no-underline hover:text-accent-primary">Home</Link>
                        <Link to="/jobs" className="font-semibold text-[1.05rem] text-text-secondary transition-colors duration-300 no-underline hover:text-accent-primary">Jobs</Link>
                        {token && (
                          <Link to={userRole === 'worker' ? '/complaints/my' : userRole === 'admin' ? '/complaints/admin' : userRole === 'legal_officer' ? '/complaints/officer' : '/dashboard'} className="font-semibold text-[1.05rem] text-text-secondary transition-colors duration-300 no-underline hover:text-accent-primary">Complaints</Link>
                        )}
                        <Link to="#" className="font-semibold text-[1.05rem] text-text-secondary transition-colors duration-300 no-underline hover:text-accent-primary">News</Link>
                        
                        {token ? (
                            <div className="flex items-center gap-3 ml-4">
                                <Link to="/dashboard" className="no-underline">
                                    <div className="w-[38px] h-[38px] rounded-full bg-accent-primary flex items-center justify-center text-white font-bold text-[1rem] cursor-pointer shadow-[0_4px_12px_rgba(37,137,245,0.2)] transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_16px_rgba(37,137,245,0.4)]"
                                    title="My Dashboard"
                                    >
                                        {userRole ? userRole.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                </Link>

                                <button onClick={handleLogout} className="bg-transparent border-none text-text-secondary cursor-pointer p-1.5 flex items-center justify-center transition-colors duration-200 hover:text-accent-danger"
                                title="Log Out"
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4 items-center pl-2">
                                <Link to="/register" className="text-[#ffb703] font-bold border-b-2 border-[#ffb703] pb-[2px] no-underline hover:opacity-80 transition-opacity">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
