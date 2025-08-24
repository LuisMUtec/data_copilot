import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface CSVConfig {
  filePath: string;
  hasHeader: boolean;
}

interface CSVSchema {
  columns: Array<{
    name: string;
    type: "string" | "number" | "date" | "boolean";
    sampleValues: any[];
  }>;
  rowCount: number;
}

export class CSVService {
  private inferDataType(value: string): "string" | "number" | "date" | "boolean" {
    if (!value || value.trim() === "") return "string";
    
    // Check if it's a number
    if (!isNaN(Number(value))) return "number";
    
    // Check if it's a boolean
    if (value.toLowerCase() === "true" || value.toLowerCase() === "false") return "boolean";
    
    // Check if it's a date
    const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/;
    if (datePattern.test(value) && !isNaN(Date.parse(value))) return "date";
    
    return "string";
  }

  private parseValue(value: string, type: string): any {
    if (!value || value.trim() === "") return null;
    
    switch (type) {
      case "number":
        return Number(value);
      case "boolean":
        return value.toLowerCase() === "true";
      case "date":
        return new Date(value);
      default:
        return value;
    }
  }

  async getCSVSchema(config: CSVConfig): Promise<CSVSchema> {
    console.log('Getting CSV schema for config:', config);
    try {
      if (!fs.existsSync(config.filePath)) {
        throw new Error(`CSV file not found: ${config.filePath}`);
      }

      const fileContent = fs.readFileSync(config.filePath, "utf-8");
      console.log('CSV file content preview:', fileContent.substring(0, 200));
      
      const records: any[] = parse(fileContent, {
        columns: config.hasHeader,
        skip_empty_lines: true,
        trim: true,
      });

      console.log('Parsed CSV records count:', records.length);
      console.log('First record:', records[0]);

      if (records.length === 0) {
        throw new Error("CSV file is empty");
      }

      const schema: CSVSchema = {
        columns: [],
        rowCount: records.length,
      };

      // Get column names
      const firstRecord = records[0];
      const columnNames = config.hasHeader 
        ? Object.keys(firstRecord)
        : Object.keys(firstRecord).map((_, index) => `column_${index + 1}`);

      console.log('Column names detected:', columnNames);

      // Analyze each column
      for (const columnName of columnNames) {
        const columnValues = records
          .slice(0, Math.min(100, records.length)) // Sample first 100 rows
          .map((record: any) => record[columnName])
          .filter((value: any) => value !== null && value !== undefined && value !== "");

        if (columnValues.length === 0) {
          schema.columns.push({
            name: columnName,
            type: "string",
            sampleValues: [],
          });
          continue;
        }

        // Infer type from sample values
        const typeCounts = {
          string: 0,
          number: 0,
          date: 0,
          boolean: 0,
        };

        columnValues.forEach((value: any) => {
          const type = this.inferDataType(String(value));
          typeCounts[type]++;
        });

        // Determine dominant type
        let dominantType: "string" | "number" | "date" | "boolean" = "string";
        let maxCount = 0;
        
        Object.entries(typeCounts).forEach(([type, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantType = type as "string" | "number" | "date" | "boolean";
          }
        });

        schema.columns.push({
          name: columnName,
          type: dominantType,
          sampleValues: columnValues.slice(0, 5), // First 5 sample values
        });
      }

      console.log('Generated schema:', schema);
      return schema;
    } catch (error) {
      console.error('Error getting CSV schema:', error);
      throw new Error(`Failed to analyze CSV schema: ${(error as Error).message}`);
    }
  }

