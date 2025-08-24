import pkg from 'pg';
const { Pool } = pkg;

interface PostgreSQLConfig {
  connectionString: string;
  tableName?: string;
}

export class PostgreSQLService {
  private pools: Map<string, Pool> = new Map();

  private getPool(connectionString: string): Pool {
    if (!this.pools.has(connectionString)) {
      const pool = new Pool({ connectionString });
      this.pools.set(connectionString, pool);
    }
    return this.pools.get(connectionString)!;
  }

  async getPostgreSQLSchema(config: PostgreSQLConfig): Promise<any> {
    const pool = this.getPool(config.connectionString);
    
    try {
      if (config.tableName) {
        // Get schema for specific table
        const query = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `;
        
        const result = await pool.query(query, [config.tableName]);
        
        const columns = result.rows.map(row => ({
          name: row.column_name,
          type: this.mapPostgreSQLType(row.data_type),
          nullable: row.is_nullable === 'YES'
        }));
        
        return { tableName: config.tableName, columns };
      } else {
        // Get list of all tables
        const query = `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `;
        
        const result = await pool.query(query);
        const tables = result.rows.map(row => row.table_name);
        
        return { tables };
      }
    } catch (error) {
      throw new Error(`Failed to get PostgreSQL schema: ${(error as Error).message}`);
    }
  }

  async executeQuery(config: PostgreSQLConfig, query: string): Promise<any[]> {
    const pool = this.getPool(config.connectionString);
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to execute PostgreSQL query: ${(error as Error).message}`);
    }
  }

  async validateConnection(config: PostgreSQLConfig): Promise<boolean> {
    const pool = this.getPool(config.connectionString);
    
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapPostgreSQLType(pgType: string): string {
    const typeMap: Record<string, string> = {
      'integer': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'smallint': 'number',
      'serial': 'number',
      'bigserial': 'number',
      'varchar': 'string',
      'char': 'string',
      'text': 'string',
      'boolean': 'boolean',
      'date': 'date',
      'timestamp': 'date',
      'timestamptz': 'date',
      'time': 'date',
      'timetz': 'date'
    };
    
    return typeMap[pgType] || 'string';
  }

  async cleanup() {
    for (const pool of this.pools.values()) {
      await pool.end();
    }
    this.pools.clear();
  }
}

export const postgresqlService = new PostgreSQLService();