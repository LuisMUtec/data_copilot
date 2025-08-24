# 🔗 Cliente MCP Directo - Conexión Como Claude Desktop

Esta implementación permite al cliente web conectarse directamente al MCP (Model Context Protocol) de la misma manera que lo hace Claude Desktop, sin intermediarios.

## 🎯 ¿Qué es esto?

Este cliente replica la experiencia de **Claude Desktop** cuando se conecta a un servidor MCP:

1. **Conexión directa**: WebSocket + JSON-RPC al servidor MCP
2. **Protocolo MCP**: Mismo protocolo que usa Claude Desktop  
3. **Herramientas MCP**: Acceso directo a `execute_query`, `describe_table`, `get_schema`
4. **Procesamiento MCP**: Los datos son procesados por el MCP, no por un backend intermedio

## 🏗️ Arquitectura

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Cliente Web       │    │   Claude Desktop    │    │   Cliente CLI       │
│   (WebSocket)       │    │   (stdio/SSE)       │    │   (stdio)           │
└─────────┬───────────┘    └─────────┬───────────┘    └─────────┬───────────┘
          │                          │                          │
          │ JSON-RPC                 │ JSON-RPC                 │ JSON-RPC
          │ WebSocket                │ MCP Protocol             │ stdio
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCP WebSocket Proxy                                 │
│                     (mcp-websocket-proxy.js)                               │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ JSON-RPC stdio
                                  ▼
                    ┌─────────────────────────────┐
                    │      MCP PostgreSQL Server  │
                    │    (mcp-postgres-server.js) │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │       PostgreSQL            │
                    │       (Supabase)            │
                    └─────────────────────────────┘
```

## 🚀 Inicio Rápido

### Opción 1: Script Automático
```powershell
# Iniciar todo automáticamente
powershell -ExecutionPolicy Bypass -File start-mcp-client.ps1
```

### Opción 2: Manual
```bash
# 1. Iniciar proxy MCP
npm run mcp:proxy
# O
node mcp-websocket-proxy.js

# 2. Abrir cliente web
npm run client:mcp
# O abrir: http://localhost:3002/client-mcp-direct.html
```

## 🔧 Componentes

### 1. MCP WebSocket Proxy (`mcp-websocket-proxy.js`)
- **Función**: Bridge entre WebSocket y stdio MCP
- **Puerto**: 3002
- **Protocolo**: WebSocket → JSON-RPC → stdio
- **Características**:
  - Maneja múltiples clientes web simultáneos
  - Convierte WebSocket a comunicación stdio MCP
  - Sirve archivos estáticos
  - Endpoint de estado: `/mcp-status`

### 2. MCP PostgreSQL Server (`mcp-postgres-server.js`)  
- **Función**: Servidor MCP real que procesa consultas
- **Protocolo**: JSON-RPC sobre stdio
- **Herramientas disponibles**:
  - `execute_query` - Ejecutar consultas SQL
  - `describe_table` - Describir estructura de tabla
  - `get_schema` - Obtener esquema completo

### 3. Cliente Web MCP (`client-mcp-direct.html`)
- **Función**: Interfaz web que se conecta directamente al MCP
- **Conexión**: WebSocket a `ws://localhost:3002`
- **Características**:
  - Conexión en tiempo real al MCP
  - Herramientas MCP como botones clickeables
  - Métricas de rendimiento
  - Estado de conexión visual
  - Análisis con Google AI preparado

## 🛠️ Herramientas MCP Disponibles

### `execute_query`
```javascript
// Ejecutar consulta SQL personalizada
await sendMCPRequest('tools/call', {
    name: 'execute_query',
    arguments: { query: 'SELECT * FROM employees LIMIT 5;' }
});
```

### `describe_table`
```javascript
// Describir estructura de una tabla
await sendMCPRequest('tools/call', {
    name: 'describe_table', 
    arguments: { table_name: 'employees' }
});
```

### `get_schema`
```javascript
// Obtener esquema completo de la base de datos
await sendMCPRequest('tools/call', {
    name: 'get_schema',
    arguments: {}
});
```

## 🔍 Flujo de Datos

1. **Cliente Web** envía mensaje WebSocket:
   ```json
   {
     "type": "mcp-request",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "execute_query",
       "arguments": { "query": "SELECT * FROM employees;" }
     }
   }
   ```