  async executeQuery(config: CSVConfig, query: any): Promise<any[]> {
    console.log('Executing CSV query with config:', config);
    console.log('Query object:', query);
    
    try {
      if (!fs.existsSync(config.filePath)) {
        throw new Error(`CSV file not found: ${config.filePath}`);
      }

      const fileContent = fs.readFileSync(config.filePath, "utf-8");
      let records: any[] = parse(fileContent, {
        columns: config.hasHeader,
        skip_empty_lines: true,
        trim: true,
      });

      console.log('Total records loaded:', records.length);

      // Get schema for type conversion
      const schema = await this.getCSVSchema(config);
      
      // Convert values according to their types
      records = records.map((record: any) => {
        const convertedRecord: any = {};
        for (const column of schema.columns) {
          const value = record[column.name];
          convertedRecord[column.name] = this.parseValue(value, column.type);
        }
        return convertedRecord;
      });

      // Apply basic filtering based on query
      let filteredRecords = records;

      if (query.filters && Array.isArray(query.filters)) {
        console.log('Applying filters:', query.filters);
        for (const filter of query.filters) {
          if (filter.column && filter.operator && filter.value !== undefined) {
            const beforeCount = filteredRecords.length;
            filteredRecords = filteredRecords.filter((record: any) => {
              const fieldValue = record[filter.column];
              
              switch (filter.operator) {
                case "equals":
                  return fieldValue === filter.value;
                case "contains":
                  return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
                case "greater_than":
                  return Number(fieldValue) > Number(filter.value);
                case "less_than":
                  return Number(fieldValue) < Number(filter.value);
                case "greater_equal":
                  return Number(fieldValue) >= Number(filter.value);
                case "less_equal":
                  return Number(fieldValue) <= Number(filter.value);
                case "starts_with":
                  return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
                case "ends_with":
                  return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
                case "date_after":
                  return new Date(fieldValue) > new Date(filter.value);
                case "date_before":
                  return new Date(fieldValue) < new Date(filter.value);
                case "date_equals":
                  const recordDate = new Date(fieldValue);
                  const filterDate = new Date(filter.value);
                  return recordDate.toDateString() === filterDate.toDateString();
                case "year_equals":
                  return new Date(fieldValue).getFullYear() === Number(filter.value);
                default:
                  return true;
              }
            });
            console.log(`Filter ${filter.column} ${filter.operator} ${filter.value}: ${beforeCount} -> ${filteredRecords.length}`);
          }
        }
      }

      console.log('Records after filtering:', filteredRecords.length);

      // If no aggregations, return filtered records
      if (!query.aggregations || query.aggregations.length === 0) {
        // Apply limit
        if (query.limit && query.limit > 0) {
          filteredRecords = filteredRecords.slice(0, query.limit);
        }
        
        console.log('Returning filtered records:', filteredRecords.length);
        return filteredRecords;
      }

      // Apply grouping if specified
      if (query.groupBy && query.aggregations) {
        const grouped: any = {};
        
        filteredRecords.forEach((record: any) => {
          const groupKey = Array.isArray(query.groupBy) 
            ? query.groupBy.map((col: any) => record[col]).join('|')
            : record[query.groupBy];
            
          if (!grouped[groupKey]) {
            grouped[groupKey] = [];
          }
          grouped[groupKey].push(record);
        });

        filteredRecords = Object.entries(grouped).map(([groupKey, groupRecords]) => {
          const result: any = {};
          
          // Add group by fields
          if (Array.isArray(query.groupBy)) {
            query.groupBy.forEach((col: any, index: any) => {
              result[col] = groupKey.split('|')[index];
            });
          } else {
            result[query.groupBy] = groupKey;
          }

          // Apply aggregations
          for (const aggregation of query.aggregations) {
            const values = (groupRecords as any[]).map((record: any) => Number(record[aggregation.column])).filter((v: any) => !isNaN(v));
            
            switch (aggregation.function) {
              case "sum":
                result[`${aggregation.function}_${aggregation.column}`] = values.reduce((a, b) => a + b, 0);
                break;
              case "avg":
                result[`${aggregation.function}_${aggregation.column}`] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                break;
              case "count":
                result[`${aggregation.function}_${aggregation.column}`] = (groupRecords as any[]).length;
                break;
              case "max":
                result[`${aggregation.function}_${aggregation.column}`] = values.length > 0 ? Math.max(...values) : 0;
                break;
              case "min":
                result[`${aggregation.function}_${aggregation.column}`] = values.length > 0 ? Math.min(...values) : 0;
                break;
            }
          }
          
          return result;
        });
      } else if (query.aggregations && query.aggregations.length > 0) {
        // Simple aggregation without grouping
        const result: any = {};
        
        for (const aggregation of query.aggregations) {
          if (aggregation.function === "count") {
            result[`${aggregation.function}_${aggregation.column}`] = filteredRecords.length;
          } else {
            const values = filteredRecords.map((record: any) => Number(record[aggregation.column])).filter((v: any) => !isNaN(v));
            
            switch (aggregation.function) {
              case "sum":
                result[`${aggregation.function}_${aggregation.column}`] = values.reduce((a, b) => a + b, 0);
                break;
              case "avg":
                result[`${aggregation.function}_${aggregation.column}`] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                break;
              case "max":
                result[`${aggregation.function}_${aggregation.column}`] = values.length > 0 ? Math.max(...values) : 0;
                break;
              case "min":
                result[`${aggregation.function}_${aggregation.column}`] = values.length > 0 ? Math.min(...values) : 0;
                break;
            }
          }
        }
        
        filteredRecords = [result];
      }

      // Apply sorting
      if (query.orderBy) {
        filteredRecords.sort((a, b) => {
          const aValue = a[query.orderBy.column];
          const bValue = b[query.orderBy.column];
          
          if (query.orderBy.direction === "desc") {
            return bValue > aValue ? 1 : -1;
          } else {
            return aValue > bValue ? 1 : -1;
          }
        });
      }

      // Apply limit
      if (query.limit && query.limit > 0) {
        filteredRecords = filteredRecords.slice(0, query.limit);
      }

      // Select specific columns if specified (skip for aggregated results)
      if (query.select && Array.isArray(query.select) && query.select[0] !== "*" && (!query.aggregations || query.aggregations.length === 0)) {
        filteredRecords = filteredRecords.map((record: any) => {
          const selectedRecord: any = {};
          for (const column of query.select) {
            selectedRecord[column] = record[column];
          }
          return selectedRecord;
        });
      }

      console.log('Final result:', filteredRecords);
      return filteredRecords;
    } catch (error) {
      console.error('Error executing CSV query:', error);
      throw new Error(`Failed to execute CSV query: ${(error as Error).message}`);
    }
  }

  async validateConnection(config: CSVConfig): Promise<boolean> {
    try {
      if (!config.filePath) return false;
      
      // Check if file exists
      if (!fs.existsSync(config.filePath)) return false;
      
      // Check if file is readable
      fs.accessSync(config.filePath, fs.constants.R_OK);
      
      // Try to parse the first few lines
      const fileContent = fs.readFileSync(config.filePath, "utf-8");
      const lines = fileContent.split('\n').slice(0, 5).join('\n');
      parse(lines, { columns: config.hasHeader, skip_empty_lines: true });
      
      return true;
    } catch (error) {
      console.error("CSV validation error:", error);
      return false;
    }
  }
}

export const csvService = new CSVService();