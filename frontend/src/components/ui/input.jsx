import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50", className)} {...props} />
));
Input.displayName = "Input";

const Label = ({ className, ...props }) => (
  <label className={cn("text-sm font-medium text-gray-700", className)} {...props} />
);

export { Input, Label };
