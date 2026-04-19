import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { cn } from "@/lib/utils";

const PublicLayout = ({ className }) => {
    return (
        <div className="flex flex-col min-h-screen w-full bg-white">
            <Navbar className="bg-white/95 backdrop-blur border-b z-50 sticky top-0" />
            
            <main className={cn("flex-1", className)}>
                <Outlet />
            </main>
            
            <Footer />
        </div>
    );
};

export default PublicLayout;
