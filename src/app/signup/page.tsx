"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, ErrorBanner, SelectField, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { PRODUCT_TYPES } from "@/lib/product-types";
import { TUNISIA_GOVERNORATES } from "@/lib/status-meta";
import { citiesForGovernorate } from "@/lib/tunisia-address";
import {
  digitsOnly,
  normalizeEmail,
  validateSignup,
  validateSignupField,
  type SignupField,
  type SignupFieldErrors,
  type SignupFormValues,
  type SignupRole,
} from "@/lib/signup-validation";

const EMPTY: SignupFormValues = {
  role: "EXPEDITEUR",
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
  governorate: "",
  city: "",
  address: "",
  productTypes: [],
  productNotes: "",
};

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<SignupField, boolean>>>(
    {},
  );
  const [errors, setErrors] = useState<SignupFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cities = useMemo(
    () => (values.governorate ? citiesForGovernorate(values.governorate) : []),
    [values.governorate],
  );

  function applyFieldError(field: SignupField, nextValues: SignupFormValues) {
    const fieldError = validateSignupField(field, nextValues);
    setErrors((prev) => {
      const copy = { ...prev };
      if (fieldError) copy[field] = fieldError;
      else delete copy[field];
      return copy;
    });
  }

  function setField<K extends keyof SignupFormValues>(
    key: K,
    value: SignupFormValues[K],
  ) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      const field = key as SignupField;
      if (touched[field] || errors[field]) {
        queueMicrotask(() => applyFieldError(field, next));
      }
      return next;
    });
  }

  function markTouched(field: SignupField, nextValues?: SignupFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    applyFieldError(field, nextValues ?? values);
  }

  function setRole(role: SignupRole) {
    setValues((prev) => ({
      ...prev,
      role,
      productTypes: role === "EXPEDITEUR" ? prev.productTypes : [],
      productNotes: role === "EXPEDITEUR" ? prev.productNotes : "",
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.productTypes;
      delete copy.productNotes;
      delete copy.name;
      return copy;
    });
  }

  function toggleProduct(type: string) {
    setValues((prev) => {
      const productTypes = prev.productTypes.includes(type)
        ? prev.productTypes.filter((t) => t !== type)
        : [...prev.productTypes, type];
      const next = { ...prev, productTypes };
      if (touched.productTypes || errors.productTypes) {
        const fieldError = validateSignupField("productTypes", next);
        setErrors((prevErrors) => {
          const copy = { ...prevErrors };
          if (fieldError) copy.productTypes = fieldError;
          else delete copy.productTypes;
          return copy;
        });
      }
      return next;
    });
    setTouched((prev) => ({ ...prev, productTypes: true }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const allTouched: Partial<Record<SignupField, boolean>> = {
      name: true,
      email: true,
      phone: true,
      password: true,
      confirm: true,
      governorate: true,
      city: true,
      address: true,
      productTypes: values.role === "EXPEDITEUR",
      productNotes: values.role === "EXPEDITEUR" && values.productTypes.includes("Autre"),
    };
    setTouched((prev) => ({ ...prev, ...allTouched }));

    const result = validateSignup(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setLoading(true);
    try {
      await signUp({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        password: result.data.password,
        role: result.data.role,
        governorate: result.data.governorate,
        city: result.data.city,
        address: result.data.address,
        shopName: result.data.role === "EXPEDITEUR" ? result.data.name : undefined,
        productTypes:
          result.data.role === "EXPEDITEUR" ? result.data.productTypes : undefined,
        productNotes:
          result.data.role === "EXPEDITEUR" && result.data.productNotes
            ? result.data.productNotes
            : undefined,
      });
      router.replace("/compte-en-attente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle={
        values.role === "EXPEDITEUR"
          ? "Compte expéditeur — déclarez vos produits et l’adresse de votre boutique."
          : "Compte livreur — indiquez votre adresse de base pour être rattaché à une zone."
      }
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-cream bg-cream-soft/40 p-1">
        {(
          [
            { id: "EXPEDITEUR" as const, label: "Expéditeur" },
            { id: "LIVREUR" as const, label: "Livreur" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setRole(opt.id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              values.role === opt.id
                ? "bg-brand text-white shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="name"
          label={values.role === "EXPEDITEUR" ? "Nom de la boutique" : "Nom complet"}
          autoComplete={values.role === "EXPEDITEUR" ? "organization" : "name"}
          value={values.name}
          maxLength={80}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={() => markTouched("name")}
          error={touched.name ? errors.name : undefined}
          wrapperClassName="sm:col-span-2"
        />
        <TextField
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={values.email}
          maxLength={120}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => {
            const email = normalizeEmail(values.email);
            const next = { ...values, email };
            setValues(next);
            markTouched("email", next);
          }}
          error={touched.email ? errors.email : undefined}
        />
        <TextField
          name="phone"
          label="Téléphone"
          inputMode="numeric"
          placeholder="8 chiffres"
          autoComplete="tel"
          value={values.phone}
          maxLength={8}
          onChange={(e) => setField("phone", digitsOnly(e.target.value))}
          onBlur={() => markTouched("phone")}
          error={touched.phone ? errors.phone : undefined}
          hint="Mobile tunisien · 8 chiffres"
        />
        <TextField
          name="password"
          type="password"
          label="Mot de passe"
          autoComplete="new-password"
          value={values.password}
          maxLength={72}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => markTouched("password")}
          hint="8 caractères min. · lettre + chiffre"
          error={touched.password ? errors.password : undefined}
        />
        <TextField
          name="confirm"
          type="password"
          label="Confirmation"
          autoComplete="new-password"
          value={values.confirm}
          maxLength={72}
          onChange={(e) => setField("confirm", e.target.value)}
          onBlur={() => markTouched("confirm")}
          error={touched.confirm ? errors.confirm : undefined}
        />

        {values.role === "EXPEDITEUR" ? (
          <div className="sm:col-span-2 space-y-2">
            <p className="text-sm font-medium text-ink">Types de produits vendus</p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TYPES.map((type) => {
                const active = values.productTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleProduct(type)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-brand bg-brand/10 font-semibold text-brand"
                        : "border-cream text-ink-muted hover:border-brand/40"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {touched.productTypes && errors.productTypes ? (
              <p className="text-xs text-red-600">{errors.productTypes}</p>
            ) : null}
            {values.productTypes.includes("Autre") ? (
              <TextField
                name="productNotes"
                label="Précisez (Autre)"
                value={values.productNotes}
                maxLength={120}
                onChange={(e) => setField("productNotes", e.target.value)}
                onBlur={() => markTouched("productNotes")}
                error={touched.productNotes ? errors.productNotes : undefined}
              />
            ) : null}
          </div>
        ) : null}

        <SelectField
          name="governorate"
          label="Gouvernorat"
          value={values.governorate}
          onChange={(e) => {
            setField("governorate", e.target.value);
            setField("city", "");
            setTouched((prev) => ({ ...prev, governorate: true, city: false }));
          }}
          onBlur={() => markTouched("governorate")}
          error={touched.governorate ? errors.governorate : undefined}
        >
          <option value="">Choisir…</option>
          {TUNISIA_GOVERNORATES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </SelectField>
        {cities.length > 0 ? (
          <SelectField
            name="city"
            label="Ville"
            value={values.city}
            onChange={(e) => {
              setField("city", e.target.value);
              setTouched((prev) => ({ ...prev, city: true }));
            }}
            onBlur={() => markTouched("city")}
            error={touched.city ? errors.city : undefined}
          >
            <option value="">Choisir…</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        ) : (
          <TextField
            name="city"
            label="Ville"
            value={values.city}
            maxLength={80}
            onChange={(e) => setField("city", e.target.value)}
            onBlur={() => markTouched("city")}
            error={touched.city ? errors.city : undefined}
          />
        )}
        <TextField
          name="address"
          label={
            values.role === "EXPEDITEUR"
              ? "Adresse de la boutique"
              : "Adresse de base"
          }
          autoComplete="street-address"
          value={values.address}
          maxLength={200}
          onChange={(e) => setField("address", e.target.value)}
          onBlur={() => markTouched("address")}
          error={touched.address ? errors.address : undefined}
          wrapperClassName="sm:col-span-2"
        />

        {error ? (
          <div className="sm:col-span-2">
            <ErrorBanner message={error} />
          </div>
        ) : null}
        <p className="sm:col-span-2 text-xs text-ink-muted">
          Après inscription, votre compte reste en attente jusqu’à validation par
          l’équipe Umbrella.
        </p>
        <Button type="submit" icon={UserPlus} loading={loading} className="w-full sm:col-span-2">
          Créer mon compte
        </Button>
      </form>
    </AuthLayout>
  );
}
