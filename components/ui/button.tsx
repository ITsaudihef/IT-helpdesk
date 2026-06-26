import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-9500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:     "bg-[#7C3AED] text-white hover:bg-[#58a033] shadow-sm",
        dark:        "bg-[#5B21B6] text-white hover:bg-[#006848] shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline:     "border border-gray-300 bg-white text-purple-200 hover:bg-white/5",
        secondary:   "bg-gray-100 text-white hover:bg-gray-200",
        ghost:       "hover:bg-purple-950 text-purple-200 hover:text-green-700",
        link:        "text-[#7C3AED] underline-offset-4 hover:underline",
        success:     "bg-green-600 text-white hover:bg-green-700",
        warning:     "bg-orange-500 text-white hover:bg-orange-600",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-lg px-8",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
