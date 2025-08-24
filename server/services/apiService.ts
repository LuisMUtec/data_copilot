interface APIConfig {
  apiUrl: string;
  apiKey?: string;
  method: 'GET' | 'POST';
}

export class APIService {
  async getAPISchema(config: APIConfig): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.apiUrl, {
        method: config.method,
        headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Infer schema from the response structure
      if (Array.isArray(data) && data.length > 0) {
        const sample = data[0];
        const columns = Object.keys(sample).map(key => ({
          name: key,
          type: this.inferType(sample[key])
        }));
        return { columns };
      }

      // If it's an object, treat each key as a column
      const columns = Object.keys(data).map(key => ({
        name: key,
        type: this.inferType(data[key])
      }));
      
      return { columns };
    } catch (error) {
      throw new Error(`Failed to get API schema: ${(error as Error).message}`);
    }
  }

  async executeQuery(config: APIConfig, query: string): Promise<any[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.apiUrl, {
        method: config.method,
        headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Return as array if it's already an array, otherwise wrap in array
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error(`Failed to execute API query: ${(error as Error).message}`);
    }
  }

  async validateConnection(config: APIConfig): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.apiUrl, {
        method: 'HEAD', // Use HEAD to just check connectivity
        headers
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private inferType(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    return 'string';
  }
}

export const apiService = new APIService();