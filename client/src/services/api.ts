import { apiRequest } from "@/lib/queryClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface QueryRequest {
  query: string;
  conversationId: string;
  dataSourceId?: string;
}

export interface QueryResponse {
  result: {
    insights: {
      summary: string;
      keyInsights: string[];
      recommendations: string[];
    };
    visualization?: {
      type: "bar" | "line" | "pie" | "scatter" | "area";
      data: any;
      config: any;
    };
    queryId: string;
  };
}

export interface DataSourceRequest {
  name: string;
  type: "google_sheets" | "postgresql" | "csv" | "api";
  config: Record<string, any>;
}

export interface ExportRequest {
  chartData: any;
  chartType: string;
  format: "png" | "pdf" | "svg" | "json";
}

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", data);
    return response.json();
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiRequest("POST", "/api/auth/refresh", { refreshToken });
    return response.json();
  },

  me: async (): Promise<{ id: string; username: string; email: string }> => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch("/api/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!response.ok) {
      throw new Error("Not authenticated");
    }
    
    return response.json();
  },
};

// Chat API
export const chatAPI = {
  sendQuery: async (data: QueryRequest): Promise<QueryResponse> => {
    const response = await apiRequest("POST", "/api/chat/query", data);
    return response.json();
  },

  getConversations: async () => {
    const response = await apiRequest("GET", "/api/conversations");
    return response.json();
  },

  createConversation: async (title: string) => {
    const response = await apiRequest("POST", "/api/conversations", { title });
    return response.json();
  },

  getMessages: async (conversationId: string) => {
    const response = await apiRequest("GET", `/api/conversations/${conversationId}/messages`);
    return response.json();
  },

  updateConversation: async (id: string, updates: any) => {
    const response = await apiRequest("PUT", `/api/conversations/${id}`, updates);
    return response.json();
  },

  deleteConversation: async (id: string) => {
    const response = await apiRequest("DELETE", `/api/conversations/${id}`);
    return response.json();
  },
};

// Data Sources API
export const dataSourcesAPI = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/data-sources");
    return response.json();
  },

  create: async (data: DataSourceRequest) => {
    const response = await apiRequest("POST", "/api/data-sources", data);
    return response.json();
  },

  update: async (id: string, updates: Partial<DataSourceRequest>) => {
    const response = await apiRequest("PUT", `/api/data-sources/${id}`, updates);
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiRequest("DELETE", `/api/data-sources/${id}`);
    return response.json();
  },
};

// Export API
export const exportAPI = {
  exportChart: async (data: ExportRequest) => {
    const response = await apiRequest("POST", "/api/export/chart", data);
    return response;
  },
};

// Templates API
export const templatesAPI = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/templates");
    return response.json();
  },

  getByCategory: async (category: string) => {
    const response = await apiRequest("GET", `/api/templates?category=${category}`);
    return response.json();
  },
};

// Health Check
export const healthAPI = {
  check: async () => {
    const response = await apiRequest("GET", "/api/health");
    return response.json();
  },
};
