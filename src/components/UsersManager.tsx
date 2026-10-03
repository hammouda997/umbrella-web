"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, UserPlus, Users } from "lucide-react";
import { errorText, useConfirm, useToast } from "@/components/Feedback";
import { Modal } from "@/components/Modal";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  PageHeader,
  SearchInput,
  SegmentedTabs,
  SelectField,
  TableCard,
  TextField,
  tableClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
  type BadgeTone,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { UserRow } from "@/lib/domain";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";
import { SortableTh, useTableSort } from "@/lib/table-sort";
import { useApi, useApiQuery } from "@/lib/use-api";

type UserSortKey = "name" | "phone" | "role" | "isActive";

const USER_SORT = {
  name: (u: UserRow) => u.name,
  phone: (u: UserRow) => u.phone ?? "",
  role: (u: UserRow) => ROLE_LABEL[u.role],
  isActive: (u: UserRow) => (u.isActive ? 1 : 0),
} as const;

const CREATABLE_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "EXPEDITEUR",
  "LIVREUR",
  "CLIENT",
];

const ROLE_TONE: Record<AppRole, BadgeTone> = {
  SUPER_ADMIN: "brand",
  ADMIN: "gold",
  EXPEDITEUR: "info",
  LIVREUR: "success",
  CLIENT: "neutral",
};

type RoleFilter = "ALL" | AppRole;
type FormErrors = Partial<
  Record<"name" | "email" | "password" | "phone", string>
>;

function validateCreate(form: FormData): FormErrors {
  const errors: FormErrors = {};
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const phone = String(form.get("phone") ?? "").trim();
  if (name.length < 2) errors.name = "Nom trop court";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Email invalide";
  if (password.length < 8) errors.password = "8 caractères minimum";
  if (phone && !/^[0-9]{8}$/.test(phone)) errors.phone = "8 chiffres";
  return errors;
}

function validateEdit(form: FormData): FormErrors {
  const errors: FormErrors = {};
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const phone = String(form.get("phone") ?? "").trim();
  if (name.length < 2) errors.name = "Nom trop court";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Email invalide";
  if (password && password.length < 8) errors.password = "8 caractères minimum";
  if (phone && !/^[0-9]{8}$/.test(phone)) errors.phone = "8 chiffres";
  return errors;
}

