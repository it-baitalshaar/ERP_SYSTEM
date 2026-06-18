import { toast } from "sonner";

export function showComingSoonToast(action = "This feature") {
  toast.info(`${action} is coming soon — backend integration pending.`);
}
