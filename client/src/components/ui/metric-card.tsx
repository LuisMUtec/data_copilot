import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  gradient?: string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  gradient = "from-blue-500 to-blue-600",
  className 
}: MetricCardProps) {
  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", gradient)} />
      <div className="absolute inset-0 bg-white/95" />
      
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend && (
                <span className={cn(
                  "text-sm font-medium inline-flex items-center px-2 py-1 rounded-full",
                  trend.isPositive 
                    ? "text-green-700 bg-green-100" 
                    : "text-red-700 bg-red-100"
                )}>
                  {trend.isPositive ? "↗" : "↘"} {trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
            {trend?.label && (
              <p className="text-xs text-gray-500">{trend.label}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg", gradient)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}