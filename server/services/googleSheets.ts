import { google } from "googleapis";

interface GoogleSheetsConfig {
  spreadsheetId: string;
  range?: string;
  credentials?: any;
}

interface SheetData {
  headers: string[];
  rows: any[][];
  metadata: {
    spreadsheetId: string;
    sheetName: string;
    range: string;
  };
}

export class GoogleSheetsService {
  private sheets: any;

  constructor() {
    // Initialize with service account or OAuth credentials
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS 
      ? JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
      : undefined;

    if (credentials) {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
    }
  }

  async validateConnection(config: GoogleSheetsConfig): Promise<boolean> {
    try {
      if (!this.sheets) {
        throw new Error("Google Sheets not initialized - missing credentials");
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: config.spreadsheetId,
      });

      return !!response.data;
    } catch (error) {
      console.error("Google Sheets connection validation failed:", error);
      return false;
    }
  }

  async getSheetData(config: GoogleSheetsConfig): Promise<SheetData> {
    try {
      if (!this.sheets) {
        throw new Error("Google Sheets not initialized - missing credentials");
      }

      const range = config.range || 'A:Z';
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      
      if (values.length === 0) {
        return {
          headers: [],
          rows: [],
          metadata: {
            spreadsheetId: config.spreadsheetId,
            sheetName: 'Sheet1',
            range,
          },
        };
      }

      const headers = values[0] || [];
      const rows = values.slice(1);

      return {
        headers,
        rows,
        metadata: {
          spreadsheetId: config.spreadsheetId,
          sheetName: this.extractSheetName(range),
          range,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch sheet data: ${(error as Error).message}`);
    }
  }

  async getSheetSchema(config: GoogleSheetsConfig): Promise<any> {
    try {
      const data = await this.getSheetData(config);
      
      if (data.headers.length === 0) {
        return { columns: [] };
      }

      // Analyze first few rows to determine column types
      const sampleRows = data.rows.slice(0, 10);
      const columns = data.headers.map((header, index) => {
        const sampleValues = sampleRows
          .map(row => row[index])
          .filter(val => val !== undefined && val !== null && val !== '');

        const type = this.inferColumnType(sampleValues);
        
        return {
          name: header,
          type,
          index,
        };
      });

      return {
        columns,
        spreadsheetId: config.spreadsheetId,
        sheetName: data.metadata.sheetName,
        totalRows: data.rows.length,
      };
    } catch (error) {
      throw new Error(`Failed to analyze sheet schema: ${(error as Error).message}`);
    }
  }

  async executeQuery(config: GoogleSheetsConfig, query: string): Promise<any[]> {
    try {
      // For Google Sheets, we'll interpret the query as a range or filter operation
      // This is a simplified implementation - in a full system you might want to support
      // more complex query operations
      
      const data = await this.getSheetData(config);
      
      // Simple implementation: if query contains filtering logic, apply it
      // Otherwise, return all data
      if (query.toLowerCase().includes('where') || query.toLowerCase().includes('filter')) {
        // This would need more sophisticated parsing in a real implementation
        return this.applySimpleFilters(data, query);
      }

      // Convert rows to objects using headers
      return data.rows.map(row => {
        const obj: any = {};
        data.headers.forEach((header, index) => {
          obj[header] = row[index] || null;
        });
        return obj;
      });
    } catch (error) {
      throw new Error(`Failed to execute query: ${(error as Error).message}`);
    }
  }

  private extractSheetName(range: string): string {
    const parts = range.split('!');
    return parts.length > 1 ? parts[0] : 'Sheet1';
  }

  private inferColumnType(values: any[]): string {
    if (values.length === 0) return 'text';

    const numericCount = values.filter(val => !isNaN(parseFloat(val)) && isFinite(val)).length;
    const dateCount = values.filter(val => !isNaN(Date.parse(val))).length;

    const numericRatio = numericCount / values.length;
    const dateRatio = dateCount / values.length;

    if (numericRatio > 0.8) return 'number';
    if (dateRatio > 0.8) return 'date';
    return 'text';
  }

  private applySimpleFilters(data: SheetData, query: string): any[] {
    // Simplified filtering - in a real implementation, you'd parse the query properly
    const rows = data.rows.map(row => {
      const obj: any = {};
      data.headers.forEach((header, index) => {
        obj[header] = row[index] || null;
      });
      return obj;
    });

    // This is a very basic implementation
    // A full implementation would parse SQL-like syntax or natural language
    return rows;
  }
}

export const googleSheetsService = new GoogleSheetsService();
