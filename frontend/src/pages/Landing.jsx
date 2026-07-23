import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Coins, Award, Gift, Store, ArrowRight, Sparkles, Shield } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  const features = [
    { icon: Coins, title: "Earn Loyalty Points", desc: "Get rewarded every time you shop at partnered merchants" },
    { icon: Gift, title: "Redeem Anywhere", desc: "Use your points across the entire merchant network — not just one store" },
    { icon: Award, title: "Merchant Tools", desc: "Create and manage your own loyalty program with easy tools" },
    { icon: Store, title: "Multi-Merchant Network", desc: "Points earned at one merchant can be used at any other" },
    { icon: Shield, title: "Simple & Secure", desc: "Just use your email — no crypto wallet or blockchain knowledge needed" },
    { icon: Sparkles, title: "Email Login", desc: "Sign in with just your email via magic link" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-blue-600">
            <span className="text-xl">🪙</span>
            <span>LoyalChain</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard"><Button size="sm">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/merchant/login"><Button variant="outline" size="sm">Merchant Login</Button></Link>
                <Link to="/admin/login"><Button size="sm">Admin Login</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
          Blockchain Loyalty.{' '}
          <span className="text-blue-600">Simplified.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
          Earn, swap, and redeem loyalty points across merchants — all powered by blockchain,
          all accessible with just your email.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {user ? (
            <Link to="/dashboard"><Button size="lg" className="px-8">Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          ) : (
            <>
              <Link to="/register"><Button size="lg" className="px-8">Get Started Free <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              <Link to="/login"><Button variant="outline" size="lg" className="px-8">Sign In</Button></Link>
            </>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Everything you need</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <f.icon className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">Join LoyalChain today — whether you're a customer looking to earn rewards or a business wanting to launch your own loyalty program.</p>
          <div className="flex items-center justify-center gap-3">
            {user ? (
              <Link to="/dashboard"><Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">Go to Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/merchant/login"><Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">I'm a Merchant</Button></Link>
                <Link to="/admin/login"><Button size="lg" className="bg-blue-500 text-white hover:bg-blue-400 border border-blue-400 px-8">Admin Login</Button></Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>LoyalChain — Blockchain Loyalty Platform. Built on Ethereum.</p>
      </footer>
    </div>
  );
}
