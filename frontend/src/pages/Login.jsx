import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const navigate = useNavigate();

  const handleLoginWithBackend = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await axios.post(`${API_URL}/auth/login`, { token });
      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Backend login error:", err);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (authenticated && user) {
      handleLoginWithBackend();
    }
  }, [authenticated, user, handleLoginWithBackend]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            LoyalChain
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Blockchain Loyalty Points Platform
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {authenticated ? (
            <div className="text-center">
              <p className="text-green-600">Logged in as {user?.email}</p>
              <button
                onClick={logout}
                className="mt-4 text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => login({ provider: "email" })}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Sign in with Email
              </button>
              <p className="text-xs text-gray-400 text-center">
                Google & Apple login require configuration in your{" "}
                <a href="https://dashboard.privy.io" className="underline" target="_blank" rel="noreferrer">Privy dashboard</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
