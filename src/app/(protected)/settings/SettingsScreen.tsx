"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useCompany, useUpdateCompany } from "@/hooks/useDomain";
import { ROLE_LABELS, UserOneRole } from "@/lib/constants/roles";
import type { RootState } from "@/redux/store";

export default function SettingsPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const canEditCompany = auth.role === "SUPER_ADMIN" || auth.role === "MANAGER";
  const { data: company } = useCompany();
  const updateCompany = useUpdateCompany();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "",
        description: company.description || "",
        address: company.address || "",
        phone: company.phone || "",
      });
    }
  }, [company]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-800">
          Account details and company profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-800">Your account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-800">Name</dt>
              <dd className="font-medium text-slate-800">{auth.name}</dd>
            </div>
            <div>
              <dt className="text-slate-800">Email</dt>
              <dd className="font-medium text-slate-800">{auth.email}</dd>
            </div>
            <div>
              <dt className="text-slate-800">Role</dt>
              <dd className="font-medium text-slate-800">
                {auth.role
                  ? ROLE_LABELS[auth.role as UserOneRole] || auth.role
                  : "-"}
              </dd>
            </div>
          </dl>
        </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-800">Company</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canEditCompany) return;
              await updateCompany.mutateAsync(form);
            }}
          >
            <input
              disabled={!canEditCompany}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 w-full rounded-lg border px-3 disabled:bg-slate-50"
              placeholder="Company name"
            />
            <textarea
              disabled={!canEditCompany}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"
              rows={3}
              placeholder="Description"
            />
            <input
              disabled={!canEditCompany}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="h-11 w-full rounded-lg border px-3 disabled:bg-slate-50"
              placeholder="Address"
            />
            <input
              disabled={!canEditCompany}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-11 w-full rounded-lg border px-3 disabled:bg-slate-50"
              placeholder="Phone"
            />
            {canEditCompany && (
              <button
                type="submit"
                disabled={updateCompany.isPending}
                className="h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-medium text-white sm:w-auto"
              >
                Save company
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
