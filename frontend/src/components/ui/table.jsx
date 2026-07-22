import { cn } from "../../lib/utils";

const Badge = ({ className, variant = "default", ...props }) => {
  const m = { default: "bg-blue-100 text-blue-800", secondary: "bg-gray-100 text-gray-800", success: "bg-green-100 text-green-800", warning: "bg-yellow-100 text-yellow-800", danger: "bg-red-100 text-red-800" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", m[variant], className)} {...props} />;
};

const Table = ({ className, ...props }) => <div className="w-full overflow-auto"><table className={cn("w-full caption-bottom text-sm", className)} {...props} /></div>;
const THead = ({ className, ...props }) => <thead className={cn("[&_tr]:border-b", className)} {...props} />;
const TBody = ({ className, ...props }) => <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
const TRow = ({ className, ...props }) => <tr className={cn("border-b transition-colors hover:bg-gray-50/50", className)} {...props} />;
const THeadCell = ({ className, ...props }) => <th className={cn("h-12 px-4 text-left align-middle font-medium text-gray-500", className)} {...props} />;
const TCell = ({ className, ...props }) => <td className={cn("p-4 align-middle", className)} {...props} />;

export { Badge, Table, THead, TBody, TRow, THeadCell, TCell };
