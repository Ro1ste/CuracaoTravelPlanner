import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

const iconColorMap: Record<string, string> = {
  "Award": "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
  "Users": "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  "Flame": "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  "Target": "text-green-500 bg-green-100 dark:bg-green-900/30",
};

const gradientMap: Record<string, string> = {
  "Award": "from-yellow-500/5 to-purple-500/5 dark:from-yellow-500/10 dark:to-purple-500/10",
  "Users": "from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10",
  "Flame": "from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10",
  "Target": "from-green-500/5 to-teal-500/5 dark:from-green-500/10 dark:to-teal-500/10",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  const iconName = Icon.name;
  const iconColors = iconColorMap[iconName] || "text-primary bg-primary/10";
  const gradientClass = gradientMap[iconName] || "from-primary/5 to-primary/10";

  return (
    <Card className={cn(
      "relative overflow-hidden hover-elevate transition-all duration-300 border-2",
      className
    )}>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-100 pointer-events-none",
        gradientClass
      )} />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-bold tracking-tight" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <Badge 
                variant={trend.isPositive ? "default" : "secondary"}
                className="mt-2 text-xs"
              >
                {trend.isPositive ? "+" : "-"}{trend.value}
              </Badge>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-full shadow-sm",
            iconColors
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}