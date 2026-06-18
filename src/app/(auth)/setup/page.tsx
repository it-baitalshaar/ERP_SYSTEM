"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OrganizationSignupWizard,
  type OrganizationSignupPayload,
} from "@/components/auth/organization-signup-wizard";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function SetupPage() {
  const router = useRouter();
  const hydrateSession = useAppStore((s) => s.hydrateSession);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [databaseConfigured, setDatabaseConfigured] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/setup-status");
      const json = (await res.json()) as {
        needsSetup?: boolean;
        databaseConfigured?: boolean;
      };

      setDatabaseConfigured(json.databaseConfigured ?? false);

      if (!json.needsSetup) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    })();
  }, [router]);

  const handleSubmit = async (payload: OrganizationSignupPayload) => {
    setLoading(true);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Setup failed");
      return;
    }

    await hydrateSession();
    toast.success("Organization registered — welcome!");
    router.push("/dashboard");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Checking setup status…</p>
      </div>
    );
  }

  if (!databaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <p className="max-w-md text-sm text-destructive">
          Database is not configured. Add{" "}
          <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
          <code className="text-xs">.env.local</code> and restart the dev server.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <OrganizationSignupWizard
        title="Register your organization"
        description="Set up the legal entity, shops or departments, and sites — each with its own trade license."
        showAdminStep
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
