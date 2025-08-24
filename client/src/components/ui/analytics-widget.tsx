import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  RefreshCw, 
  Download, 
  Share2,
  Maximize2,
  Filter
} from "lucide-react";
import { EnhancedChart } from "./enhanced-chart";

interface AnalyticsWidgetProps {
  title: string;
  subtitle?: string;
  type: "chart" | "metric" | "table";
  size?: "small" | "medium" | "large";
  data?: any[];
  chartType?: "bar" | "line" | "pie" | "area";
  metric?: {
    value: string | number;
    change?: number;
    label: string;
  };
  status?: "active" | "loading" | "error";
  lastUpdated?: string;
  className?: string;
}

export function AnalyticsWidget({ 
  title,
  subtitle,
  type,
  size = "medium",
  data,
  chartType = "bar",
  metric,
  status = "active",
  lastUpdated,
  className = ""
}: AnalyticsWidgetProps) {
  const getGridClasses = () => {
    switch (size) {
      case "small": return "col-span-1";
      case "medium": return "col-span-2";
      case "large": return "col-span-3";
      default: return "col-span-2";
    }
  };

  const renderContent = () => {
    if (status === "loading") {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin">
            <RefreshCw className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="h-64 flex items-center justify-center text-red-500">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Error Loading Data</div>
            <p className="text-sm text-gray-500">Please try refreshing the widget</p>
          </div>
        </div>
      );
    }

    switch (type) {
      case "chart":
        return data && data.length > 0 ? (
          <EnhancedChart 
            title=""
            type={chartType}
            data={data}
            height={size === "small" ? 200 : size === "large" ? 400 : 300}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available
          </div>
        );

      case "metric":
        return metric ? (
          <div className="flex flex-col items-center justify-center h-32">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
            {metric.change && (
              <Badge variant={metric.change > 0 ? "default" : "destructive"}>
                {metric.change > 0 ? "+" : ""}{metric.change}%
              </Badge>
            )}
          </div>
        ) : null;

      case "table":
        return data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="text-left py-2 px-3 font-semibold text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="py-2 px-3 text-gray-600">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            No data available
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`${getGridClasses()} ${className} border-0 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="text-xs">
              {status === "active" ? "Live" : status}
            </Badge>
            <span className="text-xs text-gray-500">
              Updated {lastUpdated}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {renderContent()}
      </CardContent>
      
      {/* Action footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            <Maximize2 className="h-3 w-3 mr-1" />
            Fullscreen
          </Button>
        </div>
      </div>
    </Card>
  );
}