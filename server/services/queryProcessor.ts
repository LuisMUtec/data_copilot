import { geminiService } from "./gemini";
import { googleSheetsService } from "./googleSheets";
import { csvService } from "./csvService";
import { apiService } from "./apiService";
import { postgresqlService } from "./postgresqlService";
import { storage } from "../storage";
import type { DataSource, InsertQuery, InsertVisualization } from "@shared/schema";

interface ProcessedQuery {
  queryId: string;
  results: any[];
  visualization?: {
    type: "bar" | "line" | "pie" | "scatter" | "area";
    data: any;
    config: any;
  };
  insights: {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
  };
}

export class QueryProcessorService {
  async processNaturalLanguageQuery(
    userId: string,
    conversationId: string,
    naturalLanguageQuery: string,
    dataSourceId?: string
  ): Promise<ProcessedQuery> {
    try {
      // Step 1: Analyze the natural language query
      const analysis = await geminiService.analyzeNaturalLanguageQuery(naturalLanguageQuery);
      
      // Step 2: Determine data source
      let dataSource: DataSource | undefined;
      if (dataSourceId) {
        dataSource = await storage.getDataSource(dataSourceId);
      } else {
        // Get the user's primary/active data source
        const dataSources = await storage.getDataSourcesByUserId(userId);
        dataSource = dataSources.find(ds => ds.isActive) || dataSources[0];
      }

      if (!dataSource) {
        throw new Error("No data source available for query processing");
      }

      // Step 3: Get data source schema
      let schema: any;
      let results: any[] = [];

      if (dataSource.type === "google_sheets") {
        schema = await googleSheetsService.getSheetSchema(dataSource.config as any);
        
        // Step 4: Generate specific query for data source
        const dataQuery = await geminiService.generateDataQuery(
          naturalLanguageQuery,
          analysis,
          schema
        );

        // Step 5: Execute query against data source
        results = await googleSheetsService.executeQuery(dataSource.config as any, dataQuery);
      } else if (dataSource.type === "csv") {
        schema = await csvService.getCSVSchema(dataSource.config as any);
        
        const dataQuery = await geminiService.generateDataQuery(
          naturalLanguageQuery,
          analysis,
          schema
        );

        results = await csvService.executeQuery(dataSource.config as any, dataQuery);
      } else if (dataSource.type === "api") {
        schema = await apiService.getAPISchema(dataSource.config as any);
        
        const dataQuery = await geminiService.generateDataQuery(
          naturalLanguageQuery,
          analysis,
          schema
        );

        results = await apiService.executeQuery(dataSource.config as any, dataQuery);
      } else if (dataSource.type === "postgresql") {
        schema = await postgresqlService.getPostgreSQLSchema(dataSource.config as any);
        
        const dataQuery = await geminiService.generateDataQuery(
          naturalLanguageQuery,
          analysis,
          schema
        );

        results = await postgresqlService.executeQuery(dataSource.config as any, dataQuery);
      } else {
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }

      // Store the processed query (for all data source types)
      let queryId = `query-${Date.now()}`;
      let storedQuery;
      
      try {
        storedQuery = await storage.createQuery({
          userId,
          conversationId,
          originalQuery: naturalLanguageQuery,
          processedQuery: JSON.stringify({ analysis, schema }),
          queryType: analysis.queryType,
          dataSourceId: dataSource.id,
          results: results as any,
        });
        queryId = storedQuery.id;
      } catch (queryError) {
        console.log("Query storage failed, using fallback ID:", queryError);
      }

      // Generate visualization if appropriate
      let visualization;
      if (results.length > 0 && this.shouldCreateVisualization(analysis.queryType)) {
        const vizData = this.prepareVisualizationData(results, analysis.suggestedVisualization);
        
        visualization = {
          type: analysis.suggestedVisualization,
          data: vizData,
          config: this.generateVisualizationConfig(analysis.suggestedVisualization, vizData),
        };

        // Store visualization if query was stored successfully
        if (storedQuery) {
          try {
            await storage.createVisualization({
              queryId: storedQuery.id,
              type: analysis.suggestedVisualization,
              config: visualization.config as any,
              data: visualization.data as any,
            });
          } catch (vizError) {
            console.log("Visualization storage failed:", vizError);
          }
        }
      }

      // Generate insights
      const insights = visualization 
        ? await geminiService.generateChartInsights(
            visualization.data,
            analysis.suggestedVisualization,
            naturalLanguageQuery
          )
        : {
            summary: `Found ${results.length} records matching your query.`,
            keyInsights: [
              `Retrieved ${results.length} data points from your ${dataSource.type} data source`,
              `Query type: ${analysis.queryType}`,
              `Data source: ${dataSource.name}`,
            ],
            recommendations: [
              "Consider adding filters for more specific results",
              "Try asking for trends over time",
              "Request comparisons between different periods",
            ],
          };

      return {
        queryId,
        results,
        visualization,
        insights,
      };
    } catch (error) {
      throw new Error(`Query processing failed: ${(error as Error).message}`);
    }
  }

  private shouldCreateVisualization(queryType: string): boolean {
    // Don't create visualizations for single metric queries unless they're part of a trend
    return queryType !== "metrics";
  }

  private prepareVisualizationData(results: any[], chartType: string): any {
    if (results.length === 0) return [];

    switch (chartType) {
      case "pie":
        return this.preparePieData(results);
      case "bar":
      case "line":
        return this.prepareBarLineData(results);
      case "scatter":
        return this.prepareScatterData(results);
      case "area":
        return this.prepareAreaData(results);
      default:
        return results;
    }
  }

  private preparePieData(results: any[]): any[] {
    // Assuming first column is label, second is value
    const keys = Object.keys(results[0] || {});
    if (keys.length < 2) return [];

    const labelKey = keys[0];
    const valueKey = keys[1];

    return results.map(item => ({
      name: item[labelKey],
      value: parseFloat(item[valueKey]) || 0,
    }));
  }

  private prepareBarLineData(results: any[]): any[] {
    // For bar/line charts, we need x and y axis data
    const keys = Object.keys(results[0] || {});
    if (keys.length < 2) return [];

    return results.map(item => {
      const prepared: any = {};
      keys.forEach(key => {
        const value = item[key];
        prepared[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
      });
      return prepared;
    });
  }

  private prepareScatterData(results: any[]): any[] {
    // For scatter plots, we need x and y coordinates
    const keys = Object.keys(results[0] || {});
    if (keys.length < 2) return [];

    const xKey = keys[0];
    const yKey = keys[1];

    return results.map(item => ({
      x: parseFloat(item[xKey]) || 0,
      y: parseFloat(item[yKey]) || 0,
      ...item,
    }));
  }

  private prepareAreaData(results: any[]): any[] {
    // Similar to bar/line but may need stacking
    return this.prepareBarLineData(results);
  }

  private generateVisualizationConfig(chartType: string, data: any): any {
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: false,
    };

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
          xAxisDataKey: Object.keys(data[0] || {})[0],
          yAxisDataKey: Object.keys(data[0] || {})[1],
        };
      case "line":
        return {
          ...baseConfig,
          xAxisDataKey: Object.keys(data[0] || {})[0],
          yAxisDataKey: Object.keys(data[0] || {})[1],
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
          xAxisDataKey: Object.keys(data[0] || {})[0],
          yAxisDataKey: Object.keys(data[0] || {})[1],
        };
      default:
        return baseConfig;
    }
  }
}

export const queryProcessorService = new QueryProcessorService();
