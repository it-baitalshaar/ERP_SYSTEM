"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  OrganizationSignupWizard,
  type OrganizationSignupPayload,
} from "@/components/auth/organization-signup-wizard";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function OrganizationSignupPage() {
  const router = useRouter();
  const hydrateSession = useAppStore((s) => s.hydrateSession);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: OrganizationSignupPayload) => {
    setLoading(true);
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Registration failed");
      return;
    }

    await hydrateSession();
    toast.success("New organization registered");
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 p-4">
      <OrganizationSignupWizard
        title="Register another organization"
        description={
          isAuthenticated
            ? "Add a new legal entity under your account. You will get access to all units and sites created here."
            : "Create a new organization with its own administrator account, or sign in first to link it to your existing user."
        }
        showAdminStep={!isAuthenticated}
        loading={loading}
        onSubmit={handleSubmit}
      />
      <p className="text-center text-xs text-muted-foreground">
        {isAuthenticated ? (
          <Link href="/dashboard" className="underline underline-offset-2">
            Back to dashboard
          </Link>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-2">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
