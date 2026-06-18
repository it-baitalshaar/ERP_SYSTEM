import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-warning/50 bg-warning/10 text-warning", className)}>
      Coming Soon
    </Badge>
  );
}
