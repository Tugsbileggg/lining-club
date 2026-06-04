"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Нэвтрэлт амжилтгүй.");
      }
      const next =
        new URLSearchParams(window.location.search).get("next") ?? "/admin";
      router.replace(next);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("auth/")
          ? "И-мэйл эсвэл нууц үг буруу байна."
          : err instanceof Error
            ? err.message
            : "Алдаа гарлаа.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/40 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
        <h1 className="text-center text-lg font-semibold uppercase tracking-tight">
          {siteConfig.name}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Админ нэвтрэх
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">И-мэйл</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Нууц үг</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Нэвтрэх
          </Button>
        </form>
      </div>
    </div>
  );
}
