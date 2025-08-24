import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EnhancedChartProps {
  title: string;
  type: "bar" | "line" | "pie" | "area";
  data: any[];
  config?: any;
  insights?: {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
  };
  height?: number;
}

const MODERN_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet  
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#84cc16", // Lime
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function EnhancedChart({ title, type, data, config, insights, height = 350 }: EnhancedChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Minus className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-600">No Data Available</p>
              <p className="text-xs text-gray-500">Connect a data source to see visualizations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (type) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey={config?.xAxisDataKey || Object.keys(data[0])[0]} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey={config?.yAxisDataKey || Object.keys(data[0])[1]} 
              fill={MODERN_COLORS[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey={config?.xAxisDataKey || Object.keys(data[0])[0]} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={config?.yAxisDataKey || Object.keys(data[0])[1]} 
              stroke={MODERN_COLORS[0]}
              strokeWidth={3}
              dot={{ fill: MODERN_COLORS[0], strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: MODERN_COLORS[0], strokeWidth: 2 }}
            />
          </LineChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey={config?.dataKey || "value"}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey={config?.xAxisDataKey || Object.keys(data[0])[0]} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={config?.yAxisDataKey || Object.keys(data[0])[1]} 
              stroke={MODERN_COLORS[0]}
              fill={MODERN_COLORS[0]}
              fillOpacity={0.2}
              strokeWidth={3}
            />
          </AreaChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
        
        {insights && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Insights</h4>
                <p className="text-sm text-gray-600">{insights.summary}</p>
              </div>
              
              {insights.keyInsights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {insights.keyInsights.slice(0, 4).map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{insight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}