import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 ring-offset-white file:border-0 file:bg-transparent file:text-[13px] file:font-medium placeholder:text-vf-text-3 focus-visible:outline-none focus-visible:border-vf-black focus-visible:ring-2 focus-visible:ring-vf-black/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
