import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
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

interface ChartRendererProps {
  type: "bar" | "line" | "pie" | "scatter" | "area";
  data: any[];
  config: any;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function ChartRenderer({ type, data, config }: ChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-4 h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-secondary to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No Data Available</p>
          <p className="text-xs text-muted-foreground">Unable to generate visualization</p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxisDataKey || Object.keys(data[0])[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={config.yAxisDataKey || Object.keys(data[0])[1]} 
              fill="hsl(var(--chart-1))"
            />
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxisDataKey || Object.keys(data[0])[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={config.yAxisDataKey || Object.keys(data[0])[1]} 
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
            />
          </LineChart>
        );

      case "pie":
        return (
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={config.dataKey || "value"}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case "scatter":
        return (
          <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey={config.xAxisDataKey || "x"} name="X" />
            <YAxis type="number" dataKey={config.yAxisDataKey || "y"} name="Y" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data Points" data={data} fill="hsl(var(--chart-1))" />
          </ScatterChart>
        );

      case "area":
        return (
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxisDataKey || Object.keys(data[0])[0]} />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey={config.yAxisDataKey || Object.keys(data[0])[1]} 
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
