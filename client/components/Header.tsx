import { motion } from "framer-motion";

export default function Header({ tenant, user, onLogout }: { tenant?: any; user?: any; onLogout?: () => void }) {
  return (
    <header className="w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <motion.a href="/" whileHover={{ scale: 1.02 }} className="text-lg font-extrabold tracking-tight">
          <span className="text-primary">Multi</span>
          <span className="text-foreground">Notes</span>
        </motion.a>
        <div className="flex items-center gap-3 text-sm">
          {tenant && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-lavender-50 text-lavender-700">
              <span className="font-medium">{tenant.name}</span>
              <span className="opacity-70">• {tenant.plan?.toUpperCase()}</span>
            </div>
          )}
          {user && (
            <div className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
              {user.email} ({user.role})
            </div>
          )}
          {onLogout && (
            <button onClick={onLogout} className="px-3 py-1.5 rounded-md bg-lavender-600 text-white hover:bg-lavender-700 transition-colors">
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
