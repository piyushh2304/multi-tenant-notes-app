import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { apiUrl } from "@/lib/api";
import { useNavigate } from "react-router-dom";

function useSession() {
  // undefined = loading, null = no session, object = session
  const [session, setSession] = useState<any | undefined>(undefined);
  useEffect(() => {
    const s = localStorage.getItem("session");
    if (s) setSession(JSON.parse(s));
    else setSession(null);
  }, []);
  return session;
}

export default function AppPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  async function loadNotes() {
    if (!session?.token) return;
    try {
      const url = apiUrl('/api/notes');
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.token}` }, mode: 'cors' });
      if (res.status === 401) {
        localStorage.removeItem('session');
        navigate('/?expired=1', { replace: true });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed to load notes: ${res.status}`);
        return;
      }
      const data = await res.json();
      setNotes(data);
    } catch (err: any) {
      console.error('Network error loading notes', err);
      setError('Network error loading notes. Please check your connection or server.');
    }
  }

  useEffect(() => {
    if (session?.token) loadNotes();
    const qp = new URLSearchParams(window.location.search);
    if (qp.get('checkout') === 'success' && localStorage.getItem('upgrade-intent') === '1') {
      localStorage.removeItem('upgrade-intent');
      if (session?.user?.role === 'admin') {
        upgrade();
      }
    } else if (qp.has('checkout')) {
      // Clean stale checkout params to avoid re-triggering
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    }
  }, [session?.token]);


  async function createNote() {
    setError("");
    if (!session?.token) return setError('No session');
    try {
      const url = apiUrl('/api/notes');
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ title, content }),
        mode: 'cors'
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        localStorage.removeItem('session');
        navigate('/?expired=1', { replace: true });
        return;
      }
      if (!res.ok) {
        setError(data.error || "Failed to create note");
        return;
      }
      setTitle("");
      setContent("");
      loadNotes();
    } catch (err: any) {
      console.error('Network error creating note', err);
      setError('Network error creating note.');
    }
  }

  async function removeNote(id: string) {
    if (!session?.token) return setError('No session');
    try {
      const url = apiUrl(`/api/notes/${id}`);
      const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${session.token}` }, mode: 'cors' });
      if (res.status === 401) {
        localStorage.removeItem('session');
        navigate('/?expired=1', { replace: true });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      loadNotes();
    } catch (err: any) {
      console.error('Network error deleting note', err);
      setError('Network error deleting note.');
    }
  }

  async function upgrade() {
    if (!session?.token) return setError('No session');
    const tenantSlug = session.tenant.slug;
    try {
      const url = apiUrl(`/api/tenants/${tenantSlug}/upgrade`);
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${session.token}` }, mode: 'cors' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        localStorage.removeItem('session');
        navigate('/?expired=1', { replace: true });
        return;
      }
      if (res.ok) {
        const updated = { ...session, tenant: { ...session.tenant, plan: data.plan } };
        localStorage.setItem("session", JSON.stringify(updated));
        setShowBilling(false);
        // remove checkout params and refresh data without full reload
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout');
        window.history.replaceState({}, '', url.toString());
        await loadNotes();
      } else {
        alert(data.error || "Upgrade failed");
      }
    } catch (err: any) {
      console.error('Network error during upgrade', err);
      alert('Network error during upgrade');
    }
  }

  const isFree = session?.tenant?.plan === "free";
  const isMember = session?.user?.role === "member";
  const isLimited = isFree && isMember && notes.length >= 3;
  const [showBilling, setShowBilling] = useState(false);
  const [stripeCfg, setStripeCfg] = useState<any>(null);

  useEffect(() => {
    async function loadStripeCfg() {
      try {
        const res = await fetch(apiUrl('/api/stripe/config'), { mode: 'cors' });
        const cfg = await res.json().catch(() => ({}));
        setStripeCfg(cfg);
      } catch (e) {
        console.error('Failed to load stripe config', e);
      }
    }
    if (showBilling) loadStripeCfg();
  }, [showBilling]);

  useEffect(() => {
    // Only navigate away if we've finished loading session and it's explicitly null
    if (session === undefined) return;
    if (session === null) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header tenant={session?.tenant} user={session?.user} onLogout={() => { localStorage.removeItem("session"); navigate('/'); }} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Notes</h1>
          {(isFree && notes.length >= 3) && (
            <button onClick={() => setShowBilling(true)} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">Upgrade to Pro</button>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold mb-2">Create Note</h2>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full mb-2 rounded-md border px-3 py-2" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" className="w-full mb-3 rounded-md border px-3 py-2 h-24" />
            <button onClick={createNote} disabled={isLimited} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">Create</button>
            {isFree && isMember && (
              <p className="text-xs text-muted-foreground mt-2">Free plan limited to 3 notes per tenant for members.</p>
            )}
          </div>
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold mb-2">Notes ({notes.length})</h2>
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="border rounded-lg p-3 flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</div>
                  </div>
                  <button onClick={() => removeNote(n.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                </li>
              ))}
              {notes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
            </ul>
          </div>
        </div>
      </main>

      {showBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBilling(false)} />
          <div className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-2xl border shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Choose a plan</h3>
              <button onClick={() => setShowBilling(false)} className="text-sm px-2 py-1 rounded-md border hover:bg-accent">Close</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-5">
                <h4 className="text-lg font-semibold">Basic</h4>
                <p className="text-sm text-muted-foreground mb-4">Free plan with up to 3 notes for members.</p>
                <div className="text-3xl font-extrabold">$0</div>
                {stripeCfg?.paymentLinkBasic ? (
                  <a href={stripeCfg.paymentLinkBasic} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block px-4 py-2 rounded-md border hover:bg-accent">Purchase</a>
                ) : (
                  <button disabled className="mt-4 px-4 py-2 rounded-md border opacity-60 cursor-not-allowed">Current</button>
                )}
              </div>
              <div className="border rounded-xl p-5">
                <h4 className="text-lg font-semibold">Pro</h4>
                <p className="text-sm text-muted-foreground mb-4">Unlimited notes for everyone in your tenant.</p>
                <div className="text-3xl font-extrabold">$5</div>
                {stripeCfg?.paymentLinkPro ? (
                  <a href={stripeCfg.paymentLinkPro} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">Purchase</a>
                ) : (
                  <button onClick={async () => {
                    if (!session?.tenant?.slug) return;
                    try {
                      const url = apiUrl('/api/billing/checkout');
                      const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan: 'pro', tenantSlug: session.tenant.slug }),
                        mode: 'cors'
                      });
                      const data = await res.json().catch(() => ({}));
                      if (data.url) {
                        localStorage.setItem('upgrade-intent', '1');
                        window.open(data.url, '_blank', 'noopener');
                      } else {
                        if (session?.user?.role === 'admin') {
                          await upgrade();
                        } else {
                          alert('Payment not available. Please ask your admin to upgrade.');
                        }
                      }
                    } catch (e) {
                      alert('Unable to start checkout');
                    }
                  }} className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">Purchase</button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Test mode. Use Stripe test cards when prompted.</p>
          </div>
        </div>
      )}
    </div>
  );
}
