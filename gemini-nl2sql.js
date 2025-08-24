// gemini-nl2sql.js - Módulo para convertir lenguaje natural a SQL usando Gemini

class GeminiNL2SQL {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        
        // Cache del schema real
        this.realSchemaCache = null;
        this.schemaCacheTime = null;
        this.schemaCacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        // Schema de la base de datos para contexto (fallback)
        this.dbSchema = {
            employees: {
                columns: ['employee_id', 'first_name', 'last_name', 'title', 'title_of_courtesy', 'birth_date', 'hire_date', 'address', 'city', 'region', 'postal_code', 'country', 'home_phone', 'extension', 'photo', 'notes', 'reports_to'],
                description: 'Información de empleados de la empresa'
            },
            customers: {
                columns: ['customer_id', 'company_name', 'contact_name', 'contact_title', 'address', 'city', 'region', 'postal_code', 'country', 'phone', 'fax'],
                description: 'Datos de clientes y empresas'
            },
            orders: {
                columns: ['order_id', 'customer_id', 'employee_id', 'order_date', 'required_date', 'shipped_date', 'ship_via', 'freight', 'ship_name', 'ship_address', 'ship_city', 'ship_region', 'ship_postal_code', 'ship_country'],
                description: 'Órdenes y pedidos realizados por clientes'
            },
            order_details: {
                columns: ['order_id', 'product_id', 'unit_price', 'quantity', 'discount'],
                description: 'Detalles específicos de cada orden'
            },
            products: {
                columns: ['product_id', 'product_name', 'supplier_id', 'category_id', 'quantity_per_unit', 'unit_price', 'units_in_stock', 'units_on_order', 'reorder_level', 'discontinued'],
                description: 'Catálogo de productos disponibles'
            },
            categories: {
                columns: ['category_id', 'category_name', 'description'],
                description: 'Categorías de productos'
            },
            suppliers: {
                columns: ['supplier_id', 'company_name', 'contact_name', 'contact_title', 'address', 'city', 'region', 'postal_code', 'country', 'phone', 'fax'],
                description: 'Proveedores de productos'
            },
            shippers: {
                columns: ['shipper_id', 'company_name', 'phone'],
                description: 'Empresas de envío y transporte'
            }
        };
    }

    // Obtener schema con cache y fallback rápido
    async getSchemaWithCache(mcpWebSocket) {
        const now = Date.now();
        
        // Verificar cache válido
        if (this.realSchemaCache && this.schemaCacheTime && 
            (now - this.schemaCacheTime) < this.schemaCacheTimeout) {
            console.log('📋 Usando schema desde cache');
            return this.realSchemaCache;
        }
        
        // Intentar obtener schema fresco con timeout corto
        try {
            console.log('🔍 Obteniendo schema real de la BD via MCP...');
            const freshSchema = await this.getRealSchemaFromMCP(mcpWebSocket);
            
            if (freshSchema) {
                // Actualizar cache
                this.realSchemaCache = freshSchema;
                this.schemaCacheTime = now;
                console.log('✅ Schema real obtenido y guardado en cache');
                return freshSchema;
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo schema MCP:', error.message);
        }
        
        // Fallback al cache anterior si existe
        if (this.realSchemaCache) {
            console.log('📋 Usando schema anterior del cache (expirado pero disponible)');
            return this.realSchemaCache;
        }
        
        // Último fallback: schema estático
        console.log('📋 Usando schema estático como fallback');
        return null;
    }

    // Obtener schema real de la base de datos via MCP
    async getRealSchemaFromMCP(mcpWebSocket) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.warn('⚠️ Timeout obteniendo schema MCP, usando schema estático');
                resolve(null); // Usar fallback en lugar de rechazar
            }, 3000); // Reducido a 3 segundos

            const requestId = Date.now();
            
            const schemaRequest = {
                type: 'mcp-request',
                jsonrpc: "2.0",
                id: requestId,
                method: "tools/call",
                params: {
                    name: "get_schema",
                    arguments: {}
                }
            };

            // Listener temporal para esta respuesta específica
            const handleMessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    
                    if (response.id === requestId) {
                        clearTimeout(timeout);
                        mcpWebSocket.removeEventListener('message', handleMessage);
                        
                        if (response.error) {
                            console.warn('Error obteniendo schema MCP:', response.error.message);
                            resolve(null); // Fallback al schema estático
                        } else if (response.result && response.result.content) {
                            try {
                                const schemaText = response.result.content[0].text;
                                const parsedSchema = this.parseSchemaResponse(schemaText);
                                console.log('✅ Schema real obtenido del MCP');
                                resolve(parsedSchema);
                            } catch (parseError) {
                                console.warn('Error parseando schema:', parseError);
                                resolve(null); // Fallback al schema estático
                            }
                        } else {
                            resolve(null); // Fallback al schema estático
                        }
                    }
                } catch (error) {
                    console.warn('Error procesando respuesta MCP:', error);
                }
            };

            mcpWebSocket.addEventListener('message', handleMessage);
            mcpWebSocket.send(JSON.stringify(schemaRequest));
        });
    }

    // Parsear respuesta de schema del MCP
    parseSchemaResponse(schemaText) {
        try {
            // El schema viene como texto, necesitamos parsearlo
            const lines = schemaText.split('\n');
            const parsedSchema = {};
            let currentTable = null;

            for (const line of lines) {
                const trimmedLine = line.trim();
                
                // Detectar nombre de tabla
                if (trimmedLine.includes('Table:') || trimmedLine.includes('TABLE')) {
                    const tableMatch = trimmedLine.match(/(?:Table:|TABLE)\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
                    if (tableMatch) {
                        currentTable = tableMatch[1].toLowerCase();
                        parsedSchema[currentTable] = {
                            columns: [],
                            description: `Tabla ${currentTable} de la base de datos`
                        };
                    }
                }
                // Detectar columnas
                else if (currentTable && (trimmedLine.includes('|') || trimmedLine.includes('-'))) {
                    const columnMatch = trimmedLine.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\|?\s*/);
                    if (columnMatch && !trimmedLine.includes('---')) {
                        const columnName = columnMatch[1].toLowerCase();
                        if (!parsedSchema[currentTable].columns.includes(columnName)) {
                            parsedSchema[currentTable].columns.push(columnName);
                        }
                    }
                }
            }

            return Object.keys(parsedSchema).length > 0 ? parsedSchema : null;
        } catch (error) {
            console.warn('Error parseando schema MCP:', error);
            return null;
        }
    }

    // Construir prompt con schema real obtenido del MCP
    buildPromptWithRealSchema(naturalQuery, realSchema = null) {
        const schemaToUse = realSchema || this.dbSchema;
        const schemaText = Object.entries(schemaToUse)
            .map(([table, info]) => `${table}: ${info.columns.join(', ')} (${info.description})`)
            .join('\n');

        const schemaSource = realSchema ? "SCHEMA REAL DE LA BASE DE DATOS (obtenido via MCP)" : "SCHEMA DE REFERENCIA";

        return `Eres un experto en SQL que convierte consultas en lenguaje natural a SQL válido.

${schemaSource}:
${schemaText}

REGLAS IMPORTANTES:
1. Genera SOLO la consulta SQL, sin explicaciones adicionales
2. Usa PostgreSQL syntax
3. Para fechas usa funciones como EXTRACT, DATE_TRUNC
4. Para agregaciones usa GROUP BY apropiadamente
5. Limita resultados con LIMIT cuando sea apropiado (máximo 100)
6. Usa JOINs cuando necesites datos de múltiples tablas
7. Para "top N" usa ORDER BY con LIMIT
8. Para conteos por período usa GROUP BY con funciones de fecha
9. USA SOLO las tablas y columnas que aparecen en el schema arriba

EJEMPLOS:
- "Empleados por país" → SELECT country, COUNT(*) as total FROM employees GROUP BY country ORDER BY total DESC
- "Productos más vendidos" → SELECT p.product_name, SUM(od.quantity) as total_vendido FROM products p JOIN order_details od ON p.product_id = od.product_id GROUP BY p.product_id, p.product_name ORDER BY total_vendido DESC LIMIT 10
- "Ventas por mes" → SELECT DATE_TRUNC('month', order_date) as mes, COUNT(*) as pedidos FROM orders GROUP BY mes ORDER BY mes

CONSULTA EN LENGUAJE NATURAL: "${naturalQuery}"

SQL:`;
    }

    // Construir prompt para Gemini (método original como fallback)
    buildPrompt(naturalQuery) {
        const schemaText = Object.entries(this.dbSchema)
            .map(([table, info]) => `${table}: ${info.columns.join(', ')} (${info.description})`)
            .join('\n');

        return `Eres un experto en SQL que convierte consultas en lenguaje natural a SQL válido.

ESQUEMA DE BASE DE DATOS:
${schemaText}

REGLAS IMPORTANTES:
1. Genera SOLO la consulta SQL, sin explicaciones adicionales
2. Usa PostgreSQL syntax
3. Para fechas usa funciones como EXTRACT, DATE_TRUNC
4. Para agregaciones usa GROUP BY apropiadamente
5. Limita resultados con LIMIT cuando sea apropiado (máximo 100)
6. Usa JOINs cuando necesites datos de múltiples tablas
7. Para "top N" usa ORDER BY con LIMIT
8. Para conteos por período usa GROUP BY con funciones de fecha

EJEMPLOS:
- "Empleados por país" → SELECT country, COUNT(*) as total FROM employees GROUP BY country ORDER BY total DESC
- "Productos más vendidos" → SELECT p.product_name, SUM(od.quantity) as total_vendido FROM products p JOIN order_details od ON p.product_id = od.product_id GROUP BY p.product_id, p.product_name ORDER BY total_vendido DESC LIMIT 10
- "Ventas por mes" → SELECT DATE_TRUNC('month', order_date) as mes, COUNT(*) as pedidos FROM orders GROUP BY mes ORDER BY mes

CONSULTA EN LENGUAJE NATURAL: "${naturalQuery}"

SQL:`;
    }

    // Convertir lenguaje natural a SQL
    async convertToSQL(naturalQuery, mcpWebSocket = null) {
        if (!naturalQuery || !naturalQuery.trim()) {
            throw new Error('Consulta vacía');
        }

        try {
            let realSchema = null;
            
            // Paso 1: Intentar obtener schema real (con cache y fallback rápido)
            if (mcpWebSocket && mcpWebSocket.readyState === WebSocket.OPEN) {
                realSchema = await this.getSchemaWithCache(mcpWebSocket);
            }

            // Paso 2: Construir prompt con el mejor schema disponible
            const prompt = this.buildPromptWithRealSchema(naturalQuery, realSchema);
            
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error de Gemini API: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Respuesta inválida de Gemini API');
            }

            let sqlQuery = data.candidates[0].content.parts[0].text.trim();
            
            // Limpiar la respuesta (remover markdown, etc.)
            sqlQuery = this.cleanSQLResponse(sqlQuery);
            
            // Validar SQL básico
            this.validateSQL(sqlQuery);
            
            return sqlQuery;

        } catch (error) {
            console.error('Error en convertToSQL:', error);
            throw new Error(`Error al generar SQL: ${error.message}`);
        }
    }

    // Limpiar respuesta SQL
    cleanSQLResponse(sqlText) {
        // Remover bloques de código markdown
        sqlText = sqlText.replace(/```sql\n?/g, '').replace(/```\n?/g, '');
        
        // Remover saltos de línea excesivos
        sqlText = sqlText.replace(/\n+/g, ' ').trim();
        
        // Asegurar que termine con punto y coma
        if (!sqlText.endsWith(';')) {
            sqlText += ';';
        }
        
        return sqlText;
    }

    // Validación básica de SQL
    validateSQL(sqlQuery) {
        const sql = sqlQuery.toLowerCase().trim();
        
        // Verificar que sea una consulta SELECT
        if (!sql.startsWith('select')) {
            throw new Error('Solo se permiten consultas SELECT');
        }
        
        // Verificar que no contenga comandos peligrosos
        const dangerousCommands = ['drop', 'delete', 'insert', 'update', 'alter', 'create', 'truncate'];
        for (const cmd of dangerousCommands) {
            if (sql.includes(cmd)) {
                throw new Error(`Comando no permitido: ${cmd.toUpperCase()}`);
            }
        }
        
        // Verificar paréntesis balanceados
        const openParens = (sql.match(/\(/g) || []).length;
        const closeParens = (sql.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            throw new Error('Paréntesis no balanceados en la consulta SQL');
        }
        
        return true;
    }

    // Sugerir mejoras para consultas ambiguas
    suggestImprovements(naturalQuery) {
        const suggestions = [];
        
        if (naturalQuery.includes('mejor') || naturalQuery.includes('top')) {
            suggestions.push('Especifica cuántos resultados quieres (ej: "top 10")');
        }
        
        if (naturalQuery.includes('ventas') && !naturalQuery.includes('por')) {
            suggestions.push('Especifica el período o agrupación (ej: "por mes", "por categoría")');
        }
        
        if (naturalQuery.includes('empleado') && naturalQuery.includes('más')) {
            suggestions.push('Especifica qué quieres medir (ej: "más ventas", "más antiguos")');
        }
        
        return suggestions;
    }

    // Obtener consultas de ejemplo basadas en el schema
    getExampleQueries() {
        return [
            {
                natural: "Muestra los empleados por país",
                sql: "SELECT country, COUNT(*) as total_empleados FROM employees GROUP BY country ORDER BY total_empleados DESC;"
            },
            {
                natural: "¿Cuáles son los 10 productos más vendidos?",
                sql: "SELECT p.product_name, SUM(od.quantity) as total_vendido FROM products p JOIN order_details od ON p.product_id = od.product_id GROUP BY p.product_id, p.product_name ORDER BY total_vendido DESC LIMIT 10;"
            },
            {
                natural: "Ventas por categoría de producto",
                sql: "SELECT c.category_name, COUNT(od.order_id) as total_ventas FROM categories c JOIN products p ON c.category_id = p.category_id JOIN order_details od ON p.product_id = od.product_id GROUP BY c.category_id, c.category_name ORDER BY total_ventas DESC;"
            },
            {
                natural: "Evolución de pedidos por mes en 2023",
                sql: "SELECT DATE_TRUNC('month', order_date) as mes, COUNT(*) as total_pedidos FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023 GROUP BY mes ORDER BY mes;"
            },
            {
                natural: "Top 5 clientes con más pedidos",
                sql: "SELECT c.company_name, COUNT(o.order_id) as total_pedidos FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.company_name ORDER BY total_pedidos DESC LIMIT 5;"
            }
        ];
    }
}

// Función global para usar en el frontend
async function convertNaturalLanguageToSQL(naturalQuery, mcpWebSocket = null) {
    const gemini = new GeminiNL2SQL(GEMINI_API_KEY);
    
    try {
        const sql = await gemini.convertToSQL(naturalQuery, mcpWebSocket);
        console.log('SQL generado:', sql);
        return sql;
    } catch (error) {
        console.error('Error en NL2SQL:', error);
        throw error;
    }
}

// Función para obtener sugerencias
function getSuggestions(naturalQuery) {
    const gemini = new GeminiNL2SQL(GEMINI_API_KEY);
    return gemini.suggestImprovements(naturalQuery);
}

// Función para obtener ejemplos
function getExampleQueries() {
    const gemini = new GeminiNL2SQL(GEMINI_API_KEY);
    return gemini.getExampleQueries();
}
