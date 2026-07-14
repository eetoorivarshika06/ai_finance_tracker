import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  ArrowLeftRight,
  Target,
  Sparkles,
  MessageCircle,
  FileText,
  User,
  X,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "../routes/paths";
import { useSidebar } from "../context/SidebarContext";
import { useSelector } from "react-redux";

const links = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.ANALYTICS, label: "Analytics", icon: Activity },
  { to: ROUTES.TRANSACTIONS, label: "Transactions", icon: ArrowLeftRight },
  { to: ROUTES.BUDGET, label: "Budget", icon: Target },
  { to: ROUTES.INSIGHTS, label: "AI Insights", icon: Sparkles },
  { to: ROUTES.CHAT, label: "Assistant", icon: MessageCircle },
  { to: ROUTES.REPORTS, label: "Reports", icon: FileText },
  { to: ROUTES.PROFILE, label: "Profile", icon: User },
];

function SidebarContent({ onNavigate, isCollapsed, toggleCollapse }) {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-6 py-6 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h2 className="text-lg font-bold tracking-tight text-slate-100">FinanceAI</h2>
            <p className="text-xs text-slate-400">Smart tracking</p>
          </motion.div>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-100"
                  }`}
                  strokeWidth={1.75}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1"
                  >
                    {link.label}
                  </motion.span>
                )}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="h-1.5 w-1.5 rounded-full bg-indigo-400"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-700/50 p-4 bg-slate-900/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{user?.name || "User"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || "user@example.com"}</p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

function Sidebar() {
  const { isOpen, close } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Desktop */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-xl md:flex transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-xl md:hidden"
            >
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-6 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all duration-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={close} isCollapsed={false} toggleCollapse={() => {}} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
