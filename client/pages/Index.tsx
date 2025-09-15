import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { apiUrl } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const TEST_USERS = [
  { email: "admin@acme.test", tenantSlug: "acme", label: "Acme Admin" },
  { email: "user@acme.test", tenantSlug: "acme", label: "Acme Member" },
  { email: "admin@globex.test", tenantSlug: "globex", label: "Globex Admin" },
  { email: "user@globex.test", tenantSlug: "globex", label: "Globex Member" },
];

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");
  const [tenantSlug, setTenantSlug] = useState("acme");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem("session");
    if (session) {
      navigate("/app", { replace: true });
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get('expired') === '1') {
      setError('Session expired. Please sign in again.');
      url.searchParams.delete('expired');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const quickFill = (u: { email: string; tenantSlug: string }) => {
    setEmail(u.email);
    setTenantSlug(u.tenantSlug);
    setPassword("password");
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = apiUrl('/api/auth/login');
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, tenantSlug }),
        mode: 'cors'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`);
      localStorage.setItem("session", JSON.stringify(data));
      navigate("/app", { replace: true });
    } catch (err: any) {
      console.error('Login error', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent">
      <Header />
      <main className="max-w-5xl mx-auto px-4">
        <section className="py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Multi-tenant Notes SaaS
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="mt-4 text-lg text-muted-foreground">
              Secure, isolated notes for each company. Admins manage users and subscriptions; members focus on notes.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEST_USERS.map((u) => (
                <button key={u.email} onClick={() => quickFill(u)} className="text-sm px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">
                  {u.label}
                </button>
              ))}
            </motion.div>
          </div>
          <motion.form onSubmit={onLogin} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} className="bg-white shadow-xl rounded-2xl p-6 border">
            <h2 className="text-xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground mb-4">Use any predefined account. Password is "password".</p>
            <label className="block text-sm font-medium mb-1">Tenant</label>
            <select value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} className="w-full mb-3 rounded-md border px-3 py-2 bg-background">
              <option value="acme">Acme</option>
              <option value="globex">Globex</option>
            </select>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="w-full mb-3 rounded-md border px-3 py-2 bg-background" />
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 rounded-md border px-3 py-2 bg-background" />
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <button disabled={loading} className="w-full py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <p className="text-xs text-muted-foreground mt-3">No account? Sign up creates a member in the selected tenant.</p>
            <button type="button" onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const url = apiUrl('/api/auth/signup');
                const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, tenantSlug }), mode: 'cors' });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || `Signup failed (${res.status})`);
                localStorage.setItem("session", JSON.stringify(data));
                navigate("/app", { replace: true });
              } catch (err: any) {
                console.error('Signup error', err);
                setError(err.message || 'Network error');
              } finally {
                setLoading(false);
              }
            }} className="w-full mt-2 py-2 rounded-md border font-medium hover:bg-accent">
              Sign up
            </button>
          </motion.form>
        </section>
      </main>
    </div>
  );
}
