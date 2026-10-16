"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  Tags,
  ClipboardList,
  Wrench,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import type { RootState, AppDispatch } from "@/redux/store";
import {
  setMobileSidebarOpen,
  toggleSidebar,
} from "@/redux/slice/layoutSlice";
import { useCompany } from "@/hooks/useDomain";
import { ROLE_LABELS, UserOneRole } from "@/lib/constants/roles";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: UserOneRole[];
};

const menuItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
  },
  {
    label: "Assets",
    href: "/assets",
    icon: Package,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
  },
  {
    label: "Assignments",
    href: "/assignments",
    icon: ClipboardList,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN"],
  },
  {
    label: "Offices",
    href: "/offices",
    icon: Building2,
    roles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    label: "Categories",
    href: "/categories",
    icon: Tags,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN"],
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN", "MANAGER"],
  },
];

const bottomItems: NavItem[] = [
  // {
  //   label: "Documents",
  //   href: "/documents",
  //   icon: FileText,
  //   roles: ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
  // },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
  },
];

function isCompactScreen() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

export default function Sidebar({ initialRole = null }: { initialRole?: string | null }) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const collapsed = useSelector(
    (state: RootState) => state.layout.sidebarCollapsed,
  );
  const mobileOpen = useSelector(
    (state: RootState) => state.layout.mobileSidebarOpen,
  );
  const reduxRole = useSelector((state: RootState) => state.auth.role) as UserOneRole | null;
  const role = (reduxRole || initialRole) as UserOneRole | null;
  const { data: company } = useCompany();

  const closeMobile = () => {
    if (isCompactScreen()) dispatch(setMobileSidebarOpen(false));
  };

  useEffect(() => {
    dispatch(setMobileSidebarOpen(false));
  }, [pathname, dispatch]);

  useEffect(() => {
    if (!mobileOpen || !isCompactScreen()) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(setMobileSidebarOpen(false));
    };

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [mobileOpen, dispatch]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (media.matches) dispatch(setMobileSidebarOpen(false));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [dispatch]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const visibleMenu = menuItems.filter(
    (item) => role && item.roles.includes(role),
  );
  const visibleBottom = bottomItems.filter(
    (item) => role && item.roles.includes(role),
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={() => dispatch(setMobileSidebarOpen(false))}
        className={`fixed inset-x-0 bottom-0 top-16 z-40 bg-slate-900/40 transition lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-slate-200 bg-white transition-all duration-300 top-16 h-[calc(100dvh-4rem)] max-lg:-translate-x-full ${
          mobileOpen ? "max-lg:translate-x-0" : ""
        } lg:top-0 lg:z-40 lg:h-dvh lg:translate-x-0 ${
          collapsed ? "lg:w-[76px]" : "lg:w-64"
        }`}
      >
      <div className="relative flex h-16 items-center border-b border-slate-200 px-4">
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className={`flex min-w-0 flex-1 items-center gap-3 ${
            collapsed ? "lg:justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Package size={20} />
          </div>

          <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="truncate text-sm font-bold text-slate-900">
              AssetFlow
            </p>
            <p className="truncate text-xs font-medium text-slate-800">
              Asset Management
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p
          className={`mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-800 ${
            collapsed ? "lg:hidden" : ""
          }`}
        >
          Workspace
        </p>

        <div className="space-y-1">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={closeMobile}
                className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-800"
                    : "text-slate-900 hover:bg-slate-100"
                } ${collapsed ? "lg:justify-center" : ""}`}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? "text-blue-800" : "text-slate-800"}
                />
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-5 border-t border-slate-200" />

        <p
          className={`mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-800 ${
            collapsed ? "lg:hidden" : ""
          }`}
        >
          System
        </p>

        <div className="space-y-1">
          {visibleBottom.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={closeMobile}
                className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-800"
                    : "text-slate-900 hover:bg-slate-100"
                } ${collapsed ? "lg:justify-center" : ""}`}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? "text-blue-800" : "text-slate-800"}
                />
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={`border-t border-slate-200 p-3 ${collapsed ? "lg:hidden" : ""}`}>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {company?.name || "Company"}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <p className="text-xs font-medium text-slate-800">
                {role ? ROLE_LABELS[role] : "User"}
              </p>
            </div>
          </div>
      </div>

      <button
        type="button"
        onClick={() => dispatch(toggleSidebar())}
        className="absolute -right-3.5 top-5 z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-sm transition hover:bg-slate-100 hover:text-slate-950 lg:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      </aside>
    </>
  );
}
