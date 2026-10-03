"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { errorText, useToast } from "@/components/Feedback";
import { Avatar, Badge, Button, PageHeader, Panel, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABEL } from "@/lib/roles";

type ProfileErrors = Partial<Record<"name" | "email" | "phone", string>>;
type PasswordErrors = Partial<Record<"current" | "next" | "confirm", string>>;

export function SettingsForm({
  description = "Coordonnées de votre compte",
}: {
  description?: string;
}) {
  const { session, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  if (!session) return null;
  const { user } = session;

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const errors: ProfileErrors = {};
    if (name.length < 2) errors.name = "Nom trop court";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Email invalide";
    if (phone && !/^[0-9]{8}$/.test(phone)) errors.phone = "8 chiffres";
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingProfile(true);
    try {
      await updateProfile({ name, email, phone: phone || undefined });
      toast.success("Profil enregistré");
    } catch (err) {
      toast.error("Enregistrement impossible", errorText(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    const confirmValue = String(form.get("confirm") ?? "");
    const errors: PasswordErrors = {};
    if (!current) errors.current = "Requis";
    if (next.length < 8) errors.next = "8 caractères minimum";
    else if (!/[0-9]/.test(next) || !/[A-Za-z]/.test(next)) {
      errors.next = "Mélangez lettres et chiffres";
    }
    if (confirmValue !== next) errors.confirm = "Les mots de passe ne correspondent pas";
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPassword(true);
    try {
      await changePassword(current, next);
      formEl.reset();
      toast.success("Mot de passe modifié", "Utilisez-le à votre prochaine connexion.");
    } catch (err) {
      toast.error("Modification impossible", errorText(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profil & paramètres" description={description} />

      <Panel className="flex flex-wrap items-center gap-4">
        <Avatar name={user.name} className="h-14 w-14 text-base" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold text-ops-ink">{user.name}</p>
          <p className="truncate text-sm text-ops-ink/50">{user.email}</p>
        </div>
        <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge>
      </Panel>

      <Panel>
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="h-4 w-4 text-ops-accent" aria-hidden />
          <h2 className="font-display text-lg font-bold text-ops-ink">Informations</h2>
        </div>
        <form onSubmit={onSaveProfile} noValidate className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="name"
            label="Nom"
            defaultValue={user.name}
            autoComplete="name"
            error={profileErrors.name}
            wrapperClassName="sm:col-span-2"
          />
          <TextField
            name="email"
            type="email"
            label="Email"
            defaultValue={user.email}
            autoComplete="email"
            error={profileErrors.email}
          />
          <TextField
            name="phone"
            label="Téléphone"
            inputMode="numeric"
            defaultValue={user.phone ?? ""}
            autoComplete="tel"
            error={profileErrors.phone}
          />
          <div className="sm:col-span-2">
            <Button type="submit" icon={Save} loading={savingProfile}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Panel>

      <Panel>
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-ops-accent" aria-hidden />
          <h2 className="font-display text-lg font-bold text-ops-ink">Mot de passe</h2>
        </div>
        <form onSubmit={onChangePassword} noValidate className="grid gap-4 sm:grid-cols-3">
          <TextField
            name="current"
            type="password"
            label="Actuel"
            autoComplete="current-password"
            error={passwordErrors.current}
          />
          <TextField
            name="next"
            type="password"
            label="Nouveau"
            autoComplete="new-password"
            hint="8 caractères, lettres et chiffres"
            error={passwordErrors.next}
          />
          <TextField
            name="confirm"
            type="password"
            label="Confirmation"
            autoComplete="new-password"
            error={passwordErrors.confirm}
          />
          <div className="sm:col-span-3">
            <Button type="submit" variant="secondary" icon={KeyRound} loading={savingPassword}>
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
