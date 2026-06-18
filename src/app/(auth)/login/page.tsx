"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const loginWithPassword = useAppStore((s) => s.loginWithPassword);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/setup-status");
      const json = (await res.json()) as { needsSetup?: boolean };
      if (json.needsSetup) {
        router.replace("/setup");
        return;
      }
      setCheckingSetup(false);
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await loginWithPassword(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    router.push("/dashboard");
  };

  if (checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bait Al Shaar ERP</CardTitle>
          <CardDescription>
            Sign in with credentials created by your administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Need an account? Ask your company administrator to create one in{" "}
              <span className="font-medium">Admin → User Management</span>.
            </p>
            <p className="text-center text-xs text-muted-foreground">
              First time after a database reset?{" "}
              <Link href="/setup" className="underline underline-offset-2">
                Initial organization setup
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
