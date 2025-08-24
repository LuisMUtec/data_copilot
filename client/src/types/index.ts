// User types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
}

// Conversation types
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsertConversation {
  userId: string;
  title: string;
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InsertMessage {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, any>;
}

// Data Source types
export interface DataSource {
  id: string;
  userId: string;
  name: string;
  type: "google_sheets" | "postgresql" | "csv" | "api";
  config: Record<string, any>;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
}

export interface InsertDataSource {
  userId: string;
  name: string;
  type: "google_sheets" | "postgresql" | "csv" | "api";
  config: Record<string, any>;
  isActive?: boolean;
}

// Query types
export interface Query {
  id: string;
  userId: string;
  conversationId?: string;
  originalQuery: string;
  processedQuery?: string;
  queryType?: string;
  dataSourceId?: string;
  results?: any;
  createdAt: string;
}

export interface InsertQuery {
  userId: string;
  conversationId?: string;
  originalQuery: string;
  processedQuery?: string;
  queryType?: string;
  dataSourceId?: string;
  results?: any;
}

// Visualization types
export interface Visualization {
  id: string;
  queryId: string;
  type: "bar" | "line" | "pie" | "scatter" | "area";
  config: Record<string, any>;
  data: any;
  createdAt: string;
}

export interface InsertVisualization {
  queryId: string;
  type: "bar" | "line" | "pie" | "scatter" | "area";
  config: Record<string, any>;
  data: any;
}

// Template types
export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  prompt: string;
  isPublic: boolean;
  createdAt: string;
}

export interface InsertTemplate {
  name: string;
  description?: string;
  category: string;
  prompt: string;
  isPublic?: boolean;
}

// API Response types
export interface AuthResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface QueryAnalysis {
  intent: string;
  entities: string[];
  queryType: "metrics" | "comparison" | "trend" | "distribution" | "correlation";
  timeframe?: string;
  filters?: Record<string, any>;
  suggestedVisualization: "bar" | "line" | "pie" | "scatter" | "area";
}

export interface QueryProcessingResult {
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

export interface ChartInsights {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
}

// Chart configuration types
export interface ChartConfig {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  dataKey?: string;
  nameKey?: string;
  [key: string]: any;
}

// Export types
export interface ExportOptions {
  format: "png" | "pdf" | "svg" | "json";
  width?: number;
  height?: number;
  title?: string;
}

export interface ExportResult {
  data: Buffer | string;
  filename: string;
  contentType: string;
}

// Error types
export interface APIError {
  message: string;
  error?: string;
  statusCode?: number;
}

// UI State types
export interface ChatState {
  isProcessing: boolean;
  inputValue: string;
  suggestions: string[];
}

export interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  darkMode: boolean;
}

// Google Sheets specific types
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range?: string;
  credentials?: any;
}

export interface SheetData {
  headers: string[];
  rows: any[][];
  metadata: {
    spreadsheetId: string;
    sheetName: string;
    range: string;
  };
}

// Usage statistics types
export interface UsageStats {
  queries: {
    used: number;
    limit: number;
  };
  dataProcessed: {
    used: string; // e.g., "1.2 GB"
    limit: string; // e.g., "5 GB"
  };
}

// Recent insights type
export interface RecentInsight {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}
