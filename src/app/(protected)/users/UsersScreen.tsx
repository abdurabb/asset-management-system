"use client";

import { Suspense, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Trash2, X } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import { useCreateUser, useDeleteUser } from "@/hooks/useDomain";
import { useConfirm } from "@/hooks/useConfirm";
import { useOffices } from "@/hooks/useOffice";
import { LIST_PAGE_SIZE, usePagedList } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import { ROLE_LABELS, USER_ROLES, UserOneRole } from "@/lib/constants/roles";
import {
  iconButton,
  modalFooter,
  modalOverlay,
  modalPanel,
  pageWrap,
  primaryButton,
  secondaryButton,
  selectClass,
} from "@/lib/ui";
import type { RootState } from "@/redux/store";
import type { AppUser } from "@/types/user";

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-800">Loading users...</div>}>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const roleFilter = get("role");
  const role = useSelector((state: RootState) => state.auth.role) as UserOneRole;
  const officeId = useSelector((state: RootState) => state.auth.officeId);
  const { data, isLoading } = usePagedList<AppUser>("users", "/users", {
    search: get("search") || undefined,
    role: roleFilter || undefined,
    page,
    limit: LIST_PAGE_SIZE,
  });
  const { data: offices } = useOffices();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const { confirm, dialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as UserOneRole,
    officeId: officeId || "",
    description: "",
  });

  const creatableRoles =
    role === "SUPER_ADMIN"
      ? USER_ROLES
      : role === "MANAGER"
        ? USER_ROLES.filter((item) => item !== "SUPER_ADMIN")
        : (["ADMIN", "USER"] as UserOneRole[]);

  const users = data?.items ?? [];

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    await createUser.mutateAsync({
      ...form,
      officeId: form.officeId || null,
    });
    setShowForm(false);
  };

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Users"
        description="Global admins, managers, office admins, and employees."
        action={
          <button onClick={() => setShowForm(true)} className={primaryButton}>
            <Plus size={18} />
            Add User
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
        />
        <select
          value={roleFilter}
          onChange={(event) => setFilters({ role: event.target.value })}
          className={selectClass}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {USER_ROLES.map((item) => (
            <option key={item} value={item}>
              {ROLE_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading && <p className="px-5 py-8 text-center text-sm text-slate-800">Loading users...</p>}

        {!isLoading && users.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-800">No users found.</p>
        )}

        {users.length > 0 && (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {users.map((user) => (
                <article key={user.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-700">{user.email}</p>
                    </div>
                    <button
                      onClick={() => deactivate(user)}
                      className={`${iconButton} shrink-0 hover:bg-red-50 hover:text-red-600`}
                      aria-label={`Deactivate ${user.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-800">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-800">
                      {user.office?.name || "Global"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">User</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Office</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-800">{user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-800">
                        {ROLE_LABELS[user.role] || user.role}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-800">
                        {user.office?.name || "Global"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => deactivate(user)}
                          className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
                          aria-label={`Deactivate ${user.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Pagination
          pagination={data?.pagination}
          onPage={(next) => setFilters({ page: next <= 1 ? null : next })}
        />
      </div>

      {showForm && (
        <div className={modalOverlay}>
          <div className={`${modalPanel} sm:max-w-lg`}>
            <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold">Create User</h2>
              <button onClick={() => setShowForm(false)} className={iconButton} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-4 sm:p-6">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="h-11 w-full rounded-lg border px-3"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="h-11 w-full rounded-lg border px-3"
              />
              <input
                required
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="h-11 w-full rounded-lg border px-3"
              />
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as UserOneRole })
                }
                className={selectClass}
                aria-label="Role"
              >
                {creatableRoles.map((item) => (
                  <option key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </option>
                ))}
              </select>
              {(form.role === "ADMIN" || form.role === "USER") && (
                <select
                  required
                  value={form.officeId}
                  onChange={(event) => setForm({ ...form, officeId: event.target.value })}
                  className={selectClass}
                  aria-label="Office"
                >
                  <option value="">Select office</option>
                  {offices?.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              )}
              <div className={modalFooter}>
                <button type="button" onClick={() => setShowForm(false)} className={secondaryButton}>
                  Cancel
                </button>
                <button type="submit" disabled={createUser.isPending} className={primaryButton}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );

  function deactivate(user: AppUser) {
    void confirm({
      title: "Deactivate this user?",
      description: `${user.name} will be marked inactive and will not be able to sign in.`,
      confirmLabel: "Deactivate user",
      action: () => deleteUser.mutateAsync(user.id),
    });
  }
}
