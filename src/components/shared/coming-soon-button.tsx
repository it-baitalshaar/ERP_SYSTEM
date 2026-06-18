"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showComingSoonToast } from "@/lib/coming-soon";

interface ComingSoonButtonProps extends ButtonProps {
  tooltip?: string;
}

export function ComingSoonButton({ tooltip = "Backend integration coming soon", onClick, children, ...props }: ComingSoonButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...props}
            onClick={(e) => {
              showComingSoonToast();
              onClick?.(e);
            }}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
