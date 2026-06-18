"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  OrganizationSignupWizard,
  type OrganizationSignupPayload,
} from "@/components/auth/organization-signup-wizard";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

type GateState = "loading" | "denied" | "bootstrap" | "add_org";

export default function PlatformInitPage() {
  const router = useRouter();
  const hydrateSession = useAppStore((s) => s.hydrateSession);
  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [gate, setGate] = useState<GateState>("loading");
  const [loading, setLoading] = useState(false);
  const [databaseConfigured, setDatabaseConfigured] = useState(true);

  useEffect(() => {
    void (async () => {
      await hydrateSession();

      const statusRes = await fetch("/api/auth/setup-status");
      const status = (await statusRes.json()) as {
        needsSetup?: boolean;
        databaseConfigured?: boolean;
      };

      setDatabaseConfigured(status.databaseConfigured ?? false);

      if (status.needsSetup) {
        setGate("bootstrap");
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const sessionJson = (await sessionRes.json()) as {
        session?: { user?: { role_id?: string } } | null;
      };

      const roleId = sessionJson.session?.user?.role_id;
      if (roleId === "role-super" || roleId === "role-company-admin") {
        setGate("add_org");
        return;
      }

      setGate("denied");
    })();
  }, [hydrateSession]);

  const handleBootstrap = async (payload: OrganizationSignupPayload) => {
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
    toast.success("Organization created");
    router.push("/dashboard");
  };

  const handleAddOrg = async (payload: OrganizationSignupPayload) => {
    setLoading(true);
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Failed to create organization");
      return;
    }

    await hydrateSession();
    toast.success("Organization registered");
    router.push("/dashboard");
  };

  if (gate === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="sr-only">Loading</p>
      </div>
    );
  }

  if (gate === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-4">
        <p className="text-6xl font-semibold tracking-tight">404</p>
        <p className="text-sm text-muted-foreground">This page could not be found.</p>
      </div>
    );
  }

  if (!databaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <p className="max-w-md text-sm text-destructive">
          Database is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart
          the server.
        </p>
      </div>
    );
  }

  const isBootstrap = gate === "bootstrap";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 p-4">
      <OrganizationSignupWizard
        title={isBootstrap ? "Platform initialization" : "Register organization"}
        description={
          isBootstrap
            ? "Create the first organization and platform administrator account."
            : "Add a new legal entity to the platform."
        }
        showAdminStep={isBootstrap}
        loading={loading}
        onSubmit={isBootstrap ? handleBootstrap : handleAddOrg}
      />
      {!isBootstrap && isAuthenticated && (
        <p className="text-center text-xs text-muted-foreground">
          Signed in as {currentUser?.email}.{" "}
          <Link href="/dashboard" className="underline underline-offset-2">
            Back to dashboard
          </Link>
        </p>
      )}
    </div>
  );
}
