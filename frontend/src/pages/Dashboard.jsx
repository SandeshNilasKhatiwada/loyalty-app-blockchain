import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";

export default function Dashboard() {
  const { user: privyUser, logout } = usePrivy();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || !privyUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [privyUser, navigate]);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">LoyalChain</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email || "User"}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {user.walletAddress?.slice(0, 8)}...
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 text-gray-900">
            <h2 className="text-2xl font-bold">
              Welcome, {user.name || "User"}!
            </h2>
            <p className="mt-4 text-gray-600">
              You are now logged in with Privy.
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Wallet Address:</p>
              <p className="text-sm font-mono break-all">
                {user.walletAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