2. **Proxy WebSocket** convierte a JSON-RPC stdio:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call", 
     "params": {
       "name": "execute_query",
       "arguments": { "query": "SELECT * FROM employees;" }
     }
   }
   ```

3. **MCP Server** procesa y responde:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "result": {
       "content": [
         {
           "type": "text",
           "text": "{\"success\": true, \"rows\": [...], \"rowCount\": 5}"
         }
       ]
     }
   }
   ```

4. **Proxy** convierte de vuelta a WebSocket:
   ```json
   {
     "type": "mcp-response",
     "id": 1,
     "success": true,
     "result": { "content": [...] }
   }
   ```

## 🎨 Interfaz Web

### Características visuales:
- ✅ **Estado MCP en tiempo real**: Indicador visual de conexión
- ✅ **Herramientas como botones**: Click directo en herramientas MCP
- ✅ **Métricas de rendimiento**: Contador de requests, tiempo de respuesta, errores
- ✅ **Resultados estructurados**: Tablas, esquemas, y JSON formateado
- ✅ **Análisis AI**: Integración preparada con Google AI

### Métricas disponibles:
- **Consultas**: Número total de requests al MCP
- **Tiempo Resp.**: Tiempo promedio de respuesta
- **Errores**: Contador de errores de conexión/MCP

## 🤖 Integración Google AI

El cliente incluye funcionalidad preparada para analizar resultados con Google AI:

```javascript
const GOOGLE_API_KEY = 'AIzaSyA3e8v6QI88u6b_jyUQQY8W2peT5E4uHmg';

async function analyzeWithAI() {
    // 1. Ejecutar consulta con MCP
    const queryResult = await sendMCPRequest('tools/call', {
        name: 'execute_query',
        arguments: { query }
    });

    // 2. Analizar con Google AI
    const analysis = await analyzeDataWithGoogleAI(queryResult);
    
    // 3. Mostrar insights y recomendaciones
    displayAIAnalysis(analysis, queryResult);
}
```

## 🔧 Configuración

### Variables de entorno necesarias:
```env
DATABASE_URI=postgresql://postgres.zdbrjkqbolnzvbqpnhhz:data-copilot@aws-1-us-east-2.pooler.supabase.com:6543/postgres
DATABASE_URL=postgresql://postgres.zdbrjkqbolnzvbqpnhhz:data-copilot@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

### Puertos utilizados:
- **3002**: MCP WebSocket Proxy
- **3001**: Backend Express (opcional, no usado por cliente MCP)

## 🐛 Solución de Problemas

### Cliente no se conecta:
1. Verificar que el proxy esté corriendo: `http://localhost:3002/mcp-status`
2. Revisar consola del navegador para errores WebSocket
3. Verificar que el puerto 3002 esté disponible

### MCP Server no responde:
1. Verificar variables de entorno en `.env`
2. Probar conexión a PostgreSQL: `npm test`
3. Revisar logs del proxy: salida de `node mcp-websocket-proxy.js`

### Errores de herramientas MCP:
1. Verificar que la sintaxis SQL sea correcta
2. Confirmar que las tablas existan en la base de datos
3. Revisar permisos de la base de datos

## 📊 Comparación con Claude Desktop

| Característica | Claude Desktop | Cliente Web MCP |
|----------------|----------------|-----------------|
| **Protocolo** | JSON-RPC stdio/SSE | JSON-RPC WebSocket |
| **Conexión** | Directa al MCP | Via Proxy WebSocket |
| **Herramientas** | Todas las MCP | execute_query, describe_table, get_schema |
| **Interfaz** | Chat conversacional | Interfaz web específica |
| **Configuración** | claude_desktop_config.json | Automática |
| **Datos** | Procesados por MCP | Procesados por MCP |

## 🚀 Ventajas de esta Implementación

1. **✅ Experiencia similar a Claude Desktop**: Mismo protocolo y procesamiento
2. **✅ Conexión directa**: Sin intermediarios backend complicados  
3. **✅ Tiempo real**: WebSocket para comunicación instantánea
4. **✅ Múltiples clientes**: Soporte para varios navegadores simultáneos
5. **✅ Desarrollo amigable**: Interfaz web moderna y debuggeable
6. **✅ Extensible**: Fácil agregar más herramientas MCP

## 🔗 Enlaces Útiles

- **Cliente MCP**: http://localhost:3002/client-mcp-direct.html
- **Estado MCP**: http://localhost:3002/mcp-status  
- **WebSocket Endpoint**: ws://localhost:3002
- **Documentación MCP**: [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)

---
*Conexión directa al MCP - Como Claude Desktop, pero en el navegador*
