// Admin Dashboard App - Pro Parenting
import { useEffect, useState } from "react";
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import {
  LayoutDashboard,
  Users,
  UserRound,
  CheckSquare,
  Gift,
  BookOpen,
  MessageCircle,
  Download,
  BarChart3,
  ShieldCheck,
  LifeBuoy,
  Star,
  Wallet,
} from "lucide-react";
import logo from "@assets/logo.png";

// Types
interface Parent {
  id: string;
  name: string;
  email: string;
  subscriptionTier: "free" | "premium";
  planCode: string;
  childrenCount: number;
  createdAt: string;
}

interface Child {
  id: string;
  parentId: string;
  parentName: string;
  name: string;
  age: number;
  points: number;
  tasksCompleted: number;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  category: string;
  points: number;
  assignedTo: string;
  status: "pending" | "completed";
  createdAt: string;
}

interface Reward {
  id: string;
  title: string;
  pointsCost: number;
  timesRedeemed: number;
  createdAt: string;
}

interface Testimonial {
  id: string;
  name: string;
  imageUrl: string;
  text: string;
  isActive: boolean;
  createdAt: string;
}

// Mock data store
interface AdminStore {
  parents: Parent[];
  children: Child[];
  tasks: Task[];
  rewards: Reward[];
  testimonials: Testimonial[];
  stats: {
    totalParents: number;
    totalChildren: number;
    totalTasksCompleted: number;
    totalPointsEarned: number;
    totalRewardsRedeemed: number;
  };
  setParents: (parents: Parent[]) => void;
  setChildren: (children: Child[]) => void;
  setStats: (stats: AdminStore["stats"]) => void;
  addTestimonial: (testimonial: Omit<Testimonial, "id" | "createdAt">) => void;
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;
  toggleTestimonialActive: (id: string) => void;
}

const useAdminStore = create<AdminStore>((set) => ({
  parents: [],
  children: [],
  tasks: [],
  rewards: [],
  testimonials: [],
  stats: {
    totalParents: 0,
    totalChildren: 0,
    totalTasksCompleted: 0,
    totalPointsEarned: 0,
    totalRewardsRedeemed: 0,
  },
  setParents: (parents) => set(() => ({ parents })),
  setChildren: (children) => set(() => ({ children })),
  setStats: (stats) => set(() => ({ stats })),
  addTestimonial: (testimonial) =>
    set((state) => ({
      testimonials: [
        ...state.testimonials,
        { ...testimonial, id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0] },
      ],
    })),
  updateTestimonial: (id, updates) =>
    set((state) => ({
      testimonials: state.testimonials.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTestimonial: (id) =>
    set((state) => ({
      testimonials: state.testimonials.filter((t) => t.id !== id),
    })),
  toggleTestimonialActive: (id) =>
    set((state) => ({
      testimonials: state.testimonials.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)),
    })),
}));

type AdminPage =
  | "dashboard"
  | "parents"
  | "children"
  | "tasks"
  | "rewards"
  | "reports"
  | "subscriptions"
  | "learning"
  | "testimonials"
  | "data-exports"
  | "support"
  | "admin-access";

type AdminRole = "superadmin" | "admin";
type AdminUser = {
  email: string;
  role: AdminRole;
  passwordHash?: string;
  createdAt: string;
};

const ADMIN_EMAILS_RAW = (import.meta as { env?: Record<string, string> }).env?.VITE_ADMIN_EMAILS
  ?? (import.meta as { env?: Record<string, string> }).env?.VITE_ADMIN_EMAIL
  ?? "";
const ADMIN_EMAILS = ADMIN_EMAILS_RAW.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
const SUPER_ADMIN_EMAILS_RAW = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPER_ADMIN_EMAILS
  ?? ADMIN_EMAILS_RAW
  ?? "";
const SUPER_ADMIN_EMAILS = SUPER_ADMIN_EMAILS_RAW.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
const ADMIN_PASSWORD_HASH = (import.meta as { env?: Record<string, string> }).env?.VITE_ADMIN_PASSWORD_HASH ?? "";
const ADMIN_AUTH_KEY = "familyforge_admin_auth";
const ADMIN_USERS_KEY = "familyforge_admin_users";
const SUPPORT_TICKETS_KEY = "familyforge_support_tickets";
const APP_SETTINGS_KEY = "familyforge_app_settings";
const LEARNING_BATCHES_KEY = "familyforge_learning_batches";

type AppPlanPrices = {
  free: { monthly: number; yearly: number };
  pro: { monthly: number; yearly: number };
  forge: { monthly: number; yearly: number };
};

type TrialOffer = {
  enabled: boolean;
  label: string;
  firstMonthPrice: number;
  durationDays: number;
  targetPlanId: "forge" | "pro";
};

type AppPricingConfig = {
  planPrices: AppPlanPrices;
  mostPopularPlanId: "pro" | "forge";
  trialOffer: TrialOffer;
};

const DEFAULT_PLAN_PRICES: AppPlanPrices = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 6.99, yearly: 5.24 },
  forge: { monthly: 9.99, yearly: 7.49 },
};

const DEFAULT_PRICING_CONFIG: AppPricingConfig = {
  planPrices: DEFAULT_PLAN_PRICES,
  mostPopularPlanId: "forge",
  trialOffer: {
    enabled: false,
    label: "Forge Trial",
    firstMonthPrice: 1.99,
    durationDays: 30,
    targetPlanId: "forge",
  },
};

const normalizeNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const normalizePlanPrices = (input: unknown): AppPlanPrices => {
  const raw = input as Partial<AppPlanPrices> | undefined;
  return {
    free: {
      monthly: normalizeNumber(raw?.free?.monthly, DEFAULT_PLAN_PRICES.free.monthly),
      yearly: normalizeNumber(raw?.free?.yearly, DEFAULT_PLAN_PRICES.free.yearly),
    },
    pro: {
      monthly: normalizeNumber(raw?.pro?.monthly, DEFAULT_PLAN_PRICES.pro.monthly),
      yearly: normalizeNumber(raw?.pro?.yearly, DEFAULT_PLAN_PRICES.pro.yearly),
    },
    forge: {
      monthly: normalizeNumber(raw?.forge?.monthly, DEFAULT_PLAN_PRICES.forge.monthly),
      yearly: normalizeNumber(raw?.forge?.yearly, DEFAULT_PLAN_PRICES.forge.yearly),
    },
  };
};

const loadAppPricingConfig = (): AppPricingConfig => {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return DEFAULT_PRICING_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AppPricingConfig> & { planPrices?: unknown };
    const normalizedPrices = normalizePlanPrices(parsed?.planPrices ?? parsed?.planPrices);
    return {
      planPrices: normalizedPrices,
      mostPopularPlanId: parsed?.mostPopularPlanId === "pro" ? "pro" : "forge",
      trialOffer: {
        enabled: Boolean(parsed?.trialOffer?.enabled),
        label: parsed?.trialOffer?.label || DEFAULT_PRICING_CONFIG.trialOffer.label,
        firstMonthPrice: normalizeNumber(parsed?.trialOffer?.firstMonthPrice, DEFAULT_PRICING_CONFIG.trialOffer.firstMonthPrice),
        durationDays: normalizeNumber(parsed?.trialOffer?.durationDays, DEFAULT_PRICING_CONFIG.trialOffer.durationDays),
        targetPlanId: parsed?.trialOffer?.targetPlanId === "pro" ? "pro" : "forge",
      },
    };
  } catch {
    return DEFAULT_PRICING_CONFIG;
  }
};

const saveAppPricingConfig = (config: AppPricingConfig) => {
  localStorage.setItem(
    APP_SETTINGS_KEY,
    JSON.stringify({ ...config, updatedAt: new Date().toISOString() })
  );
};

