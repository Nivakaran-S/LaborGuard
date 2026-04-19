import { Link } from "react-router-dom";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin,
  ShieldCheck
} from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
            <div className="container px-6 md:px-10 max-w-7xl mx-auto py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center space-x-2">
                             <ShieldCheck className="h-8 w-8 text-primary" />
                             <span className="text-2xl font-black tracking-tighter text-white">
                                Labor<span className="text-primary">Guard</span>
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-400 font-medium italic">
                            Dedicated to protecting the rights of informal workers and ensuring fair treatment across all sectors in Sri Lanka.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 rounded-full bg-slate-800 hover:bg-primary hover:text-white transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-slate-800 hover:bg-primary hover:text-white transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-slate-800 hover:bg-primary hover:text-white transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-black text-white uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-3 font-bold text-sm">
                            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                            <li><Link to="/jobs" className="hover:text-primary transition-colors">Job Board</Link></li>
                            <li><Link to="/community" className="hover:text-primary transition-colors">Community Feed</Link></li>
                            <li><Link to="/login" className="hover:text-primary transition-colors">Member Login</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-black text-white uppercase tracking-wider">Legal & Support</h4>
                        <ul className="space-y-3 font-bold text-sm">
                            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link to="/faq" className="hover:text-primary transition-colors">Help Center / FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-black text-white uppercase tracking-wider">Get in Touch</h4>
                        <ul className="space-y-4 text-sm font-bold">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <span className="leading-tight">Colombo 07, Ward Place,<br />Sri Lanka</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary shrink-0" />
                                <span>+94 11 234 5678</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary shrink-0" />
                                <span>support@laborguard.lk</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-bold text-slate-500">
                        &copy; {new Date().getFullYear()} LaborGuard Sri Lanka. All Rights Reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span>Built with ❤️ for Fairness</span>
                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                        <span>v1.0.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
