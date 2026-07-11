import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-bold ring-offset-vf-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vf-lime focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-vf-black text-white hover:bg-gray-800 shadow-vf-sm",
        lime: "bg-vf-lime text-vf-black hover:bg-vf-lime-dark shadow-vf-sm",
        destructive: "bg-vf-danger/10 text-vf-danger hover:bg-vf-danger/20",
        outline: "border border-vf-border bg-white text-vf-text-1 hover:bg-gray-50 shadow-vf-sm",
        secondary: "bg-white border border-vf-border text-vf-text-2 hover:bg-gray-50",
        ghost: "text-vf-text-2 hover:bg-vf-muted",
        link: "text-vf-black underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