const fetchAppPricingConfig = async (): Promise<AppPricingConfig> => {
  if (!isSupabaseConfigured()) {
    return loadAppPricingConfig();
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("plan_prices")
    .eq("key", "subscription_prices")
    .maybeSingle();

  if (error) {
    console.warn("Failed to load app settings:", error.message);
    return loadAppPricingConfig();
  }

  if (!data?.plan_prices) {
    return loadAppPricingConfig();
  }

  const rawConfig = data.plan_prices as Partial<AppPricingConfig> & { prices?: unknown };
  const normalized: AppPricingConfig = {
    planPrices: normalizePlanPrices((rawConfig as { prices?: unknown })?.prices ?? rawConfig),
    mostPopularPlanId: rawConfig?.mostPopularPlanId === "pro" ? "pro" : "forge",
    trialOffer: {
      enabled: Boolean(rawConfig?.trialOffer?.enabled),
      label: rawConfig?.trialOffer?.label || DEFAULT_PRICING_CONFIG.trialOffer.label,
      firstMonthPrice: normalizeNumber(rawConfig?.trialOffer?.firstMonthPrice, DEFAULT_PRICING_CONFIG.trialOffer.firstMonthPrice),
      durationDays: normalizeNumber(rawConfig?.trialOffer?.durationDays, DEFAULT_PRICING_CONFIG.trialOffer.durationDays),
      targetPlanId: rawConfig?.trialOffer?.targetPlanId === "pro" ? "pro" : "forge",
    },
  };
  saveAppPricingConfig(normalized);
  return normalized;
};

const upsertAppPricingConfig = async (config: AppPricingConfig) => {
  saveAppPricingConfig(config);
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase not configured" } as const;
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert({
      key: "subscription_prices",
      plan_prices: {
        prices: config.planPrices,
        mostPopularPlanId: config.mostPopularPlanId,
        trialOffer: config.trialOffer,
      },
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.warn("Failed to update app settings:", error.message);
    return { ok: false, error: error.message } as const;
  }
  return { ok: true } as const;
};

const hashText = async (value: string) => {
  if (!window.crypto?.subtle) return "";
  const data = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

type AdminAuthState = {
  email: string;
  role: AdminRole;
  authenticatedAt: number;
};

const loadAdminUsers = (): AdminUser[] => {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveAdminUsers = (users: AdminUser[]) => {
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
};

const fetchAdminUsersFromDb = async (): Promise<AdminUser[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("admin_users")
    .select("email, role, password_hash, created_at");
  if (error || !data) {
    return [];
  }
  return data.map((row) => ({
    email: row.email,
    role: (row.role === "superadmin" ? "superadmin" : "admin") as AdminRole,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  }));
};

type SupportTicket = {
  id: string;
  email: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
};

const loadSupportTickets = (): SupportTicket[] => {
  try {
    const raw = localStorage.getItem(SUPPORT_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupportTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSupportTickets = (tickets: SupportTicket[]) => {
  localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(tickets));
};

function AdminLogin({ onSuccess }: { onSuccess: (role: AdminRole, email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    const storedAdmins = loadAdminUsers();
    if (!window.crypto?.subtle) {
      setError("Secure login is not available in this browser.");
      return;
    }
    setLoading(true);
    const hashed = await hashText(password.trim());
    const normalizedEmail = email.trim().toLowerCase();
    const storedAdmin = storedAdmins.find((admin) => admin.email === normalizedEmail);

    let dbAdmin: { email: string; role: AdminRole; passwordHash: string } | null = null;
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from("admin_users")
        .select("email, role, password_hash")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (data) {
        dbAdmin = {
          email: data.email,
          role: data.role === "superadmin" ? "superadmin" : "admin",
          passwordHash: data.password_hash,
        };
      }
    }

    const isAllowed =
      SUPER_ADMIN_EMAILS.includes(normalizedEmail) ||
      ADMIN_EMAILS.includes(normalizedEmail) ||
      Boolean(storedAdmin) ||
      Boolean(dbAdmin);

    const passwordMatches =
      (dbAdmin && hashed === dbAdmin.passwordHash) ||
      (storedAdmin?.passwordHash && hashed === storedAdmin.passwordHash) ||
      (hashed === ADMIN_PASSWORD_HASH);

    if (!isAllowed || !passwordMatches) {
      setLoading(false);
      setError("Incorrect email or password.");
      return;
    }

    const role: AdminRole = SUPER_ADMIN_EMAILS.includes(normalizedEmail)
      ? "superadmin"
      : dbAdmin?.role ?? storedAdmin?.role ?? "admin";

    const payload: AdminAuthState = {
      email: normalizedEmail,
      role,
      authenticatedAt: Date.now(),
    };
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(payload));
    setLoading(false);
    onSuccess(role, normalizedEmail);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="FamilyForge" className="h-12 w-12 rounded-2xl object-cover" />
          <div>
            <h1 className="text-xl font-semibold text-white">FamilyForge Admin</h1>
            <p className="text-slate-500 text-sm">Secure access</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder={ADMIN_EMAILS[0] ?? "admin@familyforge.com"}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-red-400 text-sm">{error}</p> : null}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-violet-500 py-3 font-semibold text-white transition hover:bg-violet-600 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<AdminRole>("admin");
  const [currentEmail, setCurrentEmail] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const parents = useAdminStore((s) => s.parents);
  const children = useAdminStore((s) => s.children);
  const setParents = useAdminStore((s) => s.setParents);
  const setChildren = useAdminStore((s) => s.setChildren);
  const setStats = useAdminStore((s) => s.setStats);
  const stats = useAdminStore((s) => s.stats);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthenticated(false);
    setRole("admin");
    setCurrentEmail("");
  };

  const baseNavItems: { key: AdminPage; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "parents", label: "Parents", icon: Users },
    { key: "children", label: "Children", icon: UserRound },
    { key: "tasks", label: "Tasks", icon: CheckSquare },
    { key: "rewards", label: "Rewards", icon: Gift },
    { key: "learning", label: "Learning Content", icon: BookOpen },
    { key: "testimonials", label: "Testimonials", icon: MessageCircle },
    { key: "support", label: "Support Tickets", icon: LifeBuoy },
    { key: "data-exports", label: "Data Exports", icon: Download },
    { key: "subscriptions", label: "Subscriptions", icon: Wallet },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];

  const navItems: { key: AdminPage; label: string; icon: typeof LayoutDashboard }[] = role === "superadmin"
    ? [...baseNavItems, { key: "admin-access", label: "Admin Access", icon: ShieldCheck }]
    : baseNavItems;

  const currentLabel = navItems.find((item) => item.key === currentPage)?.label ?? "Dashboard";
  const adminCount = Array.from(new Set([
    ...SUPER_ADMIN_EMAILS,
    ...adminUsers.map((admin) => admin.email),
  ])).length;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "parents":
        return <ParentsPage />;
      case "children":
        return <ChildrenPage />;
      case "tasks":
        return <TasksPage />;
      case "rewards":
        return <RewardsPage />;
      case "learning":
        return <LearningContentPage />;
      case "testimonials":
        return <TestimonialsPage />;
      case "support":
        return <SupportTicketsPage />;
      case "data-exports":
        return <DataExportsPage />;
      case "subscriptions":
        return <SubscriptionsPage role={role} />;
      case "reports":
        return <ReportsPage role={role} />;
      case "admin-access":
        return <AdminAccessPage role={role} adminUsers={adminUsers} onUpdate={setAdminUsers} />;
      default:
        return <DashboardPage />;
    }
  };

  useEffect(() => {
    const localAdmins = loadAdminUsers();
    setAdminUsers(localAdmins);
    fetchAdminUsersFromDb().then((dbAdmins) => {
      if (dbAdmins.length === 0) return;
      const merged = [...localAdmins];
      dbAdmins.forEach((dbAdmin) => {
        if (!merged.find((admin) => admin.email === dbAdmin.email)) {
          merged.push(dbAdmin);
        }
      });
      setAdminUsers(merged);
    });
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) {
      setAuthChecked(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as AdminAuthState;
      const normalizedEmail = parsed.email?.toLowerCase() ?? "";
      const storedAdmins = loadAdminUsers();
      const storedAdmin = storedAdmins.find((admin) => admin.email === normalizedEmail);
      const isValid =
        SUPER_ADMIN_EMAILS.includes(normalizedEmail) ||
        ADMIN_EMAILS.includes(normalizedEmail) ||
        Boolean(storedAdmin);
      setAuthenticated(isValid);
      setRole(parsed.role ?? (SUPER_ADMIN_EMAILS.includes(normalizedEmail) ? "superadmin" : storedAdmin?.role ?? "admin"));
      setCurrentEmail(normalizedEmail);
    } catch {
      setAuthenticated(false);
      setRole("admin");
      setCurrentEmail("");
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!authenticated || !isSupabaseConfigured()) return;
      setDataLoading(true);
      const { data: parentRows } = await supabase
        .from("parents")
        .select("id,name,email,subscription_tier,plan_code,created_at");

      const { data: childRows } = await supabase
        .from("children")
        .select("id,parent_id,name,age,points,created_at");

      const safeParents = (parentRows ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        subscriptionTier: row.subscription_tier,
        planCode: row.plan_code ?? "free",
        childrenCount: 0,
        createdAt: row.created_at,
      }));

      const parentMap = safeParents.reduce<Record<string, Parent>>((acc, parent) => {
        acc[parent.id] = parent;
        return acc;
      }, {});

      const safeChildren = (childRows ?? []).map((row) => ({
        id: row.id,
        parentId: row.parent_id,
        parentName: parentMap[row.parent_id]?.name ?? "Unknown",
        name: row.name,
        age: row.age ?? 0,
        points: row.points ?? 0,
        tasksCompleted: 0,
        createdAt: row.created_at,
      }));

      const counts = safeChildren.reduce<Record<string, number>>((acc, child) => {
        if (!child.parentId) return acc;
        acc[child.parentId] = (acc[child.parentId] || 0) + 1;
        return acc;
      }, {});

      const hydratedParents = safeParents.map((parent) => ({
        ...parent,
        childrenCount: counts[parent.id] || 0,
      }));

      setParents(hydratedParents);
      setChildren(safeChildren);

      const totalPointsEarned = safeChildren.reduce((sum, child) => sum + (child.points || 0), 0);
      setStats({
        totalParents: hydratedParents.length,
        totalChildren: safeChildren.length,
        totalTasksCompleted: 0,
        totalPointsEarned,
        totalRewardsRedeemed: 0,
      });
      setDataLoading(false);
    };

    fetchAdminData();
  }, [authenticated, setParents, setChildren, setStats]);

  useEffect(() => {
    saveAdminUsers(adminUsers);
  }, [adminUsers]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Preparing admin dashboard...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={(nextRole, email) => {
      setRole(nextRole);
      setAuthenticated(true);
      setCurrentEmail(email);
    }} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800 p-5 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FamilyForge" className="h-10 w-10 rounded-2xl object-cover" />
            <div>
              <h1 className="text-lg font-semibold text-white">FamilyForge</h1>
              <p className="text-slate-500 text-xs">Premium Admin</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center gap-3 border ${
                currentPage === item.key
                  ? "bg-violet-500/20 text-white border-violet-500/40 shadow-[0_10px_30px_-15px_rgba(139,92,246,0.8)]"
                  : "text-slate-300 border-transparent hover:bg-slate-800/60"
              }`}
            >
              <item.icon
                size={18}
                className={currentPage === item.key ? "text-violet-300" : "text-slate-400"}
              />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-950/60 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-violet-500/80 flex items-center justify-center text-white font-semibold">
              {currentEmail ? currentEmail.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{role === "superadmin" ? "Super Admin" : "Admin"}</p>
                <span className={`text-[10px] uppercase px-2 py-1 rounded-full ${role === "superadmin" ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-300"}`}>
                  {role}
                </span>
              </div>
              <p className="text-slate-400 text-sm truncate">{currentEmail || "admin@familyforge.com"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">FamilyForge Admin</p>
              <h2 className="text-2xl font-semibold text-white mt-2">{currentLabel}</h2>
              <p className="text-slate-400 text-sm">Calm, premium oversight for your family operations.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
                <span className={`h-2 w-2 rounded-full ${dataLoading ? "bg-amber-400" : "bg-emerald-400"}`} />
                <p className="text-slate-300 text-sm">{dataLoading ? "Syncing data" : "Live data"}</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
                <span className="text-xs text-slate-400">Parents</span>
                <span className="text-sm text-white font-semibold">{stats.totalParents}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
                <span className="text-xs text-slate-400">Children</span>
                <span className="text-sm text-white font-semibold">{stats.totalChildren}</span>
              </div>
              {role === "superadmin" && (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
                  <span className="text-xs text-slate-400">Admins</span>
                  <span className="text-sm text-white font-semibold">{adminCount}</span>
                </div>
              )}
            </div>
          </div>

          {renderPage()}
        </div>
      </main>
    </div>
  );
}

// Dashboard Page
function DashboardPage() {
  const stats = useAdminStore((s) => s.stats);
  const children = useAdminStore((s) => s.children);
  const tasks = useAdminStore((s) => s.tasks);
  const parents = useAdminStore((s) => s.parents);

  const statCards = [
    { label: "Total Parents", value: stats.totalParents, color: "bg-blue-500", icon: Users },
    { label: "Total Children", value: stats.totalChildren, color: "bg-emerald-500", icon: UserRound },
    { label: "Tasks Completed", value: stats.totalTasksCompleted, color: "bg-purple-500", icon: CheckSquare },
    { label: "Points Earned", value: stats.totalPointsEarned, color: "bg-amber-500", icon: Star },
    { label: "Rewards Redeemed", value: stats.totalRewardsRedeemed, color: "bg-pink-500", icon: Gift },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <stat.icon size={20} className="text-slate-200" />
              <span className={`w-3 h-3 rounded-full ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Latest Parents</h3>
          {parents.length === 0 ? (
            <p className="text-slate-500 text-sm">No parent records yet.</p>
          ) : (
            <div className="space-y-3">
              {parents
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 4)
                .map((parent) => (
                  <div key={parent.id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{parent.name}</p>
                      <p className="text-slate-500 text-xs">{parent.email}</p>
                    </div>
                    <span className="text-slate-400 text-xs">{new Date(parent.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Latest Children</h3>
          {children.length === 0 ? (
            <p className="text-slate-500 text-sm">No child records yet.</p>
          ) : (
            <div className="space-y-3">
              {children
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 4)
                .map((child) => (
                  <div key={child.id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{child.name}</p>
                      <p className="text-slate-500 text-xs">Parent: {child.parentName}</p>
                    </div>
                    <span className="text-slate-400 text-xs">{new Date(child.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const height = [65, 80, 45, 90, 70, 55, 40][i];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-400"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-slate-400 text-xs">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
          <div className="space-y-3">
            {children.sort((a, b) => b.points - a.points).slice(0, 4).map((child, i) => (
              <div key={child.id} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl">
                <span className="text-2xl">{["🥇", "🥈", "🥉", "4️⃣"][i]}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{child.name}</p>
                  <p className="text-slate-400 text-sm">{child.tasksCompleted} tasks completed</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-semibold">{child.points}</p>
                  <p className="text-slate-400 text-xs">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Tasks</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="pb-3 text-slate-400 font-medium">Task</th>
                <th className="pb-3 text-slate-400 font-medium">Category</th>
                <th className="pb-3 text-slate-400 font-medium">Assigned To</th>
                <th className="pb-3 text-slate-400 font-medium">Points</th>
                <th className="pb-3 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-700/50">
                  <td className="py-4 text-white">{task.title}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-slate-700 rounded-full text-slate-300 text-sm">
                      {task.category}
                    </span>
                  </td>
                  <td className="py-4 text-slate-300">{task.assignedTo}</td>
                  <td className="py-4 text-amber-400">{task.points}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      task.status === "completed" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-slate-700 text-slate-300"
                    }`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Parents Page
function ParentsPage() {
  const parents = useAdminStore((s) => s.parents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // User settings interface
  interface UserSettings {
    notifications: {
      taskReminders: boolean;
      achievementAlerts: boolean;
      weeklyReports: boolean;
      routineReminders: boolean;
      urgentAlerts: boolean;
      motivationalNudges: boolean;
    };
    sync: {
      cloudSyncEnabled: boolean;
      autoSync: boolean;
    };
    privacy: {
      showPointsToChildren: boolean;
      hidePersonalInReports: boolean;
      allowAnalytics: boolean;
    };
  }

  const filteredParents = parents.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewSettings = (parent: Parent) => {
    setSelectedParent(parent);
    // Mock settings - in real app, fetch from Supabase
    setUserSettings({
      notifications: {
        taskReminders: true,
        achievementAlerts: true,
        weeklyReports: true,
        routineReminders: true,
        urgentAlerts: true,
        motivationalNudges: false,
      },
      sync: {
        cloudSyncEnabled: true,
        autoSync: true,
      },
      privacy: {
        showPointsToChildren: true,
        hidePersonalInReports: false,
        allowAnalytics: true,
      },
    });
  };

  const handleToggleSetting = (
    category: 'notifications' | 'sync' | 'privacy',
    key: string,
    value: boolean
  ) => {
    if (!userSettings) return;
    setUserSettings({
      ...userSettings,
      [category]: {
        ...userSettings[category],
        [key]: value,
      },
    });
  };

  const handleSaveSettings = () => {
    // In real app, save to Supabase
    console.log('Saving settings for', selectedParent?.id, userSettings);
    alert(`Settings saved for ${selectedParent?.name}!`);
    setSelectedParent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Parents Management</h2>
          <p className="text-slate-400 mt-1">{parents.length} registered parents</p>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <span>+</span> Add Parent
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <input
          type="text"
          placeholder="Search parents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Parents Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Name</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Email</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Subscription</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Children</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Joined</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => (
              <tr key={parent.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
                      {parent.name.charAt(0)}
                    </div>
                    <span className="text-white font-medium">{parent.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-300">{parent.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    parent.subscriptionTier === "premium"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-slate-700 text-slate-300"
                  }`}>
                    {parent.subscriptionTier}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300">{parent.childrenCount}</td>
                <td className="px-6 py-4 text-slate-400">{parent.createdAt}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewSettings(parent)}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                    >
                      ⚙️ Settings
                    </button>
                    <button className="text-blue-400 hover:text-blue-300">Edit</button>
                    <button className="text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Settings Modal */}
      {selectedParent && userSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedParent(null)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">User Settings</h3>
                <p className="text-slate-400">{selectedParent.name} ({selectedParent.email})</p>
              </div>
              <button
                onClick={() => setSelectedParent(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Notifications Section */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                🔔 Notification Settings
              </h4>
              <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                {[
                  { key: 'taskReminders', label: 'Task Reminders', desc: 'Get notified about pending tasks' },
                  { key: 'achievementAlerts', label: 'Achievement Alerts', desc: 'Celebrate wins' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive PDF report every Sunday' },
                  { key: 'routineReminders', label: 'Routine Reminders', desc: 'Daily routine notifications' },
                  { key: 'urgentAlerts', label: 'Urgent Alerts', desc: 'Critical updates' },
                  { key: 'motivationalNudges', label: 'Motivational Nudges', desc: 'Encouragement messages' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-white">{label}</p>
                      <p className="text-slate-400 text-sm">{desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('notifications', key, !userSettings.notifications[key as keyof typeof userSettings.notifications])}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        userSettings.notifications[key as keyof typeof userSettings.notifications]
                          ? 'bg-emerald-500'
                          : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        userSettings.notifications[key as keyof typeof userSettings.notifications]
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Section */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                ☁️ Sync & Backup
              </h4>
              <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                {[
                  { key: 'cloudSyncEnabled', label: 'Cloud Sync', desc: 'Sync data across devices' },
                  { key: 'autoSync', label: 'Auto-sync', desc: 'Real-time synchronization' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-white">{label}</p>
                      <p className="text-slate-400 text-sm">{desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('sync', key, !userSettings.sync[key as keyof typeof userSettings.sync])}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        userSettings.sync[key as keyof typeof userSettings.sync]
                          ? 'bg-emerald-500'
                          : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        userSettings.sync[key as keyof typeof userSettings.sync]
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Section */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                🔒 Privacy Settings
              </h4>
              <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                {[
                  { key: 'showPointsToChildren', label: 'Show Points to Children', desc: 'Let children see point balances' },
                  { key: 'hidePersonalInReports', label: 'Hide Sensitive Info', desc: 'Blur personal details in reports' },
                  { key: 'allowAnalytics', label: 'Allow Analytics', desc: 'Help improve the app' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-white">{label}</p>
                      <p className="text-slate-400 text-sm">{desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('privacy', key, !userSettings.privacy[key as keyof typeof userSettings.privacy])}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        userSettings.privacy[key as keyof typeof userSettings.privacy]
                          ? 'bg-emerald-500'
                          : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        userSettings.privacy[key as keyof typeof userSettings.privacy]
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-amber-400 text-sm">
                ⚠️ Only modify user settings if they have explicitly requested changes. 
                All modifications are logged for compliance.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setSelectedParent(null)}
                className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Children Page
function ChildrenPage() {
  const children = useAdminStore((s) => s.children);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChildren = children.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Children Management</h2>
          <p className="text-slate-400 mt-1">{children.length} children profiles</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <span>+</span> Add Child
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <input
          type="text"
          placeholder="Search children..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChildren.map((child) => (
          <div key={child.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {child.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{child.name}</h3>
                <p className="text-slate-400 text-sm">{child.age} years old</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Parent</span>
                <span className="text-slate-300">{child.parentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Points</span>
                <span className="text-amber-400 font-semibold">{child.points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tasks Completed</span>
                <span className="text-emerald-400">{child.tasksCompleted}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors">
                View
              </button>
              <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tasks Page
function TasksPage() {
  const tasks = useAdminStore((s) => s.tasks);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredTasks = tasks.filter(t => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Tasks & Exercises</h2>
          <p className="text-slate-400 mt-1">{tasks.length} tasks created</p>
        </div>
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <span>+</span> Create Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800 rounded-xl w-fit border border-slate-700">
        {(["all", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === f ? "bg-purple-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Task</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Points</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Assigned To</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Status</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                <td className="px-6 py-4 text-white font-medium">{task.title}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-700 rounded-full text-slate-300 text-sm">
                    {task.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-amber-400 font-semibold">{task.points}</td>
                <td className="px-6 py-4 text-slate-300">{task.assignedTo}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-blue-400 hover:text-blue-300">Edit</button>
                    <button className="text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Rewards Page
function RewardsPage() {
  const rewards = useAdminStore((s) => s.rewards);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Rewards Management</h2>
          <p className="text-slate-400 mt-1">{rewards.length} rewards available</p>
        </div>
        <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <span>+</span> Add Reward
        </button>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <span className="text-5xl">🎁</span>
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold">{reward.title}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Cost</span>
                  <span className="text-amber-400 font-semibold">{reward.pointsCost} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Redeemed</span>
                  <span className="text-emerald-400">{reward.timesRedeemed}x</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">
                  Edit
                </button>
                <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg text-sm transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Learning Content Page - CSV Upload for Learning Categories
function LearningContentPage() {
  type LearningBatch = {
    id: string;
    categoryId: string;
    categoryLabel: string;
    year: number;
    type: "questions" | "words";
    createdAt: string;
    header: string[];
    rows: string[][];
    rawText: string;
  };

  const [selectedCategory, setSelectedCategory] = useState<string>("words");
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [uploadType, setUploadType] = useState<"questions" | "words">("questions");
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [rawCsvText, setRawCsvText] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [lastImportCount, setLastImportCount] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingErrors, setEditingErrors] = useState<string[]>([]);
  const [batchPage, setBatchPage] = useState(1);
  const [batches, setBatches] = useState<LearningBatch[]>(() => {
    try {
      const raw = localStorage.getItem(LEARNING_BATCHES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LearningBatch[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const LEARNING_CATEGORIES = [
    { id: "words", label: "Word of the Day", emoji: "📚" },
    { id: "maths", label: "Mathematics", emoji: "🔢" },
    { id: "reading", label: "Reading", emoji: "📖" },
    { id: "writing", label: "Writing", emoji: "✍️" },
    { id: "english_comprehension", label: "English Comprehension", emoji: "📝" },
    { id: "history", label: "History", emoji: "🏛️" },
    { id: "geography", label: "Geography", emoji: "🌍" },
    { id: "physics", label: "Physics", emoji: "⚛️" },
    { id: "chemistry", label: "Chemistry", emoji: "🧪" },
    { id: "biology", label: "Biology", emoji: "🧬" },
    { id: "primary_science", label: "Primary Science", emoji: "🔬" },
    { id: "civic_education", label: "Civic Education", emoji: "🏫" },
    { id: "government", label: "Government", emoji: "🏛️" },
    { id: "finance", label: "Finance", emoji: "💰" },
    { id: "current_affairs", label: "Current Affairs", emoji: "📰" },
    { id: "general_knowledge", label: "General Knowledge", emoji: "🧠" },
    { id: "economics", label: "Economics", emoji: "📊" },
    { id: "computer", label: "Computer Studies", emoji: "💻" },
    { id: "literature", label: "Literature", emoji: "📜" },
    { id: "music", label: "Music", emoji: "🎵" },
    { id: "french", label: "French", emoji: "🇫🇷" },
    { id: "agriculture", label: "Agriculture", emoji: "🌾" },
  ];

  const ACADEMIC_YEARS = Array.from({ length: 13 }, (_, i) => ({
    value: i + 1,
    label: `Year ${i + 1}`,
    ageRange: `${i + 5}-${i + 6} years`,
  }));

  useEffect(() => {
    localStorage.setItem(LEARNING_BATCHES_KEY, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(batches.length / 10));
    if (batchPage > totalPages) {
      setBatchPage(totalPages);
    }
  }, [batches, batchPage]);

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
    );
    return lines.filter((line) => line.some((cell) => cell.length > 0));
  };

  const validateCsv = (data: string[][], type: "questions" | "words") => {
    const errors: string[] = [];

    if (data.length < 2) {
      errors.push("CSV must have at least a header row and one data row");
      return errors;
    }

    const header = data[0];

    if (type === "words") {
      const requiredCols = ["word", "meaning", "partofspeech", "opposites", "synonyms", "context", "examples"];
      const headerLower = header.map((h) => h.toLowerCase().replace(/\s+/g, ""));

      for (const col of requiredCols) {
        if (!headerLower.includes(col)) {
          errors.push(`Missing required column: ${col}`);
        }
      }

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length < 7) {
          errors.push(`Row ${i + 1}: Not enough columns (expected 7, got ${row.length})`);
        } else {
          if (!row[0]) errors.push(`Row ${i + 1}: Word is required`);
          if (!row[1]) errors.push(`Row ${i + 1}: Meaning is required`);
          if (!row[2]) errors.push(`Row ${i + 1}: Part of speech is required`);
        }
      }
    } else {
      const requiredCols = ["question", "choice1", "choice2", "choice3", "choice4", "correctindex", "explanation"];
      const headerLower = header.map((h) => h.toLowerCase().replace(/\s+/g, ""));

      for (const col of requiredCols) {
        if (!headerLower.includes(col)) {
          errors.push(`Missing required column: ${col}`);
        }
      }

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length < 7) {
          errors.push(`Row ${i + 1}: Not enough columns (expected 7, got ${row.length})`);
        } else {
          if (!row[0]) errors.push(`Row ${i + 1}: Question is required`);
          if (!row[1] || !row[2] || !row[3] || !row[4]) {
            errors.push(`Row ${i + 1}: All 4 choices are required`);
          }
          const correctIndex = parseInt(row[5]);
          if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
            errors.push(`Row ${i + 1}: Correct index must be 0-3`);
          }
        }
      }
    }

    return errors;
  };

  const updatePreviewFromText = (text: string) => {
    const parsed = parseCsvText(text);
    setRawCsvText(text);
    setCsvPreview(parsed);
    setValidationErrors(validateCsv(parsed, uploadType));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      updatePreviewFromText(text);
    };
    reader.readAsText(file);
  };

  const handlePastePreview = () => {
    if (!pasteText.trim()) return;
    updatePreviewFromText(pasteText);
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0 || csvPreview.length < 2) return;

    setIsUploading(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const category = LEARNING_CATEGORIES.find((cat) => cat.id === selectedCategory);
    const batchId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now().toString();

    const newBatch: LearningBatch = {
      id: batchId,
      categoryId: selectedCategory,
      categoryLabel: category?.label ?? selectedCategory,
      year: selectedYear,
      type: uploadType,
      createdAt: new Date().toISOString(),
      header: csvPreview[0] ?? [],
      rows: csvPreview.slice(1),
      rawText: rawCsvText || csvPreview.map((row) => row.join(",")).join("\n"),
    };

    setBatches([newBatch, ...batches]);
    setIsUploading(false);
    setLastImportCount(csvPreview.length - 1);
    setUploadSuccess(true);
    setCsvPreview([]);
    setRawCsvText("");
    setPasteText("");
    setBatchPage(1);

    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const downloadTemplate = () => {
    let csvContent = "";

    if (uploadType === "words") {
      csvContent = "word,meaning,partOfSpeech,opposites,synonyms,context,examples\n";
      csvContent += "example,a thing characteristic of its kind,noun,\"atypical|exception\",\"sample|instance\",Used to show typical usage,\"This is an example|Here's another example\"\n";
    } else {
      csvContent = "question,choice1,choice2,choice3,choice4,correctIndex,explanation\n";
      csvContent += "What is 2 + 2?,3,4,5,6,1,2 + 2 equals 4 because when you add two items to another two items you get four items total.\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = uploadType === "words" ? "words_template.csv" : "questions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCategoryLabel =
    LEARNING_CATEGORIES.find((cat) => cat.id === selectedCategory)?.label ?? selectedCategory;
  const selectedYearMeta = ACADEMIC_YEARS.find((year) => year.value === selectedYear);

  const promptText = uploadType === "words"
    ? `Generate 50 vocabulary entries for ${selectedCategoryLabel} (Academic Year ${selectedYearMeta?.label ?? selectedYear}, ${selectedYearMeta?.ageRange ?? ""}).\nReturn CSV ONLY with this exact header line: word,meaning,partOfSpeech,opposites,synonyms,context,examples\nRules: use commas between columns, no extra commentary, and use | to separate multiple items in opposites, synonyms, or examples.`
    : `Generate 50 multiple-choice questions for ${selectedCategoryLabel} (Academic Year ${selectedYearMeta?.label ?? selectedYear}, ${selectedYearMeta?.ageRange ?? ""}).\nReturn CSV ONLY with this exact header line: question,choice1,choice2,choice3,choice4,correctIndex,explanation\nRules: correctIndex must be 0-3, commas between columns, no extra commentary.`;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = promptText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    }
  };

  const handleDeleteBatch = (id: string) => {
    setBatches(batches.filter((batch) => batch.id !== id));
  };

  const handleEditBatch = (batch: LearningBatch) => {
    setEditingBatchId(batch.id);
    setEditingText(batch.rawText);
    setEditingErrors([]);
  };

  const handleSaveEdit = () => {
    const parsed = parseCsvText(editingText);
    const targetBatch = batches.find((batch) => batch.id === editingBatchId);
    const errors = validateCsv(parsed, targetBatch?.type ?? uploadType);
    setEditingErrors(errors);
    if (errors.length > 0 || parsed.length < 2) return;

    setBatches(
      batches.map((batch) =>
        batch.id === editingBatchId
          ? {
              ...batch,
              header: parsed[0] ?? [],
              rows: parsed.slice(1),
              rawText: editingText,
            }
          : batch
      )
    );
    setEditingBatchId(null);
    setEditingText("");
  };

  const pagedBatches = batches.slice((batchPage - 1) * 10, batchPage * 10);
  const totalPages = Math.max(1, Math.ceil(batches.length / 10));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Learning Content</h2>
        <p className="text-slate-400 mt-1">Generate prompts, upload, or paste CSV content for each category and academic year</p>
      </div>

      {uploadSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-emerald-400 font-medium">Import Saved!</p>
            <p className="text-emerald-400/70 text-sm">
              {lastImportCount} {uploadType === "words" ? "words" : "questions"} were saved in a new batch
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Select Category</h3>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setUploadType(e.target.value === "words" ? "words" : "questions");
            }}
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
          >
            {LEARNING_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Academic Year</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
          >
            {ACADEMIC_YEARS.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label} ({year.ageRange})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Content Type</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setUploadType("questions")}
              disabled={selectedCategory === "words"}
              className={`flex-1 py-3 rounded-lg transition-colors ${
                uploadType === "questions"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              } ${selectedCategory === "words" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Questions
            </button>
            <button
              onClick={() => setUploadType("words")}
              disabled={selectedCategory !== "words"}
              className={`flex-1 py-3 rounded-lg transition-colors ${
                uploadType === "words"
                  ? "bg-purple-500 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              } ${selectedCategory !== "words" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Vocabulary
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Prompt Generator</h3>
          <button
            onClick={copyPrompt}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
          >
            {promptCopied ? "Copied!" : "Copy Prompt"}
          </button>
        </div>
        <textarea
          value={promptText}
          readOnly
          rows={4}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-200"
        />
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Upload CSV</h3>
          <button
            onClick={downloadTemplate}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
          >
            📥 Download Template
          </button>
        </div>

        <div className="mb-6 p-4 bg-slate-700/50 rounded-xl">
          <p className="text-slate-300 font-medium mb-2">Expected CSV Format:</p>
          {uploadType === "words" ? (
            <code className="text-sm text-slate-400 block">
              word, meaning, partOfSpeech, opposites, synonyms, context, examples
              <br />
              <span className="text-slate-500">(Use | to separate multiple items in opposites, synonyms, and examples)</span>
            </code>
          ) : (
            <code className="text-sm text-slate-400 block">
              question, choice1, choice2, choice3, choice4, correctIndex, explanation
              <br />
              <span className="text-slate-500">(correctIndex is 0-3, where 0 = choice1, 1 = choice2, etc.)</span>
            </code>
          )}
        </div>

        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <span className="text-4xl block mb-4">📄</span>
            <p className="text-white font-medium">Click to upload CSV file</p>
            <p className="text-slate-400 text-sm mt-1">or drag and drop</p>
          </label>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Paste CSV Content</h3>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={6}
          placeholder="Paste CSV rows here..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-200"
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={handlePastePreview}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
          >
            Preview Paste
          </button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400 font-medium mb-2">⚠️ Validation Errors:</p>
          <ul className="text-red-400/80 text-sm space-y-1">
            {validationErrors.slice(0, 10).map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
            {validationErrors.length > 10 && (
              <li className="text-red-400/60">... and {validationErrors.length - 10} more errors</li>
            )}
          </ul>
        </div>
      )}

      {csvPreview.length > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Preview (first 5 rows)</h3>
              <p className="text-slate-400 text-sm">{csvPreview.length - 1} rows ready to import</p>
            </div>
            <button
              onClick={handleUpload}
              disabled={validationErrors.length > 0 || isUploading}
              className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                validationErrors.length > 0 || isUploading
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {isUploading ? "Saving..." : `Save ${csvPreview.length - 1} ${uploadType === "words" ? "Words" : "Questions"}`}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr>
                  {csvPreview[0]?.map((header, i) => (
                    <th key={i} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(1, 6).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-slate-700/50">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-slate-300 max-w-xs truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Saved Entry Batches</h3>
        {batches.length === 0 ? (
          <p className="text-slate-500 text-sm">No batches yet. Upload or paste CSV to save a batch.</p>
        ) : (
          <div className="space-y-4">
            {pagedBatches.map((batch) => (
              <div key={batch.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">{batch.categoryLabel} • Year {batch.year}</p>
                    <p className="text-slate-500 text-xs">
                      {batch.type === "words" ? "Vocabulary" : "Questions"} • {new Date(batch.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditBatch(batch)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">Preview (first 5 entries)</div>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        {batch.header.map((header, idx) => (
                          <th key={idx} className="text-left px-3 py-2">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {batch.rows.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-slate-800">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-slate-300 max-w-xs truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setBatchPage(pageNumber)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      pageNumber === batchPage
                        ? "bg-blue-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {editingBatchId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Edit Batch CSV</h3>
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              rows={10}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-200"
            />
            {editingErrors.length > 0 && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                <p className="text-red-400 font-medium mb-2">Fix these issues before saving:</p>
                <ul className="text-red-400/80 text-sm space-y-1">
                  {editingErrors.slice(0, 6).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingBatchId(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Testimonials Page
function TestimonialsPage() {
  const testimonials = useAdminStore((s) => s.testimonials);
  const addTestimonial = useAdminStore((s) => s.addTestimonial);
  const updateTestimonial = useAdminStore((s) => s.updateTestimonial);
  const deleteTestimonial = useAdminStore((s) => s.deleteTestimonial);
  const toggleTestimonialActive = useAdminStore((s) => s.toggleTestimonialActive);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", imageUrl: "", text: "", isActive: true });

  const handleAdd = () => {
    if (formData.name && formData.text && formData.imageUrl) {
      addTestimonial(formData);
      setFormData({ name: "", imageUrl: "", text: "", isActive: true });
      setShowAddModal(false);
    }
  };

  const handleEdit = (id: string) => {
    const t = testimonials.find((t) => t.id === id);
    if (t) {
      setFormData({ name: t.name, imageUrl: t.imageUrl, text: t.text, isActive: t.isActive });
      setEditingId(id);
      setShowAddModal(true);
    }
  };

  const handleUpdate = () => {
    if (editingId && formData.name && formData.text) {
      updateTestimonial(editingId, formData);
      setFormData({ name: "", imageUrl: "", text: "", isActive: true });
      setEditingId(null);
      setShowAddModal(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", imageUrl: "", text: "", isActive: true });
    setEditingId(null);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Testimonials</h2>
          <p className="text-slate-400 mt-1">Manage testimonials shown on the app's paywall screen</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Testimonial
        </button>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className={`bg-slate-800 rounded-2xl p-5 border ${
              t.isActive ? "border-slate-700" : "border-slate-700/50 opacity-60"
            }`}
          >
            <div className="flex items-start gap-4">
              <img
                src={t.imageUrl}
                alt={t.name}
                className="w-16 h-16 rounded-full object-cover bg-slate-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=?";
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">{t.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-600/50 text-slate-400"
                    }`}
                  >
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-slate-300 text-sm italic line-clamp-3">"{t.text}"</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(t.id)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleTestimonialActive(t.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      t.isActive
                        ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                        : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {t.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteTestimonial(t.id)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? "Edit Testimonial" : "Add New Testimonial"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah M."
                  className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Profile Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
                {formData.imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-full object-cover bg-slate-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=?";
                      }}
                    />
                    <span className="text-slate-400 text-sm">Preview</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Testimonial Text</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Write a heartfelt testimonial..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="isActive" className="text-slate-300 text-sm">
                  Show on app (active)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                {editingId ? "Save Changes" : "Add Testimonial"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionsPage({ role }: { role: AdminRole }) {
  const [config, setConfig] = useState<AppPricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAppPricingConfig()
      .then((nextConfig) => setConfig(nextConfig))
      .finally(() => setLoading(false));
  }, []);

  const updatePrice = (plan: keyof AppPlanPrices, cycle: "monthly" | "yearly", value: string) => {
    const numeric = Math.max(0, Number(value));
    setConfig((prev) => ({
      ...prev,
      planPrices: {
        ...prev.planPrices,
        [plan]: {
          ...prev.planPrices[plan],
          [cycle]: Number.isFinite(numeric) ? numeric : 0,
        },
      },
    }));
  };

  const handleSave = async () => {
    setStatus(null);
    if (role !== "superadmin") {
      setStatus("Only super admins can update pricing.");
      return;
    }
    setSaving(true);
    const result = await upsertAppPricingConfig(config);
    setSaving(false);
    if (result.ok) {
      setStatus("Prices saved. These will appear in onboarding and upgrade screens.");
    } else {
      setStatus(result.error ?? "Unable to save prices.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Subscription Pricing</h2>
        <p className="text-slate-400 mt-1">Update pricing used across onboarding and upgrade screens.</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading pricing…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["free", "pro", "forge"] as const).map((plan) => (
              <div key={plan} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-white font-semibold capitalize">{plan} plan</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Monthly price (GBP)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={config.planPrices[plan].monthly}
                      onChange={(e) => updatePrice(plan, "monthly", e.target.value)}
                      disabled={role !== "superadmin"}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Yearly price (per month, GBP)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={config.planPrices[plan].yearly}
                      onChange={(e) => updatePrice(plan, "yearly", e.target.value)}
                      disabled={role !== "superadmin"}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Most Popular Plan</h3>
          <select
            value={config.mostPopularPlanId}
            onChange={(e) => setConfig((prev) => ({
              ...prev,
              mostPopularPlanId: e.target.value === "pro" ? "pro" : "forge",
            }))}
            disabled={role !== "superadmin"}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
          >
            <option value="pro">Pro</option>
            <option value="forge">Forge</option>
          </select>
          <p className="text-slate-500 text-xs mt-2">This plan will show the “Most Popular” badge.</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Trial Plan</h3>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={config.trialOffer.enabled}
                onChange={(e) => setConfig((prev) => ({
                  ...prev,
                  trialOffer: { ...prev.trialOffer, enabled: e.target.checked },
                }))}
                disabled={role !== "superadmin"}
              />
              Enable trial
            </label>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400">Trial label</label>
              <input
                type="text"
                value={config.trialOffer.label}
                onChange={(e) => setConfig((prev) => ({
                  ...prev,
                  trialOffer: { ...prev.trialOffer, label: e.target.value },
                }))}
                disabled={role !== "superadmin"}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">First month price (GBP)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={config.trialOffer.firstMonthPrice}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    trialOffer: {
                      ...prev.trialOffer,
                      firstMonthPrice: Number(e.target.value),
                    },
                  }))}
                  disabled={role !== "superadmin"}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Trial days</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={config.trialOffer.durationDays}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    trialOffer: {
                      ...prev.trialOffer,
                      durationDays: Number(e.target.value),
                    },
                  }))}
                  disabled={role !== "superadmin"}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">After trial, move to</label>
              <select
                value={config.trialOffer.targetPlanId}
                onChange={(e) => setConfig((prev) => ({
                  ...prev,
                  trialOffer: {
                    ...prev.trialOffer,
                    targetPlanId: e.target.value === "pro" ? "pro" : "forge",
                  },
                }))}
                disabled={role !== "superadmin"}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-white"
              >
                <option value="forge">Forge</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-violet-500 px-6 py-3 text-white font-semibold disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Pricing"}
        </button>
        {status ? <p className="text-slate-400 text-sm">{status}</p> : null}
      </div>
    </div>
  );
}

// Reports Page
function ReportsPage({ role }: { role: AdminRole }) {
  const stats = useAdminStore((s) => s.stats);
  const parents = useAdminStore((s) => s.parents);
  const children = useAdminStore((s) => s.children);
  const [planPrices, setPlanPrices] = useState<AppPlanPrices>(DEFAULT_PLAN_PRICES);

  useEffect(() => {
    fetchAppPricingConfig().then((config) => setPlanPrices(config.planPrices));
  }, []);

  const premiumCount = parents.filter((parent) => parent.subscriptionTier === "premium").length;
  const proCount = parents.filter((parent) => parent.planCode === "pro").length;
  const forgeCount = parents.filter((parent) => parent.planCode === "forge").length;
  const freeCount = parents.length - premiumCount;
  const avgChildren = parents.length === 0 ? 0 : Number((children.length / parents.length).toFixed(1));
  const premiumMonthlyPrice = planPrices.pro.monthly;
  const estimatedMRR = premiumMonthlyPrice > 0 ? premiumCount * premiumMonthlyPrice : 0;

  const now = new Date();
  const last7 = new Date(now);
  last7.setDate(now.getDate() - 7);
  const last30 = new Date(now);
  last30.setDate(now.getDate() - 30);
  const last6Months = new Date(now);
  last6Months.setMonth(now.getMonth() - 6);
  const last12Months = new Date(now);
  last12Months.setFullYear(now.getFullYear() - 1);

  const signupsLast7 = parents.filter((parent) => new Date(parent.createdAt) >= last7).length;
  const signupsLast30 = parents.filter((parent) => new Date(parent.createdAt) >= last30).length;

  const moneyLast30 = estimatedMRR;
  const moneyLast6Months = estimatedMRR * 6;
  const moneyLast12Months = estimatedMRR * 12;

  const getFinancialYears = (count: number) => {
    const years: { label: string; start: Date; end: Date }[] = [];
    const baseYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    for (let i = 0; i < count; i++) {
      const startYear = baseYear - i;
      const start = new Date(startYear, 3, 1);
      const end = new Date(startYear + 1, 2, 31, 23, 59, 59, 999);
      years.push({ label: `FY ${startYear}/${String(startYear + 1).slice(-2)}`, start, end });
    }
    return years;
  };

  const financialYears = getFinancialYears(5);

  const downloadFinancialYear = (label: string, start: Date, end: Date) => {
    const premiumInYear = parents.filter((parent) =>
      parent.subscriptionTier === "premium" &&
      new Date(parent.createdAt) >= start &&
      new Date(parent.createdAt) <= end
    ).length;
    const revenue = premiumMonthlyPrice * premiumInYear * 12;

    const rows = [
      ["Financial Year", label],
      ["Start Date", start.toISOString()],
      ["End Date", end.toISOString()],
      ["Premium Parents", String(premiumInYear)],
      ["Estimated Revenue", revenue.toFixed(2)],
    ];
    downloadCsv(`financial-year-${label.replace(/\s+/g, "-")}.csv`, rows);
  };

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportParents = () => {
    const rows = [
      ["id", "name", "email", "subscriptionTier", "childrenCount", "createdAt"],
      ...parents.map((parent) => [
        parent.id,
        parent.name,
        parent.email,
        parent.subscriptionTier,
        String(parent.childrenCount),
        parent.createdAt,
      ]),
    ];
    downloadCsv("parents_export.csv", rows);
  };

  const exportChildren = () => {
    const rows = [
      ["id", "name", "parentName", "age", "points", "createdAt"],
      ...children.map((child) => [
        child.id,
        child.name,
        child.parentName,
        String(child.age),
        String(child.points),
        child.createdAt,
      ]),
    ];
    downloadCsv("children_export.csv", rows);
  };

  const exportMarketingEmails = () => {
    const rows = [
      ["email", "name", "subscriptionTier", "childrenCount"],
      ...parents.map((parent) => [
        parent.email,
        parent.name,
        parent.subscriptionTier,
        String(parent.childrenCount),
      ]),
    ];
    downloadCsv("marketing_emails.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Reports & Financials</h2>
          <p className="text-slate-400 mt-1">Live insights from your registered families</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <p className="text-slate-400 mb-2">Total Parents</p>
          <p className="text-3xl font-bold text-white">{stats.totalParents}</p>
          <p className="text-slate-500 text-sm mt-2">+{signupsLast7} last 7 days</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <p className="text-slate-400 mb-2">Total Children</p>
          <p className="text-3xl font-bold text-white">{stats.totalChildren}</p>
          <p className="text-slate-500 text-sm mt-2">Avg {avgChildren} per parent</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <p className="text-slate-400 mb-2">Premium Parents</p>
          <p className="text-3xl font-bold text-emerald-300">{premiumCount}</p>
          <p className="text-slate-500 text-sm mt-2">{freeCount} free plans</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <p className="text-slate-400 mb-2">Estimated MRR</p>
          {role === "superadmin" ? (
            <>
              <p className="text-3xl font-bold text-amber-300">
                {estimatedMRR > 0 ? `$${estimatedMRR.toFixed(2)}` : "Set pricing in Subscriptions"}
              </p>
              <p className="text-slate-500 text-sm mt-2">+{signupsLast30} signups last 30 days</p>
            </>
          ) : (
            <p className="text-slate-500 text-sm mt-2">Financials are visible to super admins only.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Financials Snapshot</h3>
          {role === "superadmin" ? (
            <div className="space-y-2 text-slate-300 text-sm">
              <div className="flex justify-between"><span>Total Points Earned</span><span className="text-white">{stats.totalPointsEarned}</span></div>
              <div className="flex justify-between"><span>Premium Conversion</span><span className="text-white">{parents.length === 0 ? "0%" : `${Math.round((premiumCount / parents.length) * 100)}%`}</span></div>
              <div className="flex justify-between"><span>Paid Pro</span><span className="text-white">{proCount}</span></div>
              <div className="flex justify-between"><span>Paid Forge</span><span className="text-white">{forgeCount}</span></div>
              <div className="flex justify-between"><span>Money earned (30d)</span><span className="text-white">${moneyLast30.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Money earned (6m)</span><span className="text-white">${moneyLast6Months.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Money earned (1y)</span><span className="text-white">${moneyLast12Months.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>New Parents (7d)</span><span className="text-white">{signupsLast7}</span></div>
              <div className="flex justify-between"><span>New Parents (30d)</span><span className="text-white">{signupsLast30}</span></div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Financials are visible to super admins only.</p>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={exportParents}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white hover:bg-slate-800"
            >
              Export Parents CSV
            </button>
            <button
              onClick={exportChildren}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white hover:bg-slate-800"
            >
              Export Children CSV
            </button>
            <button
              onClick={exportMarketingEmails}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white hover:bg-slate-800"
            >
              Export Marketing Emails
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-3">Exports use live Supabase data.</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Financial Year Downloads (Apr - Mar)</h3>
        {role === "superadmin" ? (
          <div className="space-y-3">
            {financialYears.map((year) => (
              <div key={year.label} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                <div>
                  <p className="text-white font-medium">{year.label}</p>
                  <p className="text-slate-500 text-xs">
                    {year.start.toLocaleDateString()} - {year.end.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => downloadFinancialYear(year.label, year.start, year.end)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  Download CSV
                </button>
              </div>
            ))}
            <p className="text-slate-500 text-xs">Financial years are auto-saved and ready for export.</p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Financial year exports are visible to super admins only.</p>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Top Children by Points</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="pb-3 text-slate-400 font-medium">Child</th>
                <th className="pb-3 text-slate-400 font-medium">Parent</th>
                <th className="pb-3 text-slate-400 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {children
                .slice()
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((child) => (
                  <tr key={child.id} className="border-b border-slate-700/50">
                    <td className="py-4 text-white">{child.name}</td>
                    <td className="py-4 text-slate-300">{child.parentName}</td>
                    <td className="py-4 text-amber-400 font-semibold">{child.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminAccessPage({
  role,
  adminUsers,
  onUpdate,
}: {
  role: AdminRole;
  adminUsers: AdminUser[];
  onUpdate: (users: AdminUser[]) => void;
}) {
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    if (role !== "superadmin") {
      setError("Only super admins can add or edit admins.");
      return;
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (SUPER_ADMIN_EMAILS.includes(normalized)) {
      setError("This email is already a super admin.");
      return;
    }
    const exists = adminUsers.find((admin) => admin.email === normalized);
    if (exists) {
      setError("This admin already exists.");
      return;
    }
    hashText(password).then(async (passwordHash) => {
      const nextAdmin: AdminUser = {
        email: normalized,
        role: newRole,
        createdAt: new Date().toISOString(),
        passwordHash,
      };

      onUpdate([
        ...adminUsers,
        nextAdmin,
      ]);

      if (isSupabaseConfigured()) {
        await supabase
          .from("admin_users")
          .upsert({
            email: normalized,
            role: newRole,
            password_hash: passwordHash,
            updated_at: new Date().toISOString(),
          });
      }

      setEmail("");
      setNewRole("admin");
      setPassword("");
      setConfirmPassword("");
    });
  };

  const handleRoleChange = (targetEmail: string, nextRole: AdminRole) => {
    if (role !== "superadmin") return;
    const updated = adminUsers.map((admin) =>
      admin.email === targetEmail ? { ...admin, role: nextRole } : admin
    );
    onUpdate(updated);
    if (isSupabaseConfigured()) {
      supabase
        .from("admin_users")
        .update({ role: nextRole, updated_at: new Date().toISOString() })
        .eq("email", targetEmail);
    }
  };

  const handleRemove = (targetEmail: string) => {
    if (role !== "superadmin") return;
    onUpdate(adminUsers.filter((admin) => admin.email !== targetEmail));
    if (isSupabaseConfigured()) {
      supabase.from("admin_users").delete().eq("email", targetEmail);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Admin Access</h2>
        <p className="text-slate-400 mt-1">Super admins can create and manage other admins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create Admin</h3>
          <div className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@familyforge.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
              disabled={role !== "superadmin"}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set admin password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
              disabled={role !== "superadmin"}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
              disabled={role !== "superadmin"}
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
              disabled={role !== "superadmin"}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={role !== "superadmin"}
              className="w-full rounded-xl bg-violet-500 py-3 text-white font-semibold disabled:opacity-60"
            >
              Add Admin
            </button>
            {error ? <p className="text-red-400 text-sm">{error}</p> : null}
            {role !== "superadmin" && (
              <p className="text-slate-500 text-sm">Only super admins can manage access.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Current Admins</h3>
          <div className="space-y-3">
            {adminUsers.length === 0 ? (
              <p className="text-slate-500 text-sm">No extra admins yet.</p>
            ) : (
              adminUsers.map((admin) => (
                <div key={admin.email} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{admin.email}</p>
                    <p className="text-slate-500 text-xs">{admin.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={admin.role}
                      onChange={(e) => handleRoleChange(admin.email, e.target.value as AdminRole)}
                      className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-white"
                      disabled={role !== "superadmin"}
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemove(admin.email)}
                      className="text-xs text-red-300 hover:text-red-200"
                      disabled={role !== "superadmin"}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(loadSupportTickets());
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<SupportTicket["priority"]>("medium");

  useEffect(() => {
    saveSupportTickets(tickets);
  }, [tickets]);

  const addTicket = () => {
    if (!email.trim() || !subject.trim()) return;
    const ticketId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now().toString();
    setTickets([
      {
        id: ticketId,
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        status: "open",
        priority,
        createdAt: new Date().toISOString(),
      },
      ...tickets,
    ]);
    setEmail("");
    setSubject("");
    setPriority("medium");
  };

  const updateStatus = (id: string, status: SupportTicket["status"]) => {
    setTickets(tickets.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Support Tickets</h2>
        <p className="text-slate-400 mt-1">Track and resolve user issues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create Ticket</h3>
          <div className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Issue summary"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SupportTicket["priority"])}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={addTicket}
              className="w-full rounded-xl bg-emerald-500 py-3 text-white font-semibold"
            >
              Add Ticket
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Open Tickets</h3>
          {tickets.length === 0 ? (
            <p className="text-slate-500 text-sm">No tickets yet. Connect to your support table to auto-sync.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{ticket.subject}</p>
                      <p className="text-slate-500 text-xs">{ticket.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${ticket.priority === "high" ? "bg-red-500/20 text-red-300" : ticket.priority === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-slate-500 text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value as SupportTicket["status"])}
                      className="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-white"
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Data Exports Page - Handle user data export requests (GDPR)
function DataExportsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<DataExportRequestType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data for data export requests
  interface DataExportRequestType {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: string;
    processedAt: string | null;
    processedBy: string | null;
    downloadUrl: string | null;
    expiresAt: string | null;
    notes: string | null;
  }

  const mockRequests: DataExportRequestType[] = [
    {
      id: '1',
      userId: 'user-1',
      userName: 'John Smith',
      userEmail: 'john@example.com',
      status: 'pending',
      requestedAt: '2026-02-01T10:30:00Z',
      processedAt: null,
      processedBy: null,
      downloadUrl: null,
      expiresAt: null,
      notes: null,
    },
    {
      id: '2',
      userId: 'user-2',
      userName: 'Sarah Johnson',
      userEmail: 'sarah@example.com',
      status: 'processing',
      requestedAt: '2026-01-30T14:15:00Z',
      processedAt: null,
      processedBy: 'admin',
      downloadUrl: null,
      expiresAt: null,
      notes: null,
    },
    {
      id: '3',
      userId: 'user-3',
      userName: 'Mike Wilson',
      userEmail: 'mike@example.com',
      status: 'completed',
      requestedAt: '2026-01-25T09:00:00Z',
      processedAt: '2026-01-26T11:30:00Z',
      processedBy: 'admin',
      downloadUrl: 'https://storage.example.com/exports/user-3-export.zip',
      expiresAt: '2026-02-02T11:30:00Z',
      notes: null,
    },
  ];

  const [requests, setRequests] = useState<DataExportRequestType[]>(mockRequests);

  const filteredRequests = requests.filter(r => 
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const handleStartProcessing = (request: DataExportRequestType) => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setRequests(prev => prev.map(r => 
        r.id === request.id ? { ...r, status: 'processing' as const, processedBy: 'admin' } : r
      ));
      setIsProcessing(false);
    }, 500);
  };

  const handleGenerateExport = (request: DataExportRequestType) => {
    setIsGenerating(true);
    // Simulate export generation
    setTimeout(() => {
      const downloadUrl = `https://storage.familyforge.app/exports/${request.userId}-export-${Date.now()}.zip`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      setRequests(prev => prev.map(r => 
        r.id === request.id ? { 
          ...r, 
          status: 'completed' as const, 
          processedAt: new Date().toISOString(),
          downloadUrl,
          expiresAt: expiresAt.toISOString()
        } : r
      ));
      setIsGenerating(false);
      setSelectedRequest(null);
    }, 2000);
  };

  const handleMarkFailed = (request: DataExportRequestType, reason: string) => {
    setRequests(prev => prev.map(r => 
      r.id === request.id ? { 
        ...r, 
        status: 'failed' as const, 
        processedAt: new Date().toISOString(),
        notes: reason
      } : r
    ));
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || styles.pending;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Data Export Requests
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-amber-500 text-white text-sm font-semibold rounded-full">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <p className="text-slate-400 mt-1">Manage user data export requests for GDPR compliance</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              statusFilter === status
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="text-left p-4 text-slate-400 font-medium">User</th>
              <th className="text-left p-4 text-slate-400 font-medium">Email</th>
              <th className="text-left p-4 text-slate-400 font-medium">Status</th>
              <th className="text-left p-4 text-slate-400 font-medium">Requested</th>
              <th className="text-left p-4 text-slate-400 font-medium">Processed</th>
              <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No {statusFilter === 'all' ? '' : statusFilter} export requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map(request => (
                <tr key={request.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {request.userName.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{request.userName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{request.userEmail}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">
                    {new Date(request.requestedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4 text-slate-300">
                    {request.processedAt ? new Date(request.processedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleStartProcessing(request)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          Start Processing
                        </button>
                      )}
                      {request.status === 'processing' && (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                        >
                          Generate Export
                        </button>
                      )}
                      {request.status === 'completed' && request.downloadUrl && (
                        <a
                          href={request.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-500 transition-colors"
                        >
                          View Download
                        </a>
                      )}
                      {request.status === 'failed' && (
                        <span className="text-red-400 text-sm">{request.notes || 'Failed'}</span>
                      )}
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        👁️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Export Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">User Name</label>
                  <p className="text-white font-medium">{selectedRequest.userName}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Email</label>
                  <p className="text-white font-medium">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Status</label>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">User ID</label>
                  <p className="text-white font-mono text-sm">{selectedRequest.userId}</p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <label className="text-slate-400 text-sm">Timeline</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-slate-300">Requested: {new Date(selectedRequest.requestedAt).toLocaleString()}</span>
                  </div>
                  {selectedRequest.processedAt && (
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-slate-300">Processed: {new Date(selectedRequest.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedRequest.expiresAt && (
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-slate-300">Expires: {new Date(selectedRequest.expiresAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.downloadUrl && (
                <div className="border-t border-slate-700 pt-4">
                  <label className="text-slate-400 text-sm">Download URL</label>
                  <p className="text-blue-400 font-mono text-sm break-all mt-1">{selectedRequest.downloadUrl}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="border-t border-slate-700 pt-4">
                  <label className="text-slate-400 text-sm">Notes</label>
                  <p className="text-white mt-1">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
              {selectedRequest.status === 'processing' && (
                <>
                  <button
                    onClick={() => handleGenerateExport(selectedRequest)}
                    disabled={isGenerating}
                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Generating...
                      </>
                    ) : (
                      <>
                        📦 Generate & Send Export
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleMarkFailed(selectedRequest, 'Unable to generate export')}
                    className="px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
                  >
                    Mark Failed
                  </button>
                </>
              )}
              {selectedRequest.status === 'completed' && selectedRequest.downloadUrl && (
                <a
                  href={selectedRequest.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors text-center"
                >
                  📥 Download Export File
                </a>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2.5 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
