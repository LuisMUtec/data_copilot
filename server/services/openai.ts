import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

interface QueryAnalysis {
  intent: string;
  entities: string[];
  queryType: "metrics" | "comparison" | "trend" | "distribution" | "correlation";
  timeframe?: string;
  filters?: Record<string, any>;
  suggestedVisualization: "bar" | "line" | "pie" | "scatter" | "area";
}

interface ChartInsights {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
}

export class OpenAIService {
  async analyzeNaturalLanguageQuery(query: string): Promise<QueryAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert business analyst that converts natural language queries into structured data analysis requests.
            
            Analyze the user's query and extract:
            - intent: what they want to understand
            - entities: key business terms, metrics, dimensions mentioned
            - queryType: metrics (single values), comparison (comparing categories), trend (over time), distribution (breakdown), correlation (relationships)
            - timeframe: any time period mentioned
            - filters: conditions or constraints
            - suggestedVisualization: best chart type for this analysis
            
            Focus on entrepreneurial and business analytics contexts. Common metrics include revenue, customers, conversion rates, growth, retention, etc.
            
            Respond with JSON in this exact format:
            {
              "intent": "string describing what user wants to know",
              "entities": ["array", "of", "key", "terms"],
              "queryType": "metrics|comparison|trend|distribution|correlation",
              "timeframe": "string or null",
              "filters": {},
              "suggestedVisualization": "bar|line|pie|scatter|area"
            }`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      throw new Error("Failed to analyze query: " + (error as Error).message);
    }
  }

  async generateDataQuery(
    naturalLanguageQuery: string, 
    analysis: QueryAnalysis, 
    dataSourceSchema: any
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert in converting business analytics requests into data queries.
            
            Given a natural language query, its analysis, and the data schema, generate the appropriate query.
            For PostgreSQL, generate SQL. For Google Sheets, generate A1 notation ranges or formulas.
            
            Focus on business metrics and entrepreneurial data analysis.
            Always include proper aggregations, grouping, and filtering as needed.
            
            Return only the query string, no explanations.`
          },
          {
            role: "user",
            content: `Natural Language Query: ${naturalLanguageQuery}
            
            Analysis: ${JSON.stringify(analysis)}
            
            Data Schema: ${JSON.stringify(dataSourceSchema)}
            
            Generate the appropriate query:`
          }
        ],
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      throw new Error("Failed to generate data query: " + (error as Error).message);
    }
  }

  async generateChartInsights(chartData: any, chartType: string, originalQuery: string): Promise<ChartInsights> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a business intelligence expert that provides insights from data visualizations.
            
            Analyze the chart data and provide:
            - summary: concise overview of what the data shows
            - keyInsights: 3-5 specific observations from the data
            - recommendations: 3-5 actionable business recommendations
            
            Focus on entrepreneurial and business growth insights. Look for trends, patterns, outliers, and opportunities.
            
            Respond with JSON in this exact format:
            {
              "summary": "brief overview of findings",
              "keyInsights": ["insight 1", "insight 2", "insight 3"],
              "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
            }`
          },
          {
            role: "user",
            content: `Original Query: ${originalQuery}
            Chart Type: ${chartType}
            Chart Data: ${JSON.stringify(chartData)}
            
            Provide business insights and recommendations:`
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      throw new Error("Failed to generate chart insights: " + (error as Error).message);
    }
  }

  async generateConversationTitle(messages: string[]): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Generate a concise, descriptive title (max 50 characters) for this business analytics conversation. Focus on the main topic or analysis being discussed."
          },
          {
            role: "user",
            content: `Generate a title for this conversation:\n\n${messages.join("\n\n")}`
          }
        ],
        max_tokens: 20,
      });

      return response.choices[0].message.content?.trim() || "Analytics Discussion";
    } catch (error) {
      return "Analytics Discussion";
    }
  }
}

export const openaiService = new OpenAIService();
