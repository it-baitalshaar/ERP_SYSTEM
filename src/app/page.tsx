import { redirect } from "next/navigation";
import { needsSetup } from "@/lib/server/bootstrap";

export default async function HomePage() {
  if (await needsSetup()) {
    redirect("/setup");
  }
  redirect("/login");
}