export function UsersManager({
  allowSuperAdmin = false,
}: {
  allowSuperAdmin?: boolean;
}) {
  const { session } = useAuth();
  const request = useApi();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApiQuery<UserRow[]>("/users");
  const users = useMemo(() => data ?? [], [data]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const roles = allowSuperAdmin
    ? CREATABLE_ROLES
    : CREATABLE_ROLES.filter((r) => r !== "SUPER_ADMIN");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "ALL" || u.role === roleFilter) &&
        (!q || [u.name, u.email, u.phone].join(" ").toLowerCase().includes(q)),
    );
  }, [users, roleFilter, query]);

  const { sorted: visible, sortKey, sortDir, toggleSort } = useTableSort<
    UserRow,
    UserSortKey
  >(filtered, USER_SORT, "name");

  function canEdit(user: UserRow) {
    if (user.role === "SUPER_ADMIN" && !allowSuperAdmin) return false;
    return true;
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nextErrors = validateCreate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const user = await request<UserRow>("/users", "POST", {
        name: String(form.get("name")).trim(),
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
        phone: String(form.get("phone") ?? "").trim() || undefined,
        role: form.get("role"),
      });
      toast.success("Compte créé", `${user.name} · ${ROLE_LABEL[user.role]}`);
      setCreating(false);
      await reload();
    } catch (err) {
      toast.error("Création impossible", errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function onEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const nextErrors = validateEdit(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const password = String(form.get("password") ?? "");
    const payload: Record<string, unknown> = {
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      phone: String(form.get("phone") ?? "").trim() || undefined,
      role: form.get("role"),
    };
    if (password) payload.password = password;

    setSaving(true);
    try {
      const user = await request<UserRow>(
        `/users/${editing.id}`,
        "PATCH",
        payload,
      );
      toast.success("Compte mis à jour", `${user.name} · ${ROLE_LABEL[user.role]}`);
      setEditing(null);
      await reload();
    } catch (err) {
      toast.error("Modification impossible", errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: UserRow) {
    if (user.isActive) {
      const ok = await confirm({
        title: `Désactiver ${user.name} ?`,
        description:
          "Ce compte ne pourra plus se connecter tant qu'il n'est pas réactivé.",
        confirmLabel: "Désactiver",
        tone: "danger",
      });
      if (!ok) return;
    }
    setBusyId(user.id);
    try {
      await request(`/users/${user.id}/active`, "PATCH", {
        isActive: !user.isActive,
      });
      toast.success(
        user.isActive ? "Compte désactivé" : "Compte réactivé",
        user.name,
      );
      await reload();
    } catch (err) {
      toast.error("Action impossible", errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  const countFor = (role: AppRole) => users.filter((u) => u.role === role).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description={`${users.length} compte(s) · ${users.filter((u) => !u.isActive).length} désactivé(s)`}
        actions={
          <Button
            icon={UserPlus}
            onClick={() => {
              setErrors({});
              setCreating(true);
            }}
          >
            Nouvel utilisateur
          </Button>
        }
      />

      {error ? (
        <ErrorBanner message={error} onRetry={() => void reload()} />
      ) : null}

      <TableCard
        toolbar={
          <>
            <SegmentedTabs<RoleFilter>
              label="Filtrer par rôle"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "ALL", label: "Tous", count: users.length },
                ...roles.map((r) => ({
                  value: r,
                  label: ROLE_LABEL[r],
                  count: countFor(r),
                })),
              ]}
            />
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Nom, email, téléphone…"
              className="w-full md:w-64"
            />
          </>
        }
      >
        {loading && users.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-ops-ink/[0.06]"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="Aucun utilisateur"
              description="Aucun compte ne correspond à ce filtre."
            />
          </div>
        ) : (
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <SortableTh
                  label="Utilisateur"
                  column="name"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Téléphone"
                  column="phone"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  className="hidden md:table-cell"
                />
                <SortableTh
                  label="Rôle"
                  column="role"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Statut"
                  column="isActive"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const isSelf = u.id === session?.user.id;
                const editable = canEdit(u);
                return (
                  <tr key={u.id} className={trClass}>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ops-ink">
                            {u.name}
                            {isSelf ? (
                              <span className="ml-1.5 text-xs font-normal text-ops-ink/50">
                                (vous)
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-ops-ink/50">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`${tdClass} hidden text-ops-ink/50 md:table-cell`}
                    >
                      {u.phone || "—"}
                    </td>
                    <td className={tdClass}>
                      <Badge tone={ROLE_TONE[u.role]}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={u.isActive ? "success" : "neutral"} dot>
                        {u.isActive ? "Actif" : "Désactivé"}
                      </Badge>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        {editable ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Pencil}
                            onClick={() => {
                              setErrors({});
                              setEditing(u);
                            }}
                          >
                            Modifier
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant={u.isActive ? "secondary" : "success"}
                          disabled={isSelf || !editable}
                          loading={busyId === u.id}
                          title={
                            isSelf
                              ? "Vous ne pouvez pas désactiver votre propre compte"
                              : !editable
                                ? "Compte hors périmètre"
                                : undefined
                          }
                          onClick={() => void toggleActive(u)}
                        >
                          {u.isActive ? "Désactiver" : "Activer"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nouvel utilisateur"
        description="Le compte peut se connecter immédiatement avec ces identifiants."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Annuler
            </Button>
            <Button type="submit" form="user-create-form" loading={saving}>
              Créer le compte
            </Button>
          </div>
        }
      >
        <form
          id="user-create-form"
          onSubmit={onCreate}
          noValidate
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextField
            name="name"
            label="Nom complet"
            autoComplete="off"
            error={errors.name}
            wrapperClassName="sm:col-span-2"
          />
          <TextField
            name="email"
            type="email"
            label="Email"
            autoComplete="off"
            error={errors.email}
          />
          <TextField
            name="phone"
            label="Téléphone"
            inputMode="numeric"
            placeholder="8 chiffres"
            error={errors.phone}
          />
          <TextField
            name="password"
            type="password"
            label="Mot de passe"
            autoComplete="new-password"
            hint="8 caractères minimum"
            error={errors.password}
          />
          <SelectField name="role" label="Rôle" defaultValue="EXPEDITEUR">
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </SelectField>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Modifier le compte"
        description={
          editing
            ? `${editing.name} · ${ROLE_LABEL[editing.role]}`
            : undefined
        }
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button type="submit" form="user-edit-form" loading={saving}>
              Enregistrer
            </Button>
          </div>
        }
      >
        {editing ? (
          <form
            id="user-edit-form"
            key={editing.id}
            onSubmit={onEdit}
            noValidate
            className="grid gap-4 sm:grid-cols-2"
          >
            <TextField
              name="name"
              label="Nom complet"
              defaultValue={editing.name}
              autoComplete="off"
              error={errors.name}
              wrapperClassName="sm:col-span-2"
            />
            <TextField
              name="email"
              type="email"
              label="Email"
              defaultValue={editing.email}
              autoComplete="off"
              error={errors.email}
            />
            <TextField
              name="phone"
              label="Téléphone"
              inputMode="numeric"
              placeholder="8 chiffres"
              defaultValue={editing.phone ?? ""}
              error={errors.phone}
            />
            <SelectField
              name="role"
              label="Rôle"
              defaultValue={editing.role}
              disabled={editing.id === session?.user.id}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </SelectField>
            <TextField
              name="password"
              type="password"
              label="Nouveau mot de passe"
              autoComplete="new-password"
              hint="Laisser vide pour ne pas changer"
              error={errors.password}
              wrapperClassName="sm:col-span-2"
            />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
