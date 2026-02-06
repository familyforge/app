// Admin Dashboard App - Pro Parenting
import { useEffect, useState } from "react";
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { EmailSystemEnhanced } from "./lib/email";
import {
  OverviewDashboardPage,
  UserManagementPage,
  OnboardingAnalyticsPage,
  SubscriptionAnalyticsPage,
  AppHealthPage,
  EngagementAnalyticsPage,
} from "./lib/pages";
import { AuditLogPage, DataExportTool } from "./lib/workflows";
import {
  LayoutDashboard,
  Users,
  UserRound,
  CheckSquare,
  Gift,
  BookOpen,
  MessageCircle,
  Wallet,
  BarChart3,
  Sparkles,
  LifeBuoy,
  Download,
  ShieldCheck,
  Zap,
  Star,
  Plus,
  Mail,
  Clock,
  Send,
  Check,
  Eye,
  Copy,
  X,
  Activity,
  Target,
  Smartphone,
  TrendingUp,
  History,
} from "lucide-react";

// Logo (using Unsplash family forge brand image)
const logo = "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=128&h=128&fit=crop";

// Types
type Parent = {
  id: string;
  name: string;
  email: string;
  subscriptionTier: string | null;
  planCode: string;
  childrenCount: number;
  createdAt: string;
};

type Child = {
  id: string;
  parentId: string;
  parentName: string;
  name: string;
  age: number;
  points: number;
  tasksCompleted: number;
  createdAt: string;
};

type Task = {
  id: string;
  title: string;
  category: string;
  points: number;
  assignedTo: string;
  status: "pending" | "completed";
};

type Reward = {
  id: string;
  title: string;
  pointsCost: number;
  timesRedeemed: number;
};

type Testimonial = {
  id: string;
  name: string;
  text: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
};

type Stats = {
  totalParents: number;
  totalChildren: number;
  totalTasksCompleted: number;
  totalPointsEarned: number;
  totalRewardsRedeemed: number;
};

type AdminStoreState = {
  parents: Parent[];
  children: Child[];
  tasks: Task[];
  rewards: Reward[];
  testimonials: Testimonial[];
  stats: Stats;
  setParents: (parents: Parent[]) => void;
  setChildren: (children: Child[]) => void;
  setStats: (stats: Stats) => void;
  addTestimonial: (testimonial: Omit<Testimonial, "id" | "createdAt">) => void;
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;
  toggleTestimonialActive: (id: string) => void;
};

const useAdminStore = create<AdminStoreState>((set) => ({
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
  | "analytics-overview"
  | "users"
  | "onboarding"
  | "subscriptions-analytics"
  | "app-health"
  | "engagement"
  | "audit-log"
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
  | "admin-access"
  | "email-system-pro";

type AdminRole = "superadmin" | "admin";
type AdminUser = {
  id?: string;
  email: string;
  role: AdminRole;
  passwordHash?: string;
  createdAt: string;
  allowedPages?: AdminPage[];
};

const ADMIN_EMAILS_RAW = (import.meta as { env?: Record<string, string> }).env?.VITE_ADMIN_EMAILS
  ?? (import.meta as { env?: Record<string, string> }).env?.VITE_ADMIN_EMAIL
  ?? "";
const ADMIN_EMAILS = ADMIN_EMAILS_RAW.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
const SUPER_ADMIN_EMAILS_RAW = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPER_ADMIN_EMAILS
  ?? ADMIN_EMAILS_RAW
  ?? "";
const SUPER_ADMIN_EMAILS = SUPER_ADMIN_EMAILS_RAW.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
const ADMIN_USERS_KEY = "familyforge_admin_users";
const SUPPORT_TICKETS_KEY = "familyforge_support_tickets";
const APP_SETTINGS_KEY = "familyforge_app_settings";
const LEARNING_BATCHES_KEY = "familyforge_learning_batches";

type AppPlanPrices = {
  free: { monthly: number; yearly: number };
  forge: { monthly: number; yearly: number };
  pro: { monthly: number; yearly: number };
};

type AppPricingConfig = {
  planPrices: AppPlanPrices;
  mostPopularPlanId: "forge" | "pro";
  trialOffer: {
    enabled: boolean;
    label: string;
    firstMonthPrice: number;
    durationDays: number;
    targetPlanId: "forge" | "pro";
  };
};

const DEFAULT_PLAN_PRICES: AppPlanPrices = {
  free: { monthly: 0, yearly: 0 },
  forge: { monthly: 9.99, yearly: 99 },
  pro: { monthly: 19.99, yearly: 199 },
};

const DEFAULT_PRICING_CONFIG: AppPricingConfig = {
  planPrices: DEFAULT_PLAN_PRICES,
  mostPopularPlanId: "forge",
  trialOffer: {
    enabled: true,
    label: "Try Premium",
    firstMonthPrice: 1,
    durationDays: 30,
    targetPlanId: "forge",
  },
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const parsed = parseFloat(String(value));
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizePlanPrices = (raw: unknown): AppPlanPrices => {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    free: {
      monthly: normalizeNumber((obj.free as { monthly?: unknown })?.monthly, DEFAULT_PLAN_PRICES.free.monthly),
      yearly: normalizeNumber((obj.free as { yearly?: unknown })?.yearly, DEFAULT_PLAN_PRICES.free.yearly),
    },
    forge: {
      monthly: normalizeNumber((obj.forge as { monthly?: unknown })?.monthly, DEFAULT_PLAN_PRICES.forge.monthly),
      yearly: normalizeNumber((obj.forge as { yearly?: unknown })?.yearly, DEFAULT_PLAN_PRICES.forge.yearly),
    },
    pro: {
      monthly: normalizeNumber((obj.pro as { monthly?: unknown })?.monthly, DEFAULT_PLAN_PRICES.pro.monthly),
      yearly: normalizeNumber((obj.pro as { yearly?: unknown })?.yearly, DEFAULT_PLAN_PRICES.pro.yearly),
    },
  };
};

const saveAppPricingConfig = (config: AppPricingConfig) => {
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(config));
};

const fetchAppPricingConfig = async (): Promise<AppPricingConfig> => {
  // Try localStorage first
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppPricingConfig;
      if (parsed?.planPrices) return parsed;
    }
  } catch {
    // Continue to fetch from DB
  }

  // Fetch from DB
  if (!isSupabaseConfigured()) return DEFAULT_PRICING_CONFIG;
  const { data } = await supabase
    .from("app_settings")
    .select("plan_prices")
    .eq("key", "subscription_prices")
    .single();
  
  if (!data?.plan_prices) return DEFAULT_PRICING_CONFIG;
  
  const rawConfig = data.plan_prices as Record<string, unknown>;
  const trialOfferRaw = rawConfig?.trialOffer as { enabled?: boolean; label?: string; firstMonthPrice?: unknown; durationDays?: unknown; targetPlanId?: string } | undefined;
  const normalized: AppPricingConfig = {
    planPrices: normalizePlanPrices((rawConfig as { prices?: unknown })?.prices ?? rawConfig),
    mostPopularPlanId: rawConfig?.mostPopularPlanId === "pro" ? "pro" : "forge",
    trialOffer: {
      enabled: Boolean(trialOfferRaw?.enabled),
      label: trialOfferRaw?.label || DEFAULT_PRICING_CONFIG.trialOffer.label,
      firstMonthPrice: normalizeNumber(trialOfferRaw?.firstMonthPrice, DEFAULT_PRICING_CONFIG.trialOffer.firstMonthPrice),
      durationDays: normalizeNumber(trialOfferRaw?.durationDays, DEFAULT_PRICING_CONFIG.trialOffer.durationDays),
      targetPlanId: trialOfferRaw?.targetPlanId === "pro" ? "pro" : "forge",
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
    .select("id, email, role, password_hash, created_at, allowed_pages");
  if (error || !data) {
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    email: row.email,
    role: (row.role === "superadmin" ? "superadmin" : "admin") as AdminRole,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    allowedPages: row.allowed_pages as AdminPage[] | undefined,
  }));
};

type SupabaseUserRef = { id: string; email?: string | null };

