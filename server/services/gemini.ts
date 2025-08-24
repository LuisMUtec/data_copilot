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
      // Try Gemini API first
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza')) {
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
      }
    } catch (error) {
      console.log('Gemini API failed, using fallback analysis:', (error as Error).message);
    }

    // Fallback: Local analysis
    return this.analyzeQueryLocally(query);
  }

  private analyzeQueryLocally(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Detect entities and keywords
    const entities: string[] = [];
    const salesKeywords = ['ventas', 'sales', 'revenue', 'ingresos'];
    const customerKeywords = ['clientes', 'customers', 'usuarios', 'users'];
    const productKeywords = ['productos', 'products', 'servicios', 'services'];
    const timeKeywords = ['2024', '2023', 'año', 'year', 'mes', 'month', 'dia', 'day'];

    // Extract entities
    salesKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) entities.push('ventas');
    });
    customerKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) entities.push('clientes');  
    });
    productKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) entities.push('productos');
    });

    // Detect timeframe
    let timeframe = null;
    let queryType: "metrics" | "comparison" | "trend" | "distribution" | "correlation" = "metrics";
    
    if (lowerQuery.includes('2024')) timeframe = '2024';
    if (lowerQuery.includes('2023')) timeframe = '2023';
    
    // Determine query type and visualization
    let suggestedVisualization: "bar" | "line" | "pie" | "scatter" | "area" = "bar";
    
    if (lowerQuery.includes('cuant') || lowerQuery.includes('total') || lowerQuery.includes('count')) {
      queryType = "metrics";
      suggestedVisualization = "bar";
    } else if (lowerQuery.includes('por') || lowerQuery.includes('by') || lowerQuery.includes('cada')) {
      queryType = "distribution";
      suggestedVisualization = "pie";
    } else if (lowerQuery.includes('tiempo') || lowerQuery.includes('time') || lowerQuery.includes('mes') || lowerQuery.includes('month')) {
      queryType = "trend"; 
      suggestedVisualization = "line";
    }

    // Create intent
    let intent = `Analizar ${entities.join(' y ')}`;
    if (timeframe) intent += ` en ${timeframe}`;

    return {
      intent,
      entities,
      queryType,
      timeframe: timeframe || undefined,
      filters: timeframe ? { year: timeframe } : {},
      suggestedVisualization
    };
  }

  async generateDataQuery(
    naturalLanguageQuery: string, 
    analysis: QueryAnalysis, 
    dataSourceSchema: any
  ): Promise<any> {
    try {
      // Try Gemini API first
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza')) {
        const prompt = `You are an expert in converting business analytics requests into data queries.
              
        Given a natural language query, its analysis, and the data schema, generate the appropriate query.
        For CSV files, return a JSON query object with filters, aggregations, groupBy, etc.
        
        Focus on business metrics and entrepreneurial data analysis.
        Always include proper aggregations, grouping, and filtering as needed.
        
        Return only the query JSON object, no explanations.

        Natural Language Query: ${naturalLanguageQuery}
        
        Analysis: ${JSON.stringify(analysis)}
        
        Data Schema: ${JSON.stringify(dataSourceSchema)}
        
        Generate the appropriate query:`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        try {
          return JSON.parse(text);
        } catch {
          // If not JSON, return as string
          return text;
        }
      }
    } catch (error) {
      console.log('Gemini API failed for query generation, using fallback:', (error as Error).message);
    }

    // Fallback: Generate structured query locally
    return this.generateQueryLocally(analysis, dataSourceSchema);
  }

  private generateQueryLocally(analysis: QueryAnalysis, schema: any): any {
    const query: any = {
      select: ["*"],
      filters: [],
      groupBy: null,
      aggregations: [],
      orderBy: null,
      limit: 1000
    };

    // Add time-based filters
    if (analysis.timeframe === '2024') {
      query.filters.push({
        column: 'fecha',
        operator: 'year_equals', 
        value: 2024
      });
    }

    // For "cuantas ventas" - count records
    if (analysis.queryType === 'metrics' && analysis.entities.includes('ventas')) {
      query.aggregations.push({
        function: 'count',
        column: 'ventas'
      });
      query.groupBy = null; // Simple count
    }

    // For distribution queries
    if (analysis.queryType === 'distribution') {
      query.groupBy = ['producto'];
      query.aggregations.push({
        function: 'count',
        column: 'ventas'
      });
    }

    // For trend queries
    if (analysis.queryType === 'trend') {
      query.groupBy = ['fecha'];
      query.aggregations.push({
        function: 'sum',
        column: 'ventas'
      });
      query.orderBy = { column: 'fecha', direction: 'asc' };
    }

    return query;
  }

  async generateChartInsights(chartData: any, chartType: string, originalQuery: string): Promise<ChartInsights> {
    this.validateApiKey();
    
    try {
      // Try Gemini API first
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza')) {
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
        
        Generate insights:`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Invalid JSON response");
        }
        
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('Gemini API failed for insights, using fallback:', (error as Error).message);
    }

    // Fallback: Generate insights locally
    return this.generateInsightsLocally(chartData, originalQuery);
  }

  private generateInsightsLocally(chartData: any, originalQuery: string): ChartInsights {
    const dataLength = Array.isArray(chartData) ? chartData.length : 0;
    
    return {
      summary: `Encontré ${dataLength} registros para tu consulta: "${originalQuery}"`,
      keyInsights: [
        `Total de registros analizados: ${dataLength}`,
        "Los datos provienen de tu archivo CSV cargado",
        "La consulta se procesó exitosamente usando filtros locales",
        dataLength > 0 ? "Hay datos disponibles para el período solicitado" : "No se encontraron datos para los filtros aplicados"
      ],
      recommendations: [
        "Revisa si los filtros de fecha son correctos",
        "Considera expandar el rango de tiempo para más datos",
        "Verifica que el archivo CSV tenga el formato esperado",
        "Intenta consultas más específicas para obtener insights detallados"
      ]
    };
  }

  async generateConversationTitle(messages: string[]): Promise<string> {
    this.validateApiKey();
    
    try {
      // Try Gemini API first
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza')) {
        const prompt = `Generate a concise, descriptive title (max 50 characters) for this business analytics conversation. Focus on the main topic or analysis being discussed.

        Conversation messages:
        ${messages.join("\n\n")}

        Title:`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const title = response.text().trim().replace(/['"]/g, '');
        
        return title.length > 50 ? title.substring(0, 50) + "..." : title;
      }
    } catch (error) {
      console.log('Gemini API failed for title generation:', (error as Error).message);
    }
    
    // Fallback
    return "Analytics Discussion";
  }
}

export const geminiService = new GeminiService();