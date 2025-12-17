'use client';

import { useMemo, useState } from "react";
import { KeyRound, Pencil, Trash2, UserRoundPlus, UsersRound } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cn } from "../../components/ui/cn";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { useUserStore } from "../../stores/useUserStore";
import type { User, UserRole } from "../../types";

export default function UsersPage() {
  const { users, currentUser, register, updateUser, deleteUser, resetPassword, seedDemoUsers } = useUserStore();

  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>({
    username: "",
    password: "",
    role: "viewer",
    fullName: "",
  });
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.fullName ?? "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [query, users]);

  const openCreate = () => {
    setEditing(null);
    setForm({ username: "", password: "", role: "viewer", fullName: "" });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: user.password,
      role: user.role,
      fullName: user.fullName ?? "",
    });
    setError(null);
    setShowModal(true);
  };

  const save = () => {
    setError(null);
    if (!form.username.trim()) {
      setError("Username requis");
      return;
    }
    if (!editing && !form.password.trim()) {
      setError("Password requis");
      return;
    }
    if (editing) {
      updateUser(editing.id, {
        username: form.username.trim(),
        fullName: form.fullName?.trim(),
        role: form.role,
        password: form.password.trim() || editing.password,
      });
    } else {
      register({
        username: form.username.trim(),
        fullName: form.fullName?.trim(),
        role: form.role,
        password: form.password.trim(),
      });
    }
    setShowModal(false);
  };

  const doResetPassword = (userId: string) => {
    const next = window.prompt("Nouveau mot de passe :", "password");
    if (!next) return;
    resetPassword(userId, next);
  };

  const doDelete = (user: User) => {
    if (user.id === "seed-admin") {
      window.alert("Impossible de supprimer le compte admin seed.");
      return;
    }
    const ok = window.confirm(`Supprimer l'utilisateur ${user.username} ?`);
    if (!ok) return;
    deleteUser(user.id);
  };

  return (
    <AuthGuard allowRoles={["administrator"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Users"
          title="Gestion des comptes"
          subtitle={
            currentUser
              ? `CRUD mock stocké en localStorage. Connecté : ${currentUser.username}.`
              : "CRUD mock stocké en localStorage."
          }
          actions={
            <>
              <Button variant="outline" onClick={() => seedDemoUsers()}>
                <UsersRound className="h-4 w-4" />
                Seed rôles demo
              </Button>
              <Button onClick={openCreate}>
                <UserRoundPlus className="h-4 w-4" />
                Créer un utilisateur
              </Button>
            </>
          }
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recherche</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par username, nom ou rôle"
              />
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {filtered.length}/{users.length}
            </span>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.username}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-300">{user.fullName || "—"}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                      user.role === "administrator"
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
                    )}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                    Éditer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => doResetPassword(user.id)}>
                    <KeyRound className="h-4 w-4" />
                    Reset pwd
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => doDelete(user)}>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <UserModal
          open={showModal}
          editing={editing}
          form={form}
          setForm={setForm}
          error={error}
          onClose={() => setShowModal(false)}
          onSave={save}
        />
      </div>
    </AuthGuard>
  );
}

function UserModal({
  open,
  editing,
  form,
  setForm,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: User | null;
  form: Omit<User, "id">;
  setForm: (form: Omit<User, "id">) => void;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const roles: UserRole[] = ["administrator", "travel_designer", "sales_agent", "viewer"];

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Éditer un compte" : "Créer un compte"} className="max-w-xl">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>Username</span>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>Nom complet</span>
            <Input value={form.fullName ?? ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>Rôle</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-black/5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>Password</span>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? "(laisser pour conserver)" : "password"}
              autoComplete="off"
            />
          </label>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave}>Enregistrer</Button>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
}

