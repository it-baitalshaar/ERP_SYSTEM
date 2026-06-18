import { redirect } from "next/navigation";

export default function CompanyManagementRedirect() {
  redirect("/admin/org-structure");
}
