import { Link } from "react-router-dom";
import { RegisterForm } from "@/components/auth/RegisterForm";
// FIX: Removed broken imports of Button/Input/Label from @/components/ui/* — those paths don't exist
// and RegisterForm handles all its own internals

const RegisterPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_SERVICE_URL}/api/auth/google`;
  };

  return (
    <div className="auth-wrapper register-bg">
      <div className="auth-card register-card-wide animate-fade-in">
        <div className="auth-header">
          <h2 className="text-3xl font-extrabold text-slate-900">Join LaborGuard</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Create an account to access Sri Lanka's labour rights platform.
          </p>
        </div>

        <RegisterForm />

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-semibold">Or continue with</span>
          </div>
        </div>

        <button onClick={handleGoogleLogin} className="btn-google">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;