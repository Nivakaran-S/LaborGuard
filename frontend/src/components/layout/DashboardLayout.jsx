import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";

const DashboardLayout = ({ className }) => {
    // Initialize Real-time Pipeline (WebSockets)
    useRealtime();
    
    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50/50">
            {/* Sidebar - Desktop Only */}
            <Sidebar className="hidden lg:flex" />
            
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Navbar - Desktop & Mobile */}
                <Navbar className="bg-white border-b shadow-sm z-40" />
                
                <main className={cn("flex-1 overflow-y-auto px-6 py-8 custom-scrollbar", className)}>
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
