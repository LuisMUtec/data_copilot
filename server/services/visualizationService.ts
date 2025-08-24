interface ChartExportOptions {
  format: "png" | "pdf" | "svg" | "json";
  width?: number;
  height?: number;
  title?: string;
}

interface ExportResult {
  data: Buffer | string;
  filename: string;
  contentType: string;
}

export class VisualizationService {
  async exportChart(
    chartData: any,
    chartType: string,
    options: ChartExportOptions
  ): Promise<ExportResult> {
    try {
      switch (options.format) {
        case "json":
          return this.exportAsJson(chartData, chartType);
        case "png":
        case "pdf":
        case "svg":
          // In a full implementation, you would use a library like puppeteer
          // or canvas to render the chart and export it
          throw new Error("Image/PDF export not implemented - requires server-side rendering");
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      throw new Error(`Export failed: ${(error as Error).message}`);
    }
  }

  private exportAsJson(chartData: any, chartType: string): ExportResult {
    const exportData = {
      chartType,
      data: chartData,
      exportedAt: new Date().toISOString(),
    };

    return {
      data: JSON.stringify(exportData, null, 2),
      filename: `chart_${Date.now()}.json`,
      contentType: "application/json",
    };
  }

  validateChartData(data: any[], chartType: string): boolean {
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

  generateChartSummary(data: any[], chartType: string): string {
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

  suggestOptimalChartType(data: any[]): string {
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
}

export const visualizationService = new VisualizationService();
