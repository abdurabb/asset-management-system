"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";

import type { AppDispatch, RootState } from "@/redux/store";
import { logout } from "@/redux/slice/authSlice";
import { toggleMobileSidebar } from "@/redux/slice/layoutSlice";
import { ROLE_LABELS, UserOneRole } from "@/lib/constants/roles";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const collapsed = useSelector(
    (state: RootState) => state.layout.sidebarCollapsed,
  );
  const mobileOpen = useSelector(
    (state: RootState) => state.layout.mobileSidebarOpen,
  );
  const auth = useSelector((state: RootState) => state.auth);

  const initials =
    auth.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleLogout = () => {
    void fetch("/api/auth/logout", { method: "POST" });
    dispatch(logout());
    router.replace("/");
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-30 h-16 border-b border-slate-200 bg-white transition-[left] duration-300 ${
        collapsed ? "lg:left-[76px]" : "lg:left-64"
      }`}
    >
      <div className="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <button
          type="button"
          onClick={() => dispatch(toggleMobileSidebar())}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-800 transition hover:bg-slate-100 lg:hidden"
          aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((previous) => !previous)}
              className="flex h-10 items-center gap-2 rounded-lg px-1.5 transition hover:bg-slate-50"
              aria-expanded={profileOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {initials}
              </div>

              <div className="hidden text-left md:block">
                <p className="max-w-32 truncate text-xs font-semibold text-slate-800">
                  {auth.name || "User"}
                </p>
                <p className="text-[11px] text-slate-800">
                  {auth.role
                    ? ROLE_LABELS[auth.role as UserOneRole] || auth.role
                    : ""}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-slate-800 transition-transform md:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {auth.name || "User"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-800">
                    {auth.email}
                  </p>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-800 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <User size={17} className="text-slate-800" />
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-800 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings size={17} className="text-slate-800" />
                    Account settings
                  </button>
                </div>

                <div className="border-t border-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
