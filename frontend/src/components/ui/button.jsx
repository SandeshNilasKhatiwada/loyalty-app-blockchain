import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Button = forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const v = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "text-gray-700 hover:bg-gray-100",
  };
  const s = { default: "h-10 px-4 py-2", sm: "h-9 px-3 text-sm", lg: "h-11 px-8", icon: "h-10 w-10" };
  return <button ref={ref} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none", v[variant], s[size], className)} {...props} />;
});
Button.displayName = "Button";
export { Button };
