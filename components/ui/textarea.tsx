import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        style={{ background: "#FFFFFF", borderColor: "#D1C4FE", color: "#1F1535", ...(props.style || {}) }}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
