import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Botones grandes para uso táctil: el tamaño por defecto mide 56 px de alto.
const variantes = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-border bg-card text-foreground",
        ghost: "text-foreground hover:bg-muted",
        destructive: "border border-destructive/40 text-destructive",
      },
      size: {
        default: "min-h-14 px-5 text-base",
        sm: "min-h-12 px-4 text-base",
        lg: "min-h-14 w-full px-6 text-lg",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof variantes> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(variantes({ variant, size }), className)} {...props} />;
}
