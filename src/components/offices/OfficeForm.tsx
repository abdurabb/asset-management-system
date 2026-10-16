"use client";

import { modalFooter, modalOverlay, modalPanel, secondaryButton } from "@/lib/ui";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCreateOffice, useUpdateOffice } from "@/hooks/useOffice";

import type { Office } from "@/types/office";

type OfficeFormProps = {
  office?: Office;
  onClose: () => void;
};

const initialForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  country: "",
  phone: "",
  isActive: true,
};

export default function OfficeForm({ office, onClose }: OfficeFormProps) {
  const isEdit = Boolean(office);

  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (office) {
      setForm({
        name: office.name,
        code: office.code,
        address: office.address ?? "",
        city: office.city ?? "",
        country: office.country ?? "",
        phone: office.phone ?? "",
        isActive: office.isActive,
      });
    } else {
      setForm(initialForm);
    }
  }, [office]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEdit && office) {
        await updateOffice.mutateAsync({
          id: office.id,
          data: form,
        });
      } else {
        await createOffice.mutateAsync(form);
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const isSubmitting = createOffice.isPending || updateOffice.isPending;

  return (
    <div className={modalOverlay}>
      <div className={`${modalPanel} sm:max-w-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Office" : "Create Office"}
            </h2>

            <p className="mt-0.5 text-sm text-slate-800">
              {isEdit
                ? "Update office information."
                : "Add a new office location."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 transition hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                Office Name
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Abu Dhabi Office"
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Code */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                Office Code
              </label>

              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="AUH"
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                Phone
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+971..."
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* City */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                City
              </label>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Abu Dhabi"
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Country */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                Country
              </label>

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="United Arab Emirates"
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    address: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Office address"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Status */}
            {isEdit && (
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Active office
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={secondaryButton}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Office"
                  : "Create Office"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
