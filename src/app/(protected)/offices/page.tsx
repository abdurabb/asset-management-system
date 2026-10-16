"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import OfficeList from "@/components/offices/OfficeList";
import OfficeForm from "@/components/offices/OfficeForm";
import PageHeader from "@/components/ui/PageHeader";
import { pageWrap, primaryButton } from "@/lib/ui";

export default function OfficesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Offices"
        description="Manage company offices and locations."
        action={
          <button
            onClick={() => setShowForm(true)}
            className={primaryButton}
          >
            <Plus size={18} />
            Add Office
          </button>
        }
      />

      {/* List */}
      <OfficeList />

      {/* Create Modal */}
      {showForm && <OfficeForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
