"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CHECKS = {
  name: (v) => (v.trim().length >= 2 ? "" : "Enter your name (at least 2 letters)"),
  email: (v) => (EMAIL.test(v.trim()) ? "" : "Enter a valid email address"),
  password: (v, mode) =>
    mode === "register" ? (v.length >= 8 ? "" : "Use at least 8 characters") : v ? "" : "Enter your password",
};

const COPY = {
  login: { submit: "Sign in", busy: "Signing in…", endpoint: "/api/auth/login", fields: ["email", "password"] },
  register: {
    submit: "Create account",
    busy: "Creating account…",
    endpoint: "/api/auth/register",
    fields: ["name", "email", "password"],
  },
};

export default function AuthForm({ mode, next }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const check = (name, value = values[name]) => CHECKS[name](value, mode);

  function update(event) {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: check(name, value) }));
    setFormError("");
  }

  function blur(event) {
    const { name, value } = event.target;
    if (value) setErrors((e) => ({ ...e, [name]: check(name, value) }));
  }

  async function submit(event) {
    event.preventDefault();
    const found = Object.fromEntries(copy.fields.map((f) => [f, check(f)]).filter(([, msg]) => msg));
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    setFormError("");
    try {
      const body = Object.fromEntries(copy.fields.map((f) => [f, values[f]]));
      const res = await fetch(copy.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.fields ?? {});
        setFormError(Object.keys(data.fields ?? {}).length ? "" : data.error ?? "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  const other =
    mode === "login"
      ? { text: "New to AETHER?", label: "Create an account", href: "/register" }
      : { text: "Already have an account?", label: "Sign in", href: "/login" };
  const otherHref = next === "/" ? other.href : `${other.href}?next=${encodeURIComponent(next)}`;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {mode === "register" && (
        <Field label="Name" name="name" autoComplete="name" value={values.name} onChange={update} onBlur={blur} error={errors.name} />
      )}
      <Field
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={values.email}
        onChange={update}
        onBlur={blur}
        error={errors.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        hint={mode === "register" ? "At least 8 characters" : undefined}
        value={values.password}
        onChange={update}
        onBlur={blur}
        error={errors.password}
      />

      <p role="alert" aria-live="assertive" className="min-h-6 text-sm text-[#f87171]">
        {formError}
      </p>

      <Button type="submit" size="lg" className="w-full" disabled={busy} aria-busy={busy}>
        {busy ? copy.busy : copy.submit}
      </Button>

      <p className="text-center text-sm text-mute">
        {other.text}{" "}
        <Link href={otherHref} className="inline-flex min-h-11 items-center text-bone underline">
          {other.label}
        </Link>
      </p>
    </form>
  );
}
