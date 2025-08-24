# 🔗 MCP PostgreSQL - Implementación Directa

Implementación directa del Model Context Protocol (MCP) para PostgreSQL con cliente web.

## 🚀 Inicio Rápido

```bash
# Opción 1: Inicio automático (recomendado)
npm run mcp:start

# Opción 2: Manual
npm start
```

## 📁 Archivos Esenciales

```
mcp-postgres/
├── 📄 mcp-websocket-proxy.js     # Proxy WebSocket MCP
├── 📄 mcp-postgres-server.js     # Servidor MCP real
├── 🌐 client-mcp-direct.html     # Cliente web MCP
├── 📄 database.js                # Conexión PostgreSQL
├── 📄 package.json               # Dependencias mínimas
├── 📄 .env                       # Variables de entorno
├── 🔧 start-mcp-client.ps1       # Script de inicio
├── 📚 MCP-DIRECT-README.md       # Documentación detallada
└── 📚 README.md                  # Este archivo
```

## 🔧 Configuración

Archivo `.env`:
```env
DATABASE_URI=postgresql://postgres.zdbrjkqbolnzvbqpnhhz:data-copilot@aws-1-us-east-2.pooler.supabase.com:6543/postgres
DATABASE_URL=postgresql://postgres.zdbrjkqbolnzvbqpnhhz:data-copilot@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

## 🎯 ¿Cómo funciona?

```
Cliente Web (localhost:3002/client-mcp-direct.html)
    ↓ WebSocket
MCP WebSocket Proxy (puerto 3002)
    ↓ JSON-RPC stdio
MCP PostgreSQL Server (protocolo MCP real)
    ↓ SQL
PostgreSQL Database (Supabase)
```

## 🛠️ Herramientas MCP

- **execute_query** - Ejecutar consultas SQL
- **describe_table** - Describir estructura de tabla  
- **get_schema** - Obtener esquema completo

## 🔗 Enlaces

- **Cliente MCP**: http://localhost:3002/client-mcp-direct.html
- **Estado**: http://localhost:3002/mcp-status
- **WebSocket**: ws://localhost:3002

## 📖 Documentación

Ver `MCP-DIRECT-README.md` para documentación completa.

---
*Implementación MCP real - Compatible con protocolo Claude Desktop*
