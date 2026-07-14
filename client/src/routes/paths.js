export const ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  ANALYTICS: "/analytics",
  TRANSACTIONS: "/transactions",
  BUDGET: "/budget",
  INSIGHTS: "/insights",
  CHAT: "/chat",
  REPORTS: "/reports",
  PROFILE: "/profile",
};

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.SIGNUP];

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.ANALYTICS,
  ROUTES.TRANSACTIONS,
  ROUTES.BUDGET,
  ROUTES.INSIGHTS,
  ROUTES.CHAT,
  ROUTES.REPORTS,
  ROUTES.PROFILE,
];
