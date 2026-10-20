import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variantes = cva("inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-muted text-foreground",
      destructive: "bg-destructive text-white",
    },
  },
  defaultVariants: { variant: "secondary" },
});

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof variantes>) {
  return <span className={cn(variantes({ variant }), className)} {...props} />;
}
