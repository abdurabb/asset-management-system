"use client";

import {
  Building2,
  ClipboardList,
  Package,
  Users,
  Wrench,
} from "lucide-react";

import { useDashboard } from "@/hooks/useDomain";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  const cards = [
    {
      label: "Total Assets",
      value: data?.totalAssets ?? 0,
      icon: Package,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Available",
      value: data?.availableAssets ?? 0,
      icon: Package,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Assigned",
      value: data?.assignedAssets ?? 0,
      icon: ClipboardList,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "In Maintenance",
      value: data?.maintenanceAssets ?? 0,
      icon: Wrench,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Users",
      value: data?.totalUsers ?? 0,
      icon: Users,
      tone: "bg-slate-100 text-slate-800",
    },
    {
      label: "Offices",
      value: data?.totalOffices ?? 0,
      icon: Building2,
      tone: "bg-cyan-50 text-cyan-800",
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-800">
          Overview of assets, assignments, and office activity.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-800">Loading dashboard...</p>
      )}

      {isError && (
        <p className="text-sm text-red-600">Failed to load dashboard.</p>
      )}

      <div className="grid gap-4 grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-800">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.tone}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Open maintenance</h2>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {data?.openMaintenance ?? 0}
          </p>
          <p className="mt-1 text-sm text-slate-800">
            Scheduled or in-progress work orders
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Active assignments</h2>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {data?.activeAssignments ?? 0}
          </p>
          <p className="mt-1 text-sm text-slate-800">
            Assets currently checked out to employees
          </p>
        </div>
      </div>
    </div>
  );
}
