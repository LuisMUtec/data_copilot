import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  private validateApiKey(): void {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your-actual-gemini-api-key-here") {
      throw new Error("GEMINI_API_KEY is not configured. Please set a valid API key in your .env file.");
    }
  }

  async analyzeNaturalLanguageQuery(query: string): Promise<QueryAnalysis> {
    this.validateApiKey();
    
    try {
      const prompt = `You are an expert business analyst that converts natural language queries into structured data analysis requests.
            
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
      }

      User query: "${query}"`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON response");
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error("API key authentication failed. Please check your GEMINI_API_KEY in the .env file and ensure it has proper permissions.");
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error("Invalid API key. Please verify your GEMINI_API_KEY in the .env file.");
        }
        if (error.message.includes('429') || error.message.includes('quota')) {
          throw new Error("API quota exceeded. Please check your Google AI Studio quota limits.");
        }
      }
      throw new Error("Failed to analyze query: " + (error as Error).message);
    }
  }

  async generateDataQuery(
    naturalLanguageQuery: string, 
    analysis: QueryAnalysis, 
    dataSourceSchema: any
  ): Promise<string> {
    this.validateApiKey();
    
    try {
      const prompt = `You are an expert in converting business analytics requests into data queries.
            
      Given a natural language query, its analysis, and the data schema, generate the appropriate query.
      For PostgreSQL, generate SQL. For Google Sheets, generate A1 notation ranges or formulas.
      
      Focus on business metrics and entrepreneurial data analysis.
      Always include proper aggregations, grouping, and filtering as needed.
      
      Return only the query string, no explanations.

      Natural Language Query: ${naturalLanguageQuery}
      
      Analysis: ${JSON.stringify(analysis)}
      
      Data Schema: ${JSON.stringify(dataSourceSchema)}
      
      Generate the appropriate query:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      throw new Error("Failed to generate data query: " + (error as Error).message);
    }
  }

  async generateChartInsights(chartData: any, chartType: string, originalQuery: string): Promise<ChartInsights> {
    this.validateApiKey();
    
    try {
      const prompt = `You are a business intelligence expert that provides insights from data visualizations.
            
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
      }

      Original Query: ${originalQuery}
      Chart Type: ${chartType}
      Chart Data: ${JSON.stringify(chartData)}
      
      Provide business insights and recommendations:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON response");
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error("Failed to generate chart insights: " + (error as Error).message);
    }
  }

  async generateConversationTitle(messages: string[]): Promise<string> {
    this.validateApiKey();
    
    try {
      const prompt = `Generate a concise, descriptive title (max 50 characters) for this business analytics conversation. Focus on the main topic or analysis being discussed.

      Conversation messages:
      ${messages.join("\n\n")}

      Title:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const title = response.text().trim().replace(/['"]/g, '');
      
      return title.length > 50 ? title.substring(0, 50) + "..." : title;
    } catch (error) {
      return "Analytics Discussion";
    }
  }
}

export const geminiService = new GeminiService();