import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export const useAuth = () => {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const {
    user,
    isAuthenticated,
    setAuth: storeLogin,
    logout: storeLogout,
    updateUser: storeUpdateUser,
  } = useAuthStore();

  // ── Get My Profile ──────────────────────────────────────────────────────────
  const useGetProfile = () => {
    return useQuery({
      queryKey: ["profile", user?.userId],
      queryFn: async () => {
        const res = await authApi.getProfile();
        return res.data.data;
      },
      enabled: isAuthenticated && !!user?.userId,
    });
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authApi.login({ email, password }),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data.data;
      storeLogin(user, accessToken, refreshToken);
      toast.success("Welcome back!");

      // FIX: was 'legal_officer' — JWT carries 'lawyer' from User model enum
      const roleRoutes = {
        admin    : "/admin/dashboard",
        worker   : "/worker/dashboard",
        employer : "/employer/dashboard",
        lawyer   : "/legal/dashboard",   // FIX: was legal_officer
        ngo      : "/ngo/dashboard",
      };
      navigate(roleRoutes[user.role] || "/");
    },
    onError: (err) => {
      const { status, data } = err.response || {};
      if (status === 403 && data?.userId) {
        toast.error("Please verify your account to log in");
        navigate("/verify", { state: { userId: data.userId, email: data.email } });
      } else {
        toast.error(data?.message || "Login failed");
      }
    },
  });

  // ── Register ────────────────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: (formData) => authApi.register(formData),
    onSuccess: (res, variables) => {
      toast.success("Registration successful! Please verify your account.");
      // variables is a FormData object from RegisterForm
      navigate("/verify", { state: { userId: res.data.data.userId, email: variables.get("email") } });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Registration failed");
    },
  });

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  // FIX: Backend POST /auth/verify returns ONLY { success, message } — no tokens, no user.
  // The old onSuccess tried: const { user, accessToken, refreshToken } = res.data.data
  // → res.data.data is undefined → CRASH ("Cannot destructure property of undefined")
  // Fix: redirect to /login after successful verification.
  const verifyMutation = useMutation({
    mutationFn: ({ userId, code, type }) =>
      type === "sms"
        ? authApi.verifySms(userId, code)
        : authApi.verifyEmail(userId, code),
    onSuccess: () => {
      toast.success("Account verified! Please sign in to continue.");
      navigate("/login"); // FIX: no auto-login — backend doesn't return tokens here
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Verification failed");
    },
  });

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = () => {
    storeLogout();
    queryClient.clear();
    toast.info("Logged out successfully");
    navigate("/login");
  };

  // ── Update Profile ──────────────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: (res) => {
      storeUpdateUser(res.data.data);
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries(["profile"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update profile");
    },
  });

  // ── Change Password ─────────────────────────────────────────────────────────
  const changePasswordMutation = useMutation({
    mutationFn: ({ current, next }) =>
      authApi.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to change password");
    },
  });

  return {
    user,
    isAuthenticated,
    useGetProfile,
    login          : loginMutation,
    register       : registerMutation,
    verify         : verifyMutation,
    logout,
    updateProfile  : updateProfileMutation,
    changePassword : changePasswordMutation,
  };
};