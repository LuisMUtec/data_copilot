import type { ChartConfig } from "@/types";

// Color palette for charts
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Chart type validation
export function validateChartData(data: any[], chartType: string): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  const firstItem = data[0];
  if (!firstItem || typeof firstItem !== "object") {
    return false;
  }

  const keys = Object.keys(firstItem);

  switch (chartType) {
    case "pie":
      return keys.length >= 2; // Need at least name and value
    case "bar":
    case "line":
    case "area":
      return keys.length >= 2; // Need at least x and y axis
    case "scatter":
      return keys.length >= 2; // Need at least x and y coordinates
    default:
      return true;
  }
}

// Generate chart summary
export function generateChartSummary(data: any[], chartType: string): string {
  const dataCount = data.length;
  
  switch (chartType) {
    case "pie":
      return `Pie chart showing distribution across ${dataCount} categories`;
    case "bar":
      return `Bar chart comparing ${dataCount} data points`;
    case "line":
      return `Line chart showing trends across ${dataCount} time periods`;
    case "area":
      return `Area chart displaying ${dataCount} data points over time`;
    case "scatter":
      return `Scatter plot with ${dataCount} data points showing correlation`;
    default:
      return `Chart with ${dataCount} data points`;
  }
}

// Suggest optimal chart type based on data
export function suggestOptimalChartType(data: any[]): string {
  if (!data || data.length === 0) return "bar";

  const keys = Object.keys(data[0]);
  const numericKeys = keys.filter(key => 
    data.every(item => !isNaN(parseFloat(item[key])))
  );

  // If we have time-based data (dates), suggest line/area
  const hasTimeData = keys.some(key => 
    data.some(item => !isNaN(Date.parse(item[key])))
  );

  if (hasTimeData && numericKeys.length > 0) {
    return "line";
  }

  // If we have categorical data with numeric values, suggest pie or bar
  if (numericKeys.length === 1 && keys.length === 2) {
    return data.length <= 10 ? "pie" : "bar";
  }

  // If we have two numeric columns, suggest scatter
  if (numericKeys.length >= 2) {
    return "scatter";
  }

  // Default to bar chart
  return "bar";
}

// Prepare data for different chart types
export function prepareChartData(data: any[], chartType: string): any[] {
  if (!data || data.length === 0) return [];

  switch (chartType) {
    case "pie":
      return preparePieData(data);
    case "bar":
    case "line":
      return prepareBarLineData(data);
    case "scatter":
      return prepareScatterData(data);
    case "area":
      return prepareAreaData(data);
    default:
      return data;
  }
}

function preparePieData(data: any[]): any[] {
  // Assuming first column is label, second is value
  const keys = Object.keys(data[0] || {});
  if (keys.length < 2) return [];

  const labelKey = keys[0];
  const valueKey = keys[1];

  return data.map(item => ({
    name: item[labelKey],
    value: parseFloat(item[valueKey]) || 0,
  }));
}

function prepareBarLineData(data: any[]): any[] {
  // For bar/line charts, we need x and y axis data
  const keys = Object.keys(data[0] || {});
  if (keys.length < 2) return [];

  return data.map(item => {
    const prepared: any = {};
    keys.forEach(key => {
      const value = item[key];
      prepared[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
    });
    return prepared;
  });
}

function prepareScatterData(data: any[]): any[] {
  // For scatter plots, we need x and y coordinates
  const keys = Object.keys(data[0] || {});
  if (keys.length < 2) return [];

  const xKey = keys[0];
  const yKey = keys[1];

  return data.map(item => ({
    x: parseFloat(item[xKey]) || 0,
    y: parseFloat(item[yKey]) || 0,
    ...item,
  }));
}

function prepareAreaData(data: any[]): any[] {
  // Similar to bar/line but may need stacking
  return prepareBarLineData(data);
}

// Generate default chart configuration
export function generateChartConfig(chartType: string, data: any[]): ChartConfig {
  const baseConfig: ChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
  };

  if (!data || data.length === 0) return baseConfig;

  const keys = Object.keys(data[0]);

  switch (chartType) {
    case "pie":
      return {
        ...baseConfig,
        dataKey: "value",
        nameKey: "name",
      };
    case "bar":
      return {
        ...baseConfig,
        xAxisDataKey: keys[0],
        yAxisDataKey: keys[1],
      };
    case "line":
      return {
        ...baseConfig,
        xAxisDataKey: keys[0],
        yAxisDataKey: keys[1],
      };
    case "scatter":
      return {
        ...baseConfig,
        xAxisDataKey: "x",
        yAxisDataKey: "y",
      };
    case "area":
      return {
        ...baseConfig,
        xAxisDataKey: keys[0],
        yAxisDataKey: keys[1],
      };
    default:
      return baseConfig;
  }
}

// Format numbers for display
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toFixed(0);
}

// Format percentage
export function formatPercentage(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

// Format currency
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

// Generate color based on index
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// Export chart data as CSV
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) return;

  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(","), // Header
    ...data.map(row => keys.map(key => `"${row[key]}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Check if data has time series structure
export function isTimeSeriesData(data: any[]): boolean {
  if (!data || data.length === 0) return false;
  
  const keys = Object.keys(data[0]);
  return keys.some(key => 
    data.some(item => !isNaN(Date.parse(item[key])))
  );
}

// Sort data by date column
export function sortByDate(data: any[], dateKey: string): any[] {
  return [...data].sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    return dateA.getTime() - dateB.getTime();
  });
}

// Aggregate data by time period
export function aggregateByTimePeriod(
  data: any[], 
  dateKey: string, 
  valueKey: string, 
  period: "day" | "week" | "month" | "year" = "month"
): any[] {
  const groups: { [key: string]: number[] } = {};

  data.forEach(item => {
    const date = new Date(item[dateKey]);
    let key: string;

    switch (period) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "year":
        key = String(date.getFullYear());
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(parseFloat(item[valueKey]) || 0);
  });

  return Object.entries(groups).map(([key, values]) => ({
    [dateKey]: key,
    [valueKey]: values.reduce((sum, val) => sum + val, 0),
    count: values.length,
  }));
}