const fetchAdminProfile = async (user: SupabaseUserRef): Promise<AdminUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const normalizedEmail = user.email?.toLowerCase() ?? "";
  const emailFilter = normalizedEmail ? `,email.eq.${normalizedEmail}` : "";
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, role, created_at, allowed_pages")
    .or(`id.eq.${user.id}${emailFilter}`)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role === "superadmin" ? "superadmin" : "admin",
    createdAt: data.created_at,
    allowedPages: data.allowed_pages as AdminPage[] | undefined,
  };
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
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (signInError || !data?.user) {
      setLoading(false);
      setError(signInError?.message || "Incorrect email or password.");
      return;
    }

    const adminProfile = await fetchAdminProfile(data.user);
    if (!adminProfile) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Access denied. Admin privileges required.");
      return;
    }

    setLoading(false);
    onSuccess(adminProfile.role, adminProfile.email.toLowerCase());
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
              placeholder="email@example.com"
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
          <p className="text-slate-500 text-xs">
            Use your Supabase Auth email and password.
          </p>

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
    supabase.auth.signOut().finally(() => {
      setAuthenticated(false);
      setRole("admin");
      setCurrentEmail("");
    });
  };

  const baseNavItems: { key: AdminPage; label: string; icon: typeof LayoutDashboard; group: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
    { key: "analytics-overview", label: "Analytics Overview", icon: Activity, group: "Analytics" },
    { key: "users", label: "User Management", icon: Users, group: "Analytics" },
    { key: "onboarding", label: "Onboarding Funnel", icon: Target, group: "Analytics" },
    { key: "subscriptions-analytics", label: "Subscription Intel", icon: TrendingUp, group: "Analytics" },
    { key: "app-health", label: "App Health", icon: Smartphone, group: "Analytics" },
    { key: "engagement", label: "Engagement", icon: Zap, group: "Analytics" },
    { key: "audit-log", label: "Audit Log", icon: History, group: "Analytics" },
    { key: "parents", label: "Parents", icon: Users, group: "People" },
    { key: "children", label: "Children", icon: UserRound, group: "People" },
    { key: "tasks", label: "Tasks", icon: CheckSquare, group: "People" },
    { key: "rewards", label: "Rewards", icon: Gift, group: "People" },
    { key: "learning", label: "Learning Content", icon: BookOpen, group: "Content" },
    { key: "testimonials", label: "Testimonials", icon: MessageCircle, group: "Content" },
    { key: "subscriptions", label: "Subscriptions", icon: Wallet, group: "Business" },
    { key: "reports", label: "Reports", icon: BarChart3, group: "Business" },
    { key: "email-system-pro", label: "Email System Pro", icon: Sparkles, group: "Communications" },
    { key: "support", label: "Support Tickets", icon: LifeBuoy, group: "Operations" },
    { key: "data-exports", label: "Data Exports", icon: Download, group: "Operations" },
  ];

  // Get current admin's allowed pages (for non-super admins)
  const currentAdmin = adminUsers.find((admin) => admin.email === currentEmail.toLowerCase());
  const allowedPages = currentAdmin?.allowedPages;

  const navItems: { key: AdminPage; label: string; icon: typeof LayoutDashboard; group: string }[] = role === "superadmin"
    ? [...baseNavItems, { key: "admin-access", label: "Admin Access", icon: ShieldCheck, group: "Operations" }]
    : allowedPages && allowedPages.length > 0
      ? baseNavItems.filter((item) => allowedPages.includes(item.key))
      : baseNavItems;

  // Group nav items
  const navGroups = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const currentLabel = navItems.find((item) => item.key === currentPage)?.label ?? "Dashboard";
  const adminCount = Array.from(new Set([
    ...SUPER_ADMIN_EMAILS,
    ...adminUsers.map((admin) => admin.email),
  ])).length;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "analytics-overview":
        return <OverviewDashboardPage />;
      case "users":
        return <UserManagementPage />;
      case "onboarding":
        return <OnboardingAnalyticsPage />;
      case "subscriptions-analytics":
        return <SubscriptionAnalyticsPage />;
      case "app-health":
        return <AppHealthPage />;
      case "engagement":
        return <EngagementAnalyticsPage />;
      case "audit-log":
        return <AuditLogPage />;
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
      case "email-system-pro":
        return <EmailSystemEnhanced 
          currentUserEmail={currentEmail} 
          renderTemplates={() => <EmailSystemProPage />}
        />;
      default:
        return <DashboardPage />;
    }
  };

  useEffect(() => {
    let isActive = true;
    const initAuth = async () => {
      const localAdmins = loadAdminUsers();
      setAdminUsers(localAdmins);

      if (!isSupabaseConfigured()) {
        setAuthChecked(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!isActive) return;

      if (session?.user) {
        const adminProfile = await fetchAdminProfile(session.user);
        if (adminProfile) {
          setAuthenticated(true);
          setRole(adminProfile.role);
          setCurrentEmail(adminProfile.email.toLowerCase());
        } else {
          await supabase.auth.signOut();
          setAuthenticated(false);
          setRole("admin");
          setCurrentEmail("");
        }
      }

      setAuthChecked(true);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) return;
      if (session?.user) {
        const adminProfile = await fetchAdminProfile(session.user);
        if (adminProfile) {
          setAuthenticated(true);
          setRole(adminProfile.role);
          setCurrentEmail(adminProfile.email.toLowerCase());
        } else {
          await supabase.auth.signOut();
          setAuthenticated(false);
          setRole("admin");
          setCurrentEmail("");
        }
      } else {
        setAuthenticated(false);
        setRole("admin");
        setCurrentEmail("");
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const hydrateAdmins = async () => {
      if (!authenticated || !isSupabaseConfigured()) return;
      const dbAdmins = await fetchAdminUsersFromDb();
      if (dbAdmins.length === 0) return;
      setAdminUsers((prev) => {
        const merged = [...prev];
        dbAdmins.forEach((dbAdmin) => {
          if (!merged.find((admin) => admin.email === dbAdmin.email)) {
            merged.push(dbAdmin);
          }
        });
        return merged;
      });
    };

    hydrateAdmins();
  }, [authenticated]);

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
      <aside className="w-[260px] bg-slate-900/80 border-r border-slate-800/60 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FamilyForge" className="h-9 w-9 rounded-xl object-cover ring-2 ring-violet-500/20" />
            <div>
              <h1 className="text-[15px] font-semibold text-white tracking-tight">FamilyForge</h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4 scrollbar-thin">
          {Object.entries(navGroups).map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold px-3 mb-1.5">{group}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = currentPage === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setCurrentPage(item.key)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2.5 text-[13px] font-medium ${
                        active
                          ? "bg-violet-500/15 text-white border border-violet-500/30 shadow-sm shadow-violet-500/10"
                          : "text-slate-400 border border-transparent hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                    >
                      <item.icon
                        size={16}
                        className={active ? "text-violet-400" : "text-slate-500"}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-800/60 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-950/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentEmail ? currentEmail.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-xs font-medium truncate">{role === "superadmin" ? "Super Admin" : "Admin"}</p>
                <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-full font-bold ${
                  role === "superadmin" ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-400"
                }`}>
                  {role === "superadmin" ? "SA" : "A"}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] truncate">{currentEmail || "admin@familyforge.com"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/40 px-8 py-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{currentLabel}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 border border-slate-800/60 px-3 py-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${dataLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <p className="text-slate-400 text-xs">{dataLoading ? "Syncing" : "Live"}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 px-3 py-1.5">
                <Users size={12} className="text-slate-500" />
                <span className="text-xs text-white font-medium">{stats.totalParents}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 px-3 py-1.5">
                <UserRound size={12} className="text-slate-500" />
                <span className="text-xs text-white font-medium">{stats.totalChildren}</span>
              </div>
              {role === "superadmin" && (
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 px-3 py-1.5">
                  <ShieldCheck size={12} className="text-slate-500" />
                  <span className="text-xs text-white font-medium">{adminCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <div className="max-w-[1200px] mx-auto">
            {renderPage()}
          </div>
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
  const [planPrices, setPlanPrices] = useState<AppPlanPrices>(DEFAULT_PLAN_PRICES);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAppPricingConfig().then((config) => setPlanPrices(config.planPrices));
  }, []);

  // --- Computed metrics ---
  const now = new Date();
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
  const rangeDays = daysMap[timeRange];
  const rangeStart = new Date(now);
  rangeStart.setDate(now.getDate() - rangeDays);
  const prevRangeStart = new Date(rangeStart);
  prevRangeStart.setDate(rangeStart.getDate() - rangeDays);

  const recentParents = parents.filter((p) => new Date(p.createdAt) >= rangeStart);
  const prevParents = parents.filter((p) => {
    const d = new Date(p.createdAt);
    return d >= prevRangeStart && d < rangeStart;
  });
  const recentChildren = children.filter((c) => new Date(c.createdAt) >= rangeStart);
  const prevChildren = children.filter((c) => {
    const d = new Date(c.createdAt);
    return d >= prevRangeStart && d < rangeStart;
  });

  const premiumCount = parents.filter((p) => p.subscriptionTier === "premium").length;
  const proCount = parents.filter((p) => p.planCode === "pro").length;
  const forgeCount = parents.filter((p) => p.planCode === "forge").length;
  const freeCount = parents.length - premiumCount;
  const conversionRate = parents.length > 0 ? Math.round((premiumCount / parents.length) * 100) : 0;
  const avgChildrenPerParent = parents.length > 0 ? (children.length / parents.length).toFixed(1) : "0";
  const estimatedMRR = planPrices.pro.monthly * proCount + planPrices.forge.monthly * forgeCount;
  const estimatedARR = estimatedMRR * 12;

  const delta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  const parentsDelta = delta(recentParents.length, prevParents.length);
  const childrenDelta = delta(recentChildren.length, prevChildren.length);

  // --- Signup sparkline (last 12 periods) ---
  const sparklineBuckets = 12;
  const bucketSize = Math.max(1, Math.floor(rangeDays / sparklineBuckets));
  const signupSpark = Array.from({ length: sparklineBuckets }, (_, i) => {
    const bStart = new Date(now);
    bStart.setDate(now.getDate() - (sparklineBuckets - i) * bucketSize);
    const bEnd = new Date(now);
    bEnd.setDate(now.getDate() - (sparklineBuckets - i - 1) * bucketSize);
    return parents.filter((p) => {
      const d = new Date(p.createdAt);
      return d >= bStart && d < bEnd;
    }).length;
  });
  const sparkMax = Math.max(...signupSpark, 1);

  // --- Greeting ---
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // --- Registration timeline (last 6 months) ---
  const monthLabels: string[] = [];
  const monthCounts: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(d.toLocaleDateString("en-US", { month: "short" }));
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    monthCounts.push(
      parents.filter((p) => {
        const pd = new Date(p.createdAt);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).length
    );
  }
  const monthMax = Math.max(...monthCounts, 1);

  // --- Subscription distribution ---
  const subSegments = [
    { label: "Free", count: freeCount, color: "bg-slate-500", text: "text-slate-300" },
    { label: "Pro", count: proCount, color: "bg-violet-500", text: "text-violet-300" },
    { label: "Forge", count: forgeCount, color: "bg-amber-500", text: "text-amber-300" },
  ];
  const subTotal = Math.max(parents.length, 1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/20 via-slate-800 to-indigo-600/20 border border-violet-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{greeting} &#128075;</h2>
            <p className="text-slate-400 mt-1 max-w-md">
              {parents.length === 0
                ? "Your dashboard is ready. Data will appear as families join."
                : `${recentParents.length} new families joined in the last ${rangeDays} days. You have ${parents.length} total families.`}
            </p>
          </div>
          {/* Time range toggle */}
          <div className="flex gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-700/60">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === r
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Families */}
        <div className="group relative bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 hover:border-blue-500/40 transition-all">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Users size={18} className="text-blue-400" />
              </div>
              {parentsDelta !== 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  parentsDelta > 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}>
                  {parentsDelta > 0 ? "+" : ""}{parentsDelta}%
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{stats.totalParents.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">Total Families</p>
            {/* Mini sparkline */}
            <div className="flex items-end gap-[2px] h-6 mt-3">
              {signupSpark.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-blue-500/40 min-h-[2px] transition-all"
                  style={{ height: `${Math.max(8, (v / sparkMax) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Total Children */}
        <div className="group relative bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 hover:border-emerald-500/40 transition-all">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <UserRound size={18} className="text-emerald-400" />
              </div>
              {childrenDelta !== 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  childrenDelta > 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}>
                  {childrenDelta > 0 ? "+" : ""}{childrenDelta}%
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{stats.totalChildren.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">Total Children</p>
            <p className="text-slate-500 text-xs mt-3">Avg {avgChildrenPerParent} per family</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="group relative bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 hover:border-violet-500/40 transition-all">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Zap size={18} className="text-violet-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">{premiumCount} paid</span>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{conversionRate}%</p>
            <p className="text-slate-400 text-sm mt-1">Conversion Rate</p>
            {/* Conversion bar */}
            <div className="w-full h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all"
                style={{ width: `${Math.max(2, conversionRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="group relative bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 hover:border-amber-500/40 transition-all">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Wallet size={18} className="text-amber-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">ARR: £{estimatedARR.toFixed(0)}</span>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">
              {estimatedMRR > 0 ? `£${estimatedMRR.toFixed(2)}` : "—"}
            </p>
            <p className="text-slate-400 text-sm mt-1">Monthly Revenue</p>
            <p className="text-slate-500 text-xs mt-3">{proCount} Pro + {forgeCount} Forge</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Timeline */}
        <div className="lg:col-span-2 bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">User Growth</h3>
              <p className="text-slate-500 text-xs mt-0.5">New signups over the last 6 months</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-violet-500" /> Signups
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-44">
            {monthLabels.map((label, i) => {
              const pct = Math.max(4, (monthCounts[i] / monthMax) * 100);
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2 group/bar">
                  <div className="relative w-full flex justify-center">
                    <span className="absolute -top-6 text-xs text-slate-400 font-medium opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {monthCounts[i]}
                    </span>
                  </div>
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all hover:from-violet-500 hover:to-violet-300 cursor-default shadow-lg shadow-violet-500/10"
                    style={{ height: `${pct}%` }}
                  />
                  <span className="text-slate-500 text-xs font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60">
          <h3 className="text-white font-semibold mb-1">Subscriptions</h3>
          <p className="text-slate-500 text-xs mb-6">Plan distribution</p>
          <div className="space-y-4">
            {subSegments.map((seg) => {
              const pct = Math.round((seg.count / subTotal) * 100);
              return (
                <div key={seg.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-medium ${seg.text}`}>{seg.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">{seg.count}</span>
                      <span className="text-slate-500 text-xs">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${seg.color} transition-all duration-500`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-700/60">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Points Earned</span>
              <span className="text-amber-400 font-semibold">{stats.totalPointsEarned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-400">Rewards Redeemed</span>
              <span className="text-pink-400 font-semibold">{stats.totalRewardsRedeemed.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Families + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Families</h3>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-lg">
              +{recentParents.length} this period
            </span>
          </div>
          {parents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <Users size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No families yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {parents
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((parent) => (
                  <div key={parent.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {parent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{parent.name}</p>
                      <p className="text-slate-500 text-xs truncate">{parent.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        parent.subscriptionTier === "premium"
                          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                          : "bg-slate-700/60 text-slate-400"
                      }`}>
                        {parent.planCode || parent.subscriptionTier}
                      </span>
                      <p className="text-slate-500 text-[10px] mt-1">{new Date(parent.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Top Performers</h3>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-lg">
              By points
            </span>
          </div>
          {children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <Star size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No children yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {children
                .slice()
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((child, i) => {
                  const medals = ["bg-gradient-to-br from-amber-400 to-yellow-500", "bg-gradient-to-br from-slate-300 to-slate-400", "bg-gradient-to-br from-amber-600 to-amber-700"];
                  const rankStyle = i < 3 ? medals[i] : "bg-slate-700";
                  return (
                    <div key={child.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
                      <div className={`w-9 h-9 rounded-full ${rankStyle} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{child.name}</p>
                        <p className="text-slate-500 text-xs truncate">{child.parentName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-amber-400 text-sm font-bold">{child.points.toLocaleString()}</p>
                        <p className="text-slate-500 text-[10px]">points</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 text-center">
          <p className="text-2xl font-bold text-white">{stats.totalTasksCompleted.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">Tasks Completed</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 text-center">
          <p className="text-2xl font-bold text-white">{stats.totalPointsEarned.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">Points Earned</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 text-center">
          <p className="text-2xl font-bold text-white">{stats.totalRewardsRedeemed.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">Rewards Redeemed</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 text-center">
          <p className="text-2xl font-bold text-white">{children.length > 0 ? Math.round(stats.totalPointsEarned / children.length) : 0}</p>
          <p className="text-slate-500 text-xs mt-1">Avg Points / Child</p>
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

  const premiumCount = filteredParents.filter(p => p.subscriptionTier === "premium").length;
  const freeCount = filteredParents.length - premiumCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Parents</h2>
          <p className="text-slate-500 text-sm mt-0.5">{parents.length} registered &middot; {premiumCount} premium &middot; {freeCount} free</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/80 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700/60 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 text-sm placeholder-slate-500"
        />
      </div>

      {/* Parents Table */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/60">
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Name</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Email</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Plan</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Children</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Joined</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => (
              <tr key={parent.id} className="border-t border-slate-700/40 hover:bg-slate-700/20 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {parent.name.charAt(0)}
                    </div>
                    <span className="text-white text-sm font-medium">{parent.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-sm">{parent.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    parent.subscriptionTier === "premium"
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                      : "bg-slate-700/60 text-slate-400"
                  }`}>
                    {parent.planCode || parent.subscriptionTier}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-300 text-sm">{parent.childrenCount}</td>
                <td className="px-5 py-3.5 text-slate-500 text-sm">{new Date(parent.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleViewSettings(parent)}
                      className="px-3 py-1.5 bg-violet-500/10 text-violet-300 rounded-lg hover:bg-violet-500/20 transition-colors text-xs font-medium border border-violet-500/20"
                    >
                      Settings
                    </button>
                    <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors">Edit</button>
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

  const totalPoints = children.reduce((sum, c) => sum + c.points, 0);
  const avgAge = children.length > 0 ? (children.reduce((sum, c) => sum + c.age, 0) / children.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Children</h2>
          <p className="text-slate-500 text-sm mt-0.5">{children.length} profiles &middot; Avg age {avgAge} &middot; {totalPoints.toLocaleString()} total points</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by child or parent name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/80 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700/60 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm placeholder-slate-500"
        />
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChildren.map((child) => (
          <div key={child.id} className="group bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600/60 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-emerald-500/10">
                {child.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{child.name}</h3>
                <p className="text-slate-500 text-xs">{child.age} years old</p>
              </div>
              <span className="text-amber-400 text-sm font-bold">{child.points.toLocaleString()} pts</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/30">
                <span className="text-slate-500">Parent</span>
                <span className="text-slate-300 font-medium">{child.parentName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/30">
                <span className="text-slate-500">Tasks Done</span>
                <span className="text-emerald-400 font-semibold">{child.tasksCompleted}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Joined</span>
                <span className="text-slate-400">{new Date(child.createdAt).toLocaleDateString()}</span>
              </div>
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
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <p className="text-slate-500 text-sm mt-0.5">{tasks.length} total &middot; {pendingCount} pending &middot; {completedCount} completed</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/80 rounded-xl w-fit border border-slate-700/60">
        {(["all", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/60">
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Task</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Category</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Points</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Assigned To</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Status</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className="border-t border-slate-700/40 hover:bg-slate-700/20 transition-colors">
                <td className="px-5 py-3.5 text-white text-sm font-medium">{task.title}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-1 bg-slate-700/50 rounded-full text-slate-300 text-xs font-medium">
                    {task.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-amber-400 text-sm font-semibold">{task.points}</td>
                <td className="px-5 py-3.5 text-slate-400 text-sm">{task.assignedTo}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    task.status === "completed"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors">Edit</button>
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
  const totalRedeemed = rewards.reduce((sum, r) => sum + r.timesRedeemed, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Rewards</h2>
          <p className="text-slate-500 text-sm mt-0.5">{rewards.length} available &middot; {totalRedeemed} total redemptions</p>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="group bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/60 transition-all">
            <div className="h-24 bg-gradient-to-br from-violet-500/15 to-pink-500/15 flex items-center justify-center border-b border-slate-700/30">
              <Gift size={28} className="text-pink-400/60" />
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold text-sm">{reward.title}</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cost</span>
                  <span className="text-amber-400 font-bold">{reward.pointsCost} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Redeemed</span>
                  <span className="text-emerald-400 font-semibold">{reward.timesRedeemed}x</span>
                </div>
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
          <p className="text-slate-500 text-sm mt-0.5">Manage testimonials shown on the app's paywall screen</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={14} /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className={`bg-slate-800/60 rounded-2xl p-5 border ${
              t.isActive ? "border-slate-700/50" : "border-slate-700/30 opacity-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <img
                src={t.imageUrl}
                alt={t.name}
                className="w-14 h-14 rounded-full object-cover bg-slate-700 ring-2 ring-slate-700/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=?";
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-white font-semibold text-sm">{t.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      t.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-600/50 text-slate-500"
                    }`}
                  >
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-slate-400 text-sm italic line-clamp-3">"{t.text}"</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(t.id)}
                    className="px-3 py-1 bg-slate-700/60 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleTestimonialActive(t.id)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      t.isActive
                        ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-400"
                        : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400"
                    }`}
                  >
                    {t.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteTestimonial(t.id)}
                    className="px-3 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <div className="col-span-full bg-slate-800/40 rounded-2xl p-12 border border-dashed border-slate-700/50 text-center">
            <MessageCircle size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No testimonials yet. Add one to get started.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700/50 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingId ? "Edit Testimonial" : "Add Testimonial"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 text-xs mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah M."
                  className="w-full px-4 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700/50 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1">Profile Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700/50 focus:border-blue-500 focus:outline-none text-sm"
                />
                {formData.imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-8 h-8 rounded-full object-cover bg-slate-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=?";
                      }}
                    />
                    <span className="text-slate-500 text-xs">Preview</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1">Testimonial Text</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Write a heartfelt testimonial..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700/50 focus:border-blue-500 focus:outline-none resize-none text-sm"
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
                <label htmlFor="isActive" className="text-slate-400 text-sm">
                  Show on app (active)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-700/60 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
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
        <h2 className="text-2xl font-bold text-white">Subscription Pricing</h2>
        <p className="text-slate-500 text-sm mt-0.5">Update pricing used across onboarding and upgrade screens.</p>
      </div>

      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
        {loading ? (
          <p className="text-slate-500 text-sm">Loading pricing…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["free", "pro", "forge"] as const).map((plan) => (
              <div key={plan} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                <p className="text-white font-semibold text-sm capitalize flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${plan === "free" ? "bg-slate-500" : plan === "pro" ? "bg-blue-400" : "bg-violet-400"}`} />
                  {plan} plan
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wider">Monthly (GBP)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={config.planPrices[plan].monthly}
                      onChange={(e) => updatePrice(plan, "monthly", e.target.value)}
                      disabled={role !== "superadmin"}
                      className="mt-1 w-full rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wider">Yearly /mo (GBP)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={config.planPrices[plan].yearly}
                      onChange={(e) => updatePrice(plan, "yearly", e.target.value)}
                      disabled={role !== "superadmin"}
                      className="mt-1 w-full rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Star size={14} className="text-amber-400" />
            Most Popular Plan
          </h3>
          <select
            value={config.mostPopularPlanId}
            onChange={(e) => setConfig((prev) => ({
              ...prev,
              mostPopularPlanId: e.target.value === "pro" ? "pro" : "forge",
            }))}
            disabled={role !== "superadmin"}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-white text-sm"
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
              Enabled
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider">Trial label</label>
              <input
                type="text"
                value={config.trialOffer.label}
                onChange={(e) => setConfig((prev) => ({
                  ...prev,
                  trialOffer: { ...prev.trialOffer, label: e.target.value },
                }))}
                disabled={role !== "superadmin"}
                className="mt-1 w-full rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider">First month (GBP)</label>
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
                  className="mt-1 w-full rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider">Trial days</label>
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
                  className="mt-1 w-full rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider">After trial → plan</label>
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
                className="mt-1 w-full rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-white text-sm"
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
          className="rounded-xl bg-violet-500 hover:bg-violet-600 px-6 py-2.5 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
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
    const rows: string[][] = [
      ["id", "name", "email", "subscriptionTier", "childrenCount", "createdAt"],
      ...parents.map((parent) => [
        parent.id,
        parent.name,
        parent.email,
        parent.subscriptionTier ?? "",
        String(parent.childrenCount),
        parent.createdAt,
      ]),
    ];
    downloadCsv("parents_export.csv", rows);
  };

  const exportChildren = () => {
    const rows: string[][] = [
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
    const rows: string[][] = [
      ["email", "name", "subscriptionTier", "childrenCount"],
      ...parents.map((parent) => [
        parent.email,
        parent.name,
        parent.subscriptionTier ?? "",
        String(parent.childrenCount),
      ]),
    ];
    downloadCsv("marketing_emails.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reports & Financials</h2>
        <p className="text-slate-500 text-sm mt-0.5">Live insights from your registered families</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <Users size={16} className="text-blue-400" />
            <span className="text-emerald-400 text-xs font-semibold">+{signupsLast7} / 7d</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalParents}</p>
          <p className="text-slate-500 text-xs mt-1">Total Parents</p>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <UserRound size={16} className="text-emerald-400" />
            <span className="text-slate-500 text-xs">Avg {avgChildren}/parent</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalChildren}</p>
          <p className="text-slate-500 text-xs mt-1">Total Children</p>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <Zap size={16} className="text-violet-400" />
            <span className="text-slate-500 text-xs">{freeCount} free</span>
          </div>
          <p className="text-2xl font-bold text-violet-300">{premiumCount}</p>
          <p className="text-slate-500 text-xs mt-1">Premium Parents</p>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <Wallet size={16} className="text-amber-400" />
            <span className="text-slate-500 text-xs">+{signupsLast30} / 30d</span>
          </div>
          {role === "superadmin" ? (
            <p className="text-2xl font-bold text-amber-300">
              {estimatedMRR > 0 ? `$${estimatedMRR.toFixed(2)}` : "—"}
            </p>
          ) : (
            <p className="text-sm text-slate-500">Super admin only</p>
          )}
          <p className="text-slate-500 text-xs mt-1">Estimated MRR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-emerald-400" />
            Financials Snapshot
          </h3>
          {role === "superadmin" ? (
            <div className="space-y-2.5">
              {[
                { label: "Total Points Earned", value: stats.totalPointsEarned.toLocaleString(), color: "text-white" },
                { label: "Premium Conversion", value: parents.length === 0 ? "0%" : `${Math.round((premiumCount / parents.length) * 100)}%`, color: "text-emerald-400" },
                { label: "Paid Pro", value: proCount, color: "text-white" },
                { label: "Paid Forge", value: forgeCount, color: "text-white" },
                { label: "Revenue (30d)", value: `$${moneyLast30.toFixed(2)}`, color: "text-amber-300" },
                { label: "Revenue (6m)", value: `$${moneyLast6Months.toFixed(2)}`, color: "text-amber-300" },
                { label: "Revenue (1y)", value: `$${moneyLast12Months.toFixed(2)}`, color: "text-amber-300" },
                { label: "New Parents (7d)", value: signupsLast7, color: "text-white" },
                { label: "New Parents (30d)", value: signupsLast30, color: "text-white" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-700/30 last:border-0">
                  <span className="text-slate-400 text-xs">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Financials are visible to super admins only.</p>
          )}
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Download size={14} className="text-blue-400" />
            Export Data
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { label: "Export Parents CSV", desc: `${parents.length} records`, action: exportParents },
              { label: "Export Children CSV", desc: `${children.length} records`, action: exportChildren },
              { label: "Export Marketing Emails", desc: "All parent emails", action: exportMarketingEmails },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className="w-full flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-sm text-white hover:bg-slate-700/40 transition-colors"
              >
                <div className="text-left">
                  <p className="font-medium">{btn.label}</p>
                  <p className="text-slate-500 text-xs">{btn.desc}</p>
                </div>
                <Download size={14} className="text-slate-500" />
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-[11px] mt-3">Live Supabase data. Downloads instantly.</p>
        </div>
      </div>

      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Wallet size={14} className="text-amber-400" />
          Financial Year Downloads
          <span className="text-slate-500 text-[11px] font-normal ml-1">(Apr – Mar)</span>
        </h3>
        {role === "superadmin" ? (
          <div className="space-y-2">
            {financialYears.map((year) => (
              <div key={year.label} className="flex items-center justify-between rounded-xl border border-slate-700/30 bg-slate-900/40 px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{year.label}</p>
                  <p className="text-slate-500 text-[11px]">
                    {year.start.toLocaleDateString()} – {year.end.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => downloadFinancialYear(year.label, year.start, year.end)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-white text-xs font-medium transition-colors"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Financial year exports are visible to super admins only.</p>
        )}
      </div>

      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Star size={14} className="text-amber-400" />
          Top Children by Points
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Child</th>
                <th className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Parent</th>
                <th className="pb-2 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody>
              {children
                .slice()
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((child, i) => (
                  <tr key={child.id} className="border-b border-slate-700/20 last:border-0">
                    <td className="py-3 text-slate-500 text-sm">{i + 1}</td>
                    <td className="py-3 text-white text-sm font-medium">{child.name}</td>
                    <td className="py-3 text-slate-400 text-sm">{child.parentName}</td>
                    <td className="py-3 text-right text-amber-400 text-sm font-bold">{child.points.toLocaleString()}</td>
                  </tr>
                ))}
              {children.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500 text-sm">No children data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ALL_ADMIN_PAGES: { key: AdminPage; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "parents", label: "Parents" },
  { key: "children", label: "Children" },
  { key: "tasks", label: "Tasks" },
  { key: "rewards", label: "Rewards" },
  { key: "learning", label: "Learning Content" },
  { key: "testimonials", label: "Testimonials" },
  { key: "support", label: "Support Tickets" },
  { key: "data-exports", label: "Data Exports" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "reports", label: "Reports" },
];

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
  const [selectedPages, setSelectedPages] = useState<AdminPage[]>([]);
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);

  // Combine all admins: env-based + manually added
  const allAdmins: (AdminUser & { isFromEnv: boolean })[] = [
    // Super admins from env
    ...SUPER_ADMIN_EMAILS.map((email) => {
      const existing = adminUsers.find((a) => a.email === email);
      return {
        email,
        role: "superadmin" as AdminRole,
        createdAt: existing?.createdAt ?? "System",
        allowedPages: existing?.allowedPages,
        isFromEnv: true,
      };
    }),
    // Regular admins from env
    ...ADMIN_EMAILS.filter((email) => !SUPER_ADMIN_EMAILS.includes(email)).map((email) => {
      const existing = adminUsers.find((a) => a.email === email);
      return {
        email,
        role: (existing?.role ?? "admin") as AdminRole,
        createdAt: existing?.createdAt ?? "System",
        allowedPages: existing?.allowedPages,
        isFromEnv: true,
      };
    }),
    // Manually added admins (not in env)
    ...adminUsers
      .filter((a) => !SUPER_ADMIN_EMAILS.includes(a.email) && !ADMIN_EMAILS.includes(a.email))
      .map((a) => ({ ...a, isFromEnv: false })),
  ];

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
        allowedPages: newRole === "superadmin" ? undefined : selectedPages.length > 0 ? selectedPages : undefined,
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
            allowed_pages: newRole === "superadmin" ? null : selectedPages.length > 0 ? selectedPages : null,
            updated_at: new Date().toISOString(),
          });
      }

      setEmail("");
      setNewRole("admin");
      setPassword("");
      setConfirmPassword("");
      setSelectedPages([]);
    });
  };

  const handleRoleChange = (targetEmail: string, nextRole: AdminRole) => {
    if (role !== "superadmin") return;
    const existingAdmin = adminUsers.find((a) => a.email === targetEmail);
    if (existingAdmin) {
      const updated = adminUsers.map((admin) =>
        admin.email === targetEmail ? { ...admin, role: nextRole, allowedPages: nextRole === "superadmin" ? undefined : admin.allowedPages } : admin
      );
      onUpdate(updated);
    } else {
      // Env-based admin not in adminUsers yet - add them
      onUpdate([
        ...adminUsers,
        { email: targetEmail, role: nextRole, createdAt: new Date().toISOString() },
      ]);
    }
    if (isSupabaseConfigured()) {
      supabase
        .from("admin_users")
        .upsert({ email: targetEmail, role: nextRole, updated_at: new Date().toISOString() });
    }
  };

  const handleRemove = (targetEmail: string) => {
    if (role !== "superadmin") return;
    onUpdate(adminUsers.filter((admin) => admin.email !== targetEmail));
    if (isSupabaseConfigured()) {
      supabase.from("admin_users").delete().eq("email", targetEmail);
    }
  };

  const handlePermissionsUpdate = (targetEmail: string, pages: AdminPage[]) => {
    if (role !== "superadmin") return;
    const existingAdmin = adminUsers.find((a) => a.email === targetEmail);
    const adminData = allAdmins.find((a) => a.email === targetEmail);
    if (existingAdmin) {
      const updated = adminUsers.map((admin) =>
        admin.email === targetEmail ? { ...admin, allowedPages: pages.length > 0 ? pages : undefined } : admin
      );
      onUpdate(updated);
    } else if (adminData) {
      // Env-based admin, add to adminUsers with permissions
      onUpdate([
        ...adminUsers,
        { email: targetEmail, role: adminData.role, createdAt: new Date().toISOString(), allowedPages: pages.length > 0 ? pages : undefined },
      ]);
    }
    if (isSupabaseConfigured()) {
      supabase
        .from("admin_users")
        .upsert({ email: targetEmail, allowed_pages: pages.length > 0 ? pages : null, updated_at: new Date().toISOString() });
    }
    setEditingPermissions(null);
  };

  const togglePage = (page: AdminPage, targetArray: AdminPage[], setter: (pages: AdminPage[]) => void) => {
    if (targetArray.includes(page)) {
      setter(targetArray.filter((p) => p !== page));
    } else {
      setter([...targetArray, page]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-violet-400" size={20} />
          Admin Access
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Super admins can create, manage, and control permissions for other admins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4">Create Admin</h3>
          <div className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@familyforge.com"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-white text-sm"
              disabled={role !== "superadmin"}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set admin password"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-white text-sm"
              disabled={role !== "superadmin"}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-white text-sm"
              disabled={role !== "superadmin"}
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-white text-sm"
              disabled={role !== "superadmin"}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            
            {newRole === "admin" && (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-3">Menu Access (leave empty for full access):</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ADMIN_PAGES.map((page) => (
                    <label
                      key={page.key}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedPages.includes(page.key) ? "bg-violet-500/20 border border-violet-500/50" : "hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPages.includes(page.key)}
                        onChange={() => togglePage(page.key, selectedPages, setSelectedPages)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                        disabled={role !== "superadmin"}
                      />
                      <span className="text-white text-sm">{page.label}</span>
                    </label>
                  ))}
                </div>
                {selectedPages.length > 0 && (
                  <p className="text-xs text-violet-400 mt-2">{selectedPages.length} pages selected</p>
                )}
              </div>
            )}
            
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

        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4">Current Admins ({allAdmins.length})</h3>
          <div className="space-y-3">
            {allAdmins.length === 0 ? (
              <p className="text-slate-500 text-sm">No admins configured.</p>
            ) : (
              allAdmins.map((admin) => (
                <div key={admin.email} className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{admin.email}</p>
                        {admin.isFromEnv && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">System</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${admin.role === "superadmin" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"}`}>
                          {admin.role === "superadmin" ? "Super Admin" : "Admin"}
                        </span>
                        {admin.role === "admin" && admin.allowedPages && admin.allowedPages.length > 0 && (
                          <span className="text-xs text-slate-500">{admin.allowedPages.length} pages</span>
                        )}
                        {admin.role === "admin" && (!admin.allowedPages || admin.allowedPages.length === 0) && (
                          <span className="text-xs text-emerald-500">Full access</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!SUPER_ADMIN_EMAILS.includes(admin.email) && (
                        <select
                          value={admin.role}
                          onChange={(e) => handleRoleChange(admin.email, e.target.value as AdminRole)}
                          className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-white"
                          disabled={role !== "superadmin"}
                        >
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      )}
                      {admin.role === "admin" && role === "superadmin" && (
                        <button
                          onClick={() => setEditingPermissions(editingPermissions === admin.email ? null : admin.email)}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                            editingPermissions === admin.email ? "bg-violet-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          Permissions
                        </button>
                      )}
                      {!admin.isFromEnv && (
                        <button
                          onClick={() => handleRemove(admin.email)}
                          className="text-xs text-red-300 hover:text-red-200 px-2 py-1"
                          disabled={role !== "superadmin"}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Permissions Editor Dropdown */}
                  {editingPermissions === admin.email && admin.role === "admin" && (
                    <div className="border-t border-slate-700 p-4 bg-slate-950/50">
                      <p className="text-sm text-slate-400 mb-3">Select which menu items this admin can see:</p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {ALL_ADMIN_PAGES.map((page) => {
                          const currentPages = admin.allowedPages || [];
                          const isSelected = currentPages.includes(page.key);
                          return (
                            <label
                              key={page.key}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? "bg-violet-500/20 border border-violet-500/50" : "hover:bg-slate-800 border border-transparent"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const newPages = isSelected
                                    ? currentPages.filter((p) => p !== page.key)
                                    : [...currentPages, page.key];
                                  // Check if admin exists in adminUsers - if not (env admin), add them
                                  const existingAdmin = adminUsers.find((a) => a.email === admin.email);
                                  if (existingAdmin) {
                                    const updated = adminUsers.map((a) =>
                                      a.email === admin.email ? { ...a, allowedPages: newPages.length > 0 ? newPages : undefined } : a
                                    );
                                    onUpdate(updated);
                                  } else {
                                    // Add env admin to adminUsers with their permissions
                                    onUpdate([
                                      ...adminUsers,
                                      { email: admin.email, role: admin.role, createdAt: new Date().toISOString(), allowedPages: newPages.length > 0 ? newPages : undefined },
                                    ]);
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                              />
                              <span className="text-white text-sm">{page.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const allPages = ALL_ADMIN_PAGES.map((p) => p.key);
                              const existingAdmin = adminUsers.find((a) => a.email === admin.email);
                              if (existingAdmin) {
                                const updated = adminUsers.map((a) =>
                                  a.email === admin.email ? { ...a, allowedPages: allPages } : a
                                );
                                onUpdate(updated);
                              } else {
                                onUpdate([
                                  ...adminUsers,
                                  { email: admin.email, role: admin.role, createdAt: new Date().toISOString(), allowedPages: allPages },
                                ]);
                              }
                            }}
                            className="text-xs px-3 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => {
                              const existingAdmin = adminUsers.find((a) => a.email === admin.email);
                              if (existingAdmin) {
                                const updated = adminUsers.map((a) =>
                                  a.email === admin.email ? { ...a, allowedPages: undefined } : a
                                );
                                onUpdate(updated);
                              } else {
                                onUpdate([
                                  ...adminUsers,
                                  { email: admin.email, role: admin.role, createdAt: new Date().toISOString(), allowedPages: undefined },
                                ]);
                              }
                            }}
                            className="text-xs px-3 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
                          >
                            Clear (Full Access)
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            handlePermissionsUpdate(admin.email, admin.allowedPages || []);
                          }}
                          className="text-xs px-4 py-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 font-medium"
                        >
                          Save & Close
                        </button>
                      </div>
                    </div>
                  )}
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
        <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
        <p className="text-slate-500 text-sm mt-0.5">Track and resolve user issues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4">Create Ticket</h3>
          <div className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@email.com"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-white text-sm"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Issue summary"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-white text-sm"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SupportTicket["priority"])}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-white text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={addTicket}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-white text-sm font-semibold transition-colors"
            >
              Add Ticket
            </button>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4">Open Tickets ({tickets.length})</h3>
          {tickets.length === 0 ? (
            <div className="py-8 text-center">
              <LifeBuoy size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-700/30 bg-slate-900/40 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{ticket.subject}</p>
                      <p className="text-slate-500 text-xs">{ticket.email}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ml-2 whitespace-nowrap ${ticket.priority === "high" ? "bg-red-500/20 text-red-400" : ticket.priority === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-slate-600 text-[11px]">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value as SupportTicket["status"])}
                      className="rounded-lg border border-slate-700/50 bg-slate-950/80 px-2 py-1 text-[11px] text-white"
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
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Data Export Requests
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
              {pendingCount} pending
            </span>
          )}
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Manage user data export requests for GDPR compliance</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              statusFilter === status
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-slate-700/50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="text-left p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Requested</th>
              <th className="text-left p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Processed</th>
              <th className="text-right p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
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
                        <Eye size={14} className="text-slate-500" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Export Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={16} />
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
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate & Send Export
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
                  Download Export File
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

// Email System Pro Page
const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Email', description: 'Sent when a new user signs up', trigger: 'User registration', category: 'Onboarding' },
  { id: 'task_reminder', name: 'Task Reminder', description: 'Sent when tasks are due or overdue', trigger: 'Task due date', category: 'Engagement' },
  { id: 'achievement_alert', name: 'Achievement Alert', description: 'Celebrate when children reach milestones', trigger: 'Task completion / Streak / Rank', category: 'Engagement' },
  { id: 'weekly_report', name: 'Weekly Report', description: 'Summary of family progress every week', trigger: 'Weekly cron (Sundays)', category: 'Reports' },
  { id: 'family_invite', name: 'Family Invitation', description: 'Invite co-parents or guardians', trigger: 'Parent sends invitation', category: 'Onboarding' },
  { id: 'data_export_ready', name: 'Data Export Ready', description: 'GDPR compliance - notify when data export is complete', trigger: 'Admin processes export', category: 'System' },
  { id: 'abandoned_payment_1hr', name: 'Abandoned Payment (1hr)', description: 'Gentle nudge after payment abandonment', trigger: '1 hour after abandonment', category: 'Conversion' },
  { id: 'abandoned_payment_24hr', name: 'Abandoned Payment (24hr)', description: 'Social proof and testimonials', trigger: '24 hours after abandonment', category: 'Conversion' },
  { id: 'abandoned_payment_followup', name: 'Abandoned Payment Follow-up', description: 'Days 2-7 follow-up sequence', trigger: 'Daily (days 2-7)', category: 'Conversion' },
  { id: 'free_plan_weekly', name: 'Free Plan Weekly Nudge', description: 'Shows what Pro features they are missing', trigger: 'Weekly (Mondays)', category: 'Conversion' },
  { id: 'email_verification_code', name: 'Email Verification Code', description: 'Sends a 4-digit verification code during onboarding', trigger: 'After PIN creation', category: 'Onboarding' },
];

const AI_EMAIL_PROMPT = `You are a professional email designer for FamilyForge, a premium parenting app. Create a beautiful, responsive HTML email with these EXACT specifications:

**BRAND IDENTITY:**
- Company: FamilyForge
- Tagline: "Rewards & Growth for Kids"
- Logo URL: https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png
- Logo dimensions: 80x80px, centered

**CRITICAL - FULL-BLEED BACKGROUND (MUST FOLLOW):**
The email background color MUST fill the ENTIRE viewport with NO white space. Use this exact structure:
\`\`\`html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0f0a1f;">
<table width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1f;min-height:100vh;">
<tr><td align="center" valign="top" style="padding:40px 20px;">
  <!-- Your content here, max-width: 600px -->
</td></tr>
</table>
</body>
</html>
\`\`\`
- body AND outer table MUST have the same background-color
- Use min-height:100vh on the table
- Set margin:0 and padding:0 on body
- Never leave the HTML/body background as default white

**DESIGN REQUIREMENTS (MUST FOLLOW EXACTLY):**

1. OVERALL THEME:
   - Background color: #0f0a1f (dark sophisticated theme) - MUST cover entire page
   - Max width: 600px, centered
   - Font family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif

2. LOGO HEADER:
   - Centered logo with glass-morphism effect
   - Logo container: background rgba(139, 92, 246, 0.15), border-radius 24px, padding 20px
   - Subtle glow effect: box-shadow 0 0 40px rgba(139, 92, 246, 0.3)
   - Border: 1px solid rgba(139, 92, 246, 0.3)

3. CONTENT CARDS:
   - Background: linear-gradient(135deg, rgba(30, 20, 50, 0.9), rgba(20, 15, 40, 0.95))
   - Border: 1px solid gradient from #8b5cf6 (purple) to #4f46e5 (deep indigo)
   - Border-radius: 16px
   - Padding: 32px
   - Box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4)

4. NUMBERED STEP CARDS (if applicable):
   - Step 1: Green accent (#10b981), number in circle with green glow
   - Step 2: Purple accent (#8b5cf6), number in circle with purple glow
   - Step 3: Gold accent (#f59e0b), number in circle with gold glow
   - Each step card has subtle gradient background

5. QUOTE/HIGHLIGHT BLOCKS:
   - Left border: 4px solid gradient (#8b5cf6 to #a78bfa)
   - Background: rgba(139, 92, 246, 0.1)
   - Border-radius: 0 12px 12px 0
   - Italic text, light purple color (#a78bfa)

6. CTA BUTTON:
   - Background: linear-gradient(135deg, #8b5cf6, #6366f1, #4f46e5)
   - Text: White, bold, 16px
   - Padding: 16px 40px
   - Border-radius: 12px
   - Box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4)
   - Hover effect hint in alt text

7. TYPOGRAPHY:
   - Headings: White (#ffffff), bold
   - Body text: #cbd5e1 (light slate)
   - Accent text: #a78bfa (light purple)
   - Links: #8b5cf6 (purple)

8. FOOTER:
   - Pill-style links: background rgba(139, 92, 246, 0.2), border-radius 20px, padding 8px 16px
   - Separator: Gradient line from transparent to purple to transparent
   - Copyright text: #64748b (muted slate)
   - Social links as icon buttons if applicable

9. SPACING:
   - Section margins: 24px
   - Inner padding: 20-32px
   - Line height: 1.6 for body text

**EMAIL CONTENT PLACEHOLDERS:**
Use these placeholders that will be replaced dynamically:
- {{parentName}} - Parent's first name
- {{childName}} - Child's name
- {{appUrl}} - https://familyforge.app
- {{unsubscribeUrl}} - Unsubscribe link
- {{currentYear}} - Current year

**OUTPUT FORMAT:**
- Complete HTML document with DOCTYPE, html, head, body tags
- Use inline CSS (email-safe)
- Use tables for layout (email compatibility)
- ALWAYS set background color on body AND outer table (no white space)
- Include both HTML and plain text versions separated by ---PLAIN_TEXT---
- Test with dark mode email clients in mind

---

**EMAIL TO CREATE:**
`;

function EmailSystemProPage() {
  const parents = useAdminStore((s) => s.parents);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sendMode, setSendMode] = useState<'single' | 'all' | 'manual'>('single');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [manualRecipients, setManualRecipients] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptDescription, setPromptDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showNewEmailModal, setShowNewEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState({ name: '', description: '', trigger: '', category: 'Custom' });
  const [customEmails, setCustomEmails] = useState<typeof EMAIL_TEMPLATES>([]);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const allTemplates = [...EMAIL_TEMPLATES, ...customEmails];

  const parseRecipientList = (value: string) =>
    value
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const manualRecipientList = parseRecipientList(manualRecipients);
  const invalidManualRecipients = manualRecipientList.filter((email) => !isValidEmail(email));

  const recipientsForSend =
    sendMode === 'all'
      ? parents.map((parent) => parent.email)
      : sendMode === 'manual'
      ? manualRecipientList
      : selectedRecipients;

  const handleSendEmail = async () => {
    if (!selectedTemplate) return;
    if (recipientsForSend.length === 0) return;
    if (sendMode === 'manual' && invalidManualRecipients.length > 0) return;
    setSendStatus('sending');
    
    try {
      // Build recipients array with email and name
      const recipients = recipientsForSend.map((email) => {
        const parent = parents.find((p) => p.email === email);
        return { email, name: parent?.name || email.split('@')[0] };
      });

      // Build template-specific data with sensible defaults
      const templateDataMap: Record<string, Record<string, unknown>> = {
        welcome: { parentName: recipients[0]?.name || 'there' },
        email_verification_code: { parentName: recipients[0]?.name || 'there', code: '0000' },
        task_reminder: { taskTitle: 'Sample Task', assignedTo: 'Your child', pointsValue: 10 },
        achievement_alert: { childName: 'Your child', achievementTitle: 'Great Job!', achievementDetails: 'Keep up the amazing work!', pointsEarned: 50 },
        weekly_report: { parentName: recipients[0]?.name || 'there', weekStartDate: 'This week', weekEndDate: 'Today', familyStats: { totalTasksCompleted: 0, totalPointsEarned: 0 } },
        family_invite: { inviterName: 'Admin', familyName: 'FamilyForge', inviteRole: 'parent', inviteCode: 'ADMIN', expiresAt: 'N/A' },
        data_export_ready: { downloadUrl: 'https://familyforge.app', expiresAt: 'N/A' },
        abandoned_payment_1hr: { parentName: recipients[0]?.name || 'there', planName: 'Pro', sessionId: 'admin', specialOffer: '' },
        abandoned_payment_24hr: { parentName: recipients[0]?.name || 'there', planName: 'Pro', sessionId: 'admin' },
        abandoned_payment_followup: { parentName: recipients[0]?.name || 'there', dayNumber: 3, sessionId: 'admin' },
        free_plan_weekly: { parentName: recipients[0]?.name || 'there', childName: 'your kids' },
      };

      const data = templateDataMap[selectedTemplate] || { parentName: recipients[0]?.name || 'there' };

      // For each recipient, personalize and send
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          template: selectedTemplate,
          recipients,
          data,
        },
      });

      if (error) {
        console.error('Send email error:', error);
        setSendStatus('error');
        setTimeout(() => setSendStatus('idle'), 3000);
        return;
      }

      console.log('Send email result:', result);
      setSendStatus('success');
      setTimeout(() => {
        setSendStatus('idle');
        setSelectedTemplate(null);
        setSelectedRecipients([]);
        setManualRecipients('');
      }, 2000);
    } catch (err) {
      console.error('Send email unexpected error:', err);
      setSendStatus('error');
      setTimeout(() => setSendStatus('idle'), 3000);
    }
  };

  const handleCopyPrompt = async () => {
    const fullPrompt = AI_EMAIL_PROMPT + promptDescription;
    await navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCustomEmail = () => {
    if (!newEmail.name.trim()) return;
    const id = 'custom_' + Date.now();
    setCustomEmails([...customEmails, { ...newEmail, id }]);
    setNewEmail({ name: '', description: '', trigger: '', category: 'Custom' });
    setShowNewEmailModal(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Onboarding': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Engagement': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Reports': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Conversion': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'System': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'Custom': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Mail className="text-violet-400" size={32} />
            Email System Pro
          </h2>
          <p className="text-slate-400 mt-1">Manage and send production email templates to your users</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPromptModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
          >
            <Sparkles size={18} />
            AI Email Generator
          </button>
          <button
            onClick={() => setShowNewEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
          >
            <Plus size={18} />
            New Email Template
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Mail size={20} className="text-violet-400" />
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{allTemplates.length}</p>
          <p className="text-slate-400 text-sm mt-1">Email Templates</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Users size={20} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Recipients</span>
          </div>
          <p className="text-3xl font-bold text-white">{parents.length}</p>
          <p className="text-slate-400 text-sm mt-1">Available Parents</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Clock size={20} className="text-amber-400" />
            <span className="text-xs text-slate-400">Scheduled</span>
          </div>
          <p className="text-3xl font-bold text-white">3</p>
          <p className="text-slate-400 text-sm mt-1">Cron Jobs Active</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Zap size={20} className="text-blue-400" />
            <span className="text-xs text-slate-400">Triggers</span>
          </div>
          <p className="text-3xl font-bold text-white">{allTemplates.length}</p>
          <p className="text-slate-400 text-sm mt-1">Event Triggers</p>
        </div>
      </div>

      {/* Email Templates Grid */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail size={20} className="text-violet-400" />
          Email Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className={`relative p-5 rounded-xl border transition-all cursor-pointer ${
                selectedTemplate === template.id
                  ? 'bg-violet-500/20 border-violet-500/50 shadow-lg shadow-violet-500/10'
                  : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedTemplate === template.id ? 'bg-violet-500' : 'bg-slate-700'
                  }`}>
                    <Mail size={18} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{template.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                </div>
                {selectedTemplate === template.id && (
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm mb-3">{template.description}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Zap size={12} />
                <span>Trigger: {template.trigger}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Email Panel */}
      {selectedTemplate && (
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl p-6 border border-violet-500/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Send size={20} className="text-violet-400" />
            Send "{allTemplates.find(t => t.id === selectedTemplate)?.name}"
          </h3>
          
          <div className="space-y-4">
            {/* Send Mode Toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => setSendMode('single')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  sendMode === 'single'
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Send to Selected
              </button>
              <button
                onClick={() => setSendMode('all')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  sendMode === 'all'
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Send to All ({parents.length})
              </button>
              <button
                onClick={() => setSendMode('manual')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  sendMode === 'manual'
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Send to Any Emails
              </button>
            </div>

            {/* Recipient Selection */}
            {sendMode === 'single' && (
              <div className="bg-slate-900/60 rounded-xl p-4 max-h-48 overflow-y-auto">
                {parents.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No parents available</p>
                ) : (
                  <div className="space-y-2">
                    {parents.map((parent) => (
                      <label
                        key={parent.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes(parent.email)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecipients([...selectedRecipients, parent.email]);
                            } else {
                              setSelectedRecipients(selectedRecipients.filter(r => r !== parent.email));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm">{parent.name}</p>
                          <p className="text-slate-500 text-xs">{parent.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sendMode === 'manual' && (
              <div className="bg-slate-900/60 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Paste emails separated by commas</label>
                  <textarea
                    value={manualRecipients}
                    onChange={(e) => setManualRecipients(e.target.value)}
                    rows={3}
                    placeholder="alex@email.com, jamie@email.com"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {manualRecipientList.length} recipient{manualRecipientList.length === 1 ? '' : 's'}
                  </span>
                  {invalidManualRecipients.length > 0 && (
                    <span className="text-red-400">
                      {invalidManualRecipients.length} invalid email{invalidManualRecipients.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendEmail}
              disabled={
                sendStatus === 'sending' ||
                recipientsForSend.length === 0 ||
                (sendMode === 'manual' && invalidManualRecipients.length > 0)
              }
              className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                sendStatus === 'success'
                  ? 'bg-emerald-500 text-white'
                  : sendStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {sendStatus === 'sending' && (
                <>
                  <span className="animate-spin">
                    <Clock size={18} />
                  </span>
                  Sending...
                </>
              )}
              {sendStatus === 'success' && (
                <>
                  <Check size={18} />
                  Sent Successfully!
                </>
              )}
              {sendStatus === 'error' && (
                <>
                  <X size={18} />
                  Failed to Send
                </>
              )}
              {sendStatus === 'idle' && (
                <>
                  <Send size={18} />
                  Send Email {recipientsForSend.length > 0 && `(${recipientsForSend.length})`}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* AI Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">AI Email Generator</h3>
                    <p className="text-slate-400 text-sm">Generate beautiful HTML emails with ChatGPT</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Eye size={16} className="text-violet-400" />
                  Design Specifications (Auto-included)
                </h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>&#10003; Centered logo with glass-morphism effect and glow</li>
                  <li>&#10003; Premium purple/indigo gradient borders throughout</li>
                  <li>&#10003; Dark sophisticated theme (#0f0a1f background)</li>
                  <li>&#10003; Beautiful numbered step cards (green, purple, gold accents)</li>
                  <li>&#10003; Elegant quote block with left accent border</li>
                  <li>&#10003; Gradient CTA button with shadow effects</li>
                  <li>&#10003; Premium footer with pill-style links</li>
                </ul>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Describe the email you want to create:
                </label>
                <textarea
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  placeholder="Example: Create an email to welcome new parents to FamilyForge. Include 3 steps to get started: 1) Add your children, 2) Create your first task, 3) Set up rewards. Include an inspiring quote about parenting and a CTA button to open the app."
                  className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-amber-400 text-sm">
                  <strong>How to use:</strong> Click "Copy Full Prompt" below, then paste it into ChatGPT (or any AI). The AI will generate complete HTML email code following FamilyForge's premium design system.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setShowPromptModal(false)}
                className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyPrompt}
                disabled={!promptDescription.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy Full Prompt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Email Template Modal */}
      {showNewEmailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Create New Email Template</h3>
                <button
                  onClick={() => setShowNewEmailModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Template Name</label>
                <input
                  type="text"
                  value={newEmail.name}
                  onChange={(e) => setNewEmail({ ...newEmail, name: e.target.value })}
                  placeholder="e.g., Birthday Reminder"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={newEmail.description}
                  onChange={(e) => setNewEmail({ ...newEmail, description: e.target.value })}
                  placeholder="What is this email for?"
                  className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Trigger Event</label>
                <input
                  type="text"
                  value={newEmail.trigger}
                  onChange={(e) => setNewEmail({ ...newEmail, trigger: e.target.value })}
                  placeholder="e.g., Child's birthday approaching"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <select
                  value={newEmail.category}
                  onChange={(e) => setNewEmail({ ...newEmail, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Custom">Custom</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Reports">Reports</option>
                  <option value="Conversion">Conversion</option>
                  <option value="System">System</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setShowNewEmailModal(false)}
                className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomEmail}
                disabled={!newEmail.name.trim()}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
