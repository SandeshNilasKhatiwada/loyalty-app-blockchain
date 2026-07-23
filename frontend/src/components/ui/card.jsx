import { cn } from "../../lib/utils";

const Card = ({ className, ...props }) => <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)} {...props} />;
const CardHeader = ({ className, ...props }) => <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
const CardTitle = ({ className, ...props }) => <h3 className={cn("text-lg font-semibold", className)} {...props} />;
const CardDesc = ({ className, ...props }) => <p className={cn("text-sm text-gray-500", className)} {...props} />;
const CardContent = ({ className, ...props }) => <div className={cn("p-6 pt-0", className)} {...props} />;

export { Card, CardHeader, CardTitle, CardDesc, CardContent };
