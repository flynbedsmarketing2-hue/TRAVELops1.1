"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Phone, Plus, Users } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../lib/apiClient";

type Supplier = {
  id: string;
  name: string;
  type: string;
  terms?: string | null;
  slaNotes?: string | null;
  contacts: Array<{ id: string; name: string; email?: string | null; phone?: string | null; role?: string | null }>;
};

export default function SuppliersPage() {
  const { data: suppliers, mutate } = useSWR<Supplier[]>("/api/suppliers", apiFetch);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "hotel",
    terms: "",
    slaNotes: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactRole: "",
  });

  const createSupplier = async () => {
    await apiFetch("/api/suppliers", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        terms: form.terms || undefined,
        slaNotes: form.slaNotes || undefined,
        contacts: form.contactName
          ? [
              {
                name: form.contactName,
                email: form.contactEmail || undefined,
                phone: form.contactPhone || undefined,
                role: form.contactRole || undefined,
              },
            ]
          : undefined,
      }),
    });
    await mutate();
    setOpen(false);
  };

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Suppliers"
          title="Supplier CRM"
          subtitle="Core supplier profiles with contacts and terms."
          actions={
            <>
              <Link href="/suppliers/contracts">
                <Button variant="outline">Contracts</Button>
              </Link>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                New supplier
              </Button>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(suppliers ?? []).map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{supplier.name}</p>
                  <p className="text-xs text-slate-500">{supplier.type}</p>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Terms: {supplier.terms || "-"}</p>
                  <p>SLA: {supplier.slaNotes || "-"}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-primary" />
                    Contacts
                  </div>
                  {supplier.contacts.length ? (
                    supplier.contacts.map((contact) => (
                      <div key={contact.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                        <p className="font-semibold text-slate-800">{contact.name}</p>
                        <p className="text-slate-500">{contact.role || "-"}</p>
                        <p className="flex items-center gap-2 text-slate-500">
                          <Phone className="h-3 w-3" /> {contact.phone || "-"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No contacts.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New supplier">
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="hotel">Hotel</option>
            <option value="transport">Transport</option>
            <option value="airline">Airline</option>
            <option value="dmc">DMC</option>
            <option value="activity">Activity</option>
            <option value="visa">Visa</option>
            <option value="misc">Misc</option>
          </select>
          <input
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
            placeholder="Terms"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.slaNotes}
            onChange={(e) => setForm({ ...form, slaNotes: e.target.value })}
            placeholder="SLA notes"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600">Primary contact</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Contact name"
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                value={form.contactRole}
                onChange={(e) => setForm({ ...form, contactRole: e.target.value })}
                placeholder="Role"
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="Email"
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="Phone"
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={createSupplier}>Create</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </AuthGuard>
  );
}
