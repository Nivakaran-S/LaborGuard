import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { 
  ShieldCheck, 
  Briefcase, 
  Scale, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Globe,
  Zap,
  Star
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { cn } from '@/lib/utils';

const LandingPage = () => {
    return (
        <div className="flex flex-col w-full bg-white overflow-hidden">
            {/* High-Impact Hero Section */}
            <section className="relative min-h-[95vh] flex items-center justify-center pt-20 pb-32 px-6 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
                
                <div className="container max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="space-y-4">
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 text-primary bg-primary/5 font-black uppercase tracking-[0.2em] text-[10px] animate-bounce-subtle">
                                Sri Lanka's First Worker Protection Platform
                            </Badge>
                            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900">
                                Empowering the <span className="text-primary italic relative">
                                    Unseen
                                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 25 0, 50 5 T 100 5 L 100 10 L 0 10 Z" fill="currentColor"/></svg>
                                </span> Force.
                            </h1>
                            <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-xl">
                                LaborGuard provides a secure digital sanctuary for informal workers. 
                                Real-time legal aid, verified job placements, and a powerful voice for your rights.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg" className="h-16 px-10 rounded-full text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 group">
                                <Link to="/register">
                                    Join the Movement
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="h-16 px-10 rounded-full text-sm font-black uppercase tracking-widest text-slate-600 border-2 border-slate-100 hover:bg-slate-50">
                                <Link to="/login">Sign In</Link>
                            </Button>
                        </div>

                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex -space-x-4">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-200 shadow-sm overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trusted by 5,000+ Workers</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative hidden lg:block animate-in fade-in zoom-in-95 duration-1000 delay-300">
                         <div className="absolute inset-0 bg-primary/20 rounded-[80px] rotate-6 scale-95 blur-2xl opacity-20" />
                         <div className="relative rounded-[60px] overflow-hidden border-[12px] border-white shadow-3xl aspect-[4/5] bg-slate-100">
                             <img 
                                src="/src/assets/hero-labor.jpg" 
                                alt="Worker Representative" 
                                className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
                             />
                             <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-xl p-8 rounded-[40px] border border-white/50 shadow-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Live Protection</p>
                                        <p className="text-sm font-bold text-slate-800 leading-tight">Verification System Active for all 25 Districts</p>
                                    </div>
                                </div>
                             </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* Statistics Banner */}
            <div className="bg-slate-900 py-12">
                <div className="container max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: "Active Workers", value: "12K+", icon: Users },
                        { label: "Resolved Cases", value: "850+", icon: Scale },
                        { label: "Verified Jobs", value: "2.4K", icon: Briefcase },
                        { label: "NGO Partners", value: "45+", icon: Globe },
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center text-center space-y-2">
                            <s.icon className="h-5 w-5 text-primary mb-2" />
                            <p className="text-3xl font-black text-white tracking-tighter">{s.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mission Features */}
            <section className="py-32 bg-slate-50/30">
                <div className="container max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-6 mb-24">
                        <Badge className="bg-slate-100 text-slate-600 border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">Our Core Pillars</Badge>
                        <h2 className="text-5xl font-black tracking-tight text-slate-900">Built for Fairness, Scaled for Security</h2>
                        <p className="text-lg font-bold text-slate-500 max-w-2xl mx-auto">
                            We've re-engineered the labor rights pipeline to put power back into your hands.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { 
                                title: "Instant Legal Access", 
                                desc: "Connect with pro-bono lawyers and legal officers via encrypted video consultations within 24 hours.",
                                icon: Scale,
                                color: "bg-blue-500"
                            },
                            { 
                                title: "Smart Job Board", 
                                desc: "Exclusive access to listings from employers vetted by our community trust engine and NGO partners.",
                                icon: Briefcase,
                                color: "bg-primary"
                            },
                            { 
                                title: "Rights Guard", 
                                desc: "File multi-media complaints (photos, voice notes) and track every status update with blockchain-level transparency.",
                                icon: ShieldCheck,
                                color: "bg-purple-600"
                            },
                        ].map((f, i) => (
                            <div key={i} className="group bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-slate-200 transition-transform group-hover:scale-110 group-hover:rotate-6", f.color)}>
                                    <f.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                                <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">
                                    {f.desc}
                                </p>
                                <Link to="/register" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-primary hover:gap-3 transition-all">
                                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* NGO Collaboration CTA */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5" />
                <div className="container max-w-7xl mx-auto px-6 relative z-10">
                    <div className="bg-slate-900 rounded-[80px] p-12 md:p-24 overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[100px]" />
                         <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-10">
                                <Badge className="bg-primary/20 text-primary border-none font-black uppercase tracking-widest text-[10px]">Partners for Progress</Badge>
                                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                    Collaborating with Sri Lanka's Leading NGOs
                                </h2>
                                <div className="space-y-6">
                                    {[
                                        "Direct Emergency Intervention Support",
                                        "Legal Aid Fund for Critical Labor Disputes",
                                        "District-level Advocacy Workshops"
                                    ].map((t, i) => (
                                        <div key={i} className="flex gap-4 items-center">
                                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <p className="font-bold text-slate-300 text-sm uppercase tracking-wide">{t}</p>
                                        </div>
                                    ))}
                                </div>
                                <Button asChild size="lg" className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-xs bg-white text-slate-900 hover:bg-slate-100 shadow-2xl">
                                    <Link to="/advocacy">Our Impact Report</Link>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="aspect-square bg-slate-800 rounded-[40px] flex items-center justify-center border border-slate-700/50 hover:border-primary/50 transition-colors">
                                        <Zap className="h-10 w-10 text-slate-500 group-hover:text-primary" />
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 text-center">
                <div className="container max-w-4xl mx-auto px-6 space-y-12">
                    <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                        Ready to join the protected workforce?
                    </h2>
                    <p className="text-xl font-bold text-slate-500">
                        Create your account in under 3 minutes and get immediate access to Sri Lanka's labor justice ecosystem.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                        <Button asChild size="lg" className="h-16 px-12 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30">
                            <Link to="/register">Create Free Account</Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg" className="h-16 px-12 rounded-full font-black uppercase tracking-widest text-xs border-2 border-slate-100">
                            <Link to="/advocacy">Contact Support</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
