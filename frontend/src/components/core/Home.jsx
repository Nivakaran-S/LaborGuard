import { Link } from 'react-router-dom';
import heroBg from '../../assets/hero-bg.jpg';

const Home = () => {
    return (
        <div className="flex flex-col min-h-[calc(100vh-70px)] w-full">
            {/* Immersive Hero Section */}
            <section className="relative py-24 md:py-32 px-6 md:px-8 flex flex-col items-center justify-center text-center overflow-hidden min-h-[60vh] md:min-h-[85vh] bg-cover bg-[position:center_30%] text-white md:bg-fixed" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.4)), url(${heroBg})` }}>
                <div className="relative z-10 max-w-[900px] animate-[fadeIn_0.8s_ease-out]">
                    <h1 className="text-[2.8rem] md:text-[3.5rem] lg:text-[4.5rem] font-extrabold leading-[1.1] mb-8 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)] tracking-[-1.5px]">
                        Empowering Fair Labor Worldwide
                    </h1>
                    
                    <p className="text-[1.15rem] md:text-[1.4rem] text-white/95 leading-[1.7] mb-14 max-w-[650px] mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        LaborGuard is a revolutionary platform ensuring transparent contracts, fair wages, 
                        and safe working conditions for global workers, driving sustainable economic growth.
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-6 justify-center w-full md:w-auto">
                        <Link to="/register" className="py-4 px-10 rounded-[50px] text-[1.15rem] font-bold no-underline transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] inline-flex items-center justify-center w-full md:w-auto md:min-w-[220px] bg-accent-primary text-white shadow-[0_4px_20px_rgba(37,137,245,0.4)] hover:-translate-y-1 hover:bg-accent-hover hover:shadow-[0_15px_40px_rgba(37,137,245,0.5)]">
                            Get Started
                        </Link>
                        <Link to="/jobs" className="py-4 px-10 rounded-[50px] text-[1.15rem] font-bold no-underline transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] inline-flex items-center justify-center w-full md:w-auto md:min-w-[220px] bg-white/15 text-white border border-white/30 backdrop-blur-md hover:bg-white/25 hover:border-white/50 hover:-translate-y-1">
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 px-8 max-w-[1200px] mx-auto w-full">
                <div className="text-center mb-20">
                    <h2 className="text-[2.8rem] font-extrabold text-text-primary mb-5">Why LaborGuard?</h2>
                    <p className="text-[1.2rem] text-text-secondary max-w-[600px] mx-auto">Transforming the labor ecosystem with transparency and trust.</p>
                </div>
                
                <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-12">
                    {/* Feature 1 */}
                    <div className="bg-white border border-black/5 rounded-[20px] p-14 px-10 transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] text-center shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:-translate-y-3 hover:shadow-hover hover:border-accent-primary">
                        <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[2.2rem] mx-auto mb-8 bg-accent-primary/10 text-accent-primary">🛡️</div>
                        <h3 className="text-[1.4rem] font-bold text-text-primary mb-5">Verified Wages</h3>
                        <p className="text-text-secondary leading-[1.7] text-[1.05rem]">
                            All job postings on our platform are strictly verified to comply with regional minimum wage laws, guaranteeing fair compensation.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white border border-black/5 rounded-[20px] p-14 px-10 transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] text-center shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:-translate-y-3 hover:shadow-hover hover:border-accent-primary">
                        <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[2.2rem] mx-auto mb-8 bg-[#10b98114] text-accent-success">⚖️</div>
                        <h3 className="text-[1.4rem] font-bold text-text-primary mb-5">Transparent Dispute Resolution</h3>
                        <p className="text-text-secondary leading-[1.7] text-[1.05rem]">
                            Integrated smart-contracts and a network of legal experts ensure any employment disputes are handled swiftly and fairly.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white border border-black/5 rounded-[20px] p-14 px-10 transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] text-center shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:-translate-y-3 hover:shadow-hover hover:border-accent-primary">
                        <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[2.2rem] mx-auto mb-8 bg-[#8b5cf614] text-[#8b5cf6]">👥</div>
                        <h3 className="text-[1.4rem] font-bold text-text-primary mb-5">Community Driven</h3>
                        <p className="text-text-secondary leading-[1.7] text-[1.05rem]">
                            Connect with millions of workers, NGOs, and advocates in a safe space dedicated to promoting decent work for all.
                        </p>
                    </div>
                </div>
            </section>

            {/* Call To Action */}
            <section className="py-32 px-8 bg-gradient-to-t from-[#f8fafc] to-transparent text-center flex flex-col items-center">
                <div className="bg-white border border-black/5 rounded-[32px] py-20 px-6 sm:px-12 max-w-[900px] w-full shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col items-center">
                    <h2 className="text-[2.2rem] sm:text-[2.8rem] font-extrabold text-text-primary mb-6">Join the Movement</h2>
                    <p className="text-[1.1rem] sm:text-[1.25rem] text-text-secondary mb-12 max-w-[600px] mx-auto">
                        Whether you are an employer seeking talent or a worker demanding fair treatment, your journey starts here.
                    </p>
                    <Link to="/register" className="py-4 px-10 rounded-[50px] text-[1.15rem] font-bold no-underline transition-all duration-300 inline-flex items-center justify-center w-auto bg-accent-primary text-white shadow-[0_4px_20px_rgba(37,137,245,0.4)] hover:-translate-y-1 hover:bg-accent-hover hover:shadow-[0_15px_40px_rgba(37,137,245,0.5)]">
                        Create an Account
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
