# 🔗 MCP PostgreSQL Analytics - Dashboard Inteligente

Implementación completa del Model Context Protocol (MCP) con dashboard de analytics que acepta consultas en lenguaje natural y genera gráficos automáticamente.

## 🚀 Inicio Rápido

```bash
# Opción 1: Inicio automático completo (recomendado)
npm run mcp:start

# Opción 2: Solo Analytics Dashboard
npm run analytics

# Opción 3: Manual
npm start
```

## 🏗️ Arquitectura Completa

```
Administrador
    ↓ "Quiero ver reservas por mes"
Frontend (UI) - Lenguaje Natural
    ↓ WebSocket
Agente LLM (Gemini AI)
    ↓ Convierte a SQL
Postgres-MCP Server
    ↓ Ejecuta consulta
Base de Datos PostgreSQL
    ↓ Retorna datos estructurados (JSON)
Motor de Gráficos (Chart.js/Recharts)
    ↓ Renderiza gráfico dinámico
Frontend (UI) - Visualización
```

## 📁 Archivos del Sistema

```
mcp-analytics/
├── 🌐 frontend-analytics.html     # Dashboard principal con UI moderna
├── 🤖 gemini-nl2sql.js           # Integración Gemini para NL→SQL
├── 📊 chart-engine.js             # Motor de gráficos Chart.js
├── 🔄 data-transformer.js         # Transformador de datos MCP→Charts
├── 📄 mcp-websocket-proxy.js      # Proxy WebSocket MCP
├── 📄 mcp-postgres-server.js      # Servidor MCP real
├── 🌐 client-mcp-direct.html      # Cliente MCP básico
├── 📄 database.js                 # Conexión PostgreSQL
├── 📄 .env                        # Variables de entorno + Gemini API
├── 🔧 start-mcp-analytics.ps1     # Script de inicio analytics
└── 📚 README.md                   # Este archivo
```

## 🔧 Configuración

Archivo `.env`:
```env
DATABASE_URI=postgresql://postgres.zdbrjkqbolnzvbqpnhhz:data-copilot@aws-1-us-east-2.pooler.supabase.com:6543/postgres
DATABASE_URL=postgresql://postgres.zdbrjkqbolnzvbqpnhhz:data-copilot@aws-1-us-east-2.pooler.supabase.com:6543/postgres

# Gemini API Configuration
GEMINI_API_KEY=AIzaSyA3e8v6QI88u6b_jyUQQY8W2peT5E4uHmg
```

## 🎯 ¿Cómo Funciona?

### 1. **Consulta en Lenguaje Natural**
```
Usuario: "Muestra los empleados por país"
```

### 2. **Conversión con Gemini AI**
```sql
SELECT country, COUNT(*) as total_empleados 
FROM employees 
GROUP BY country 
ORDER BY total_empleados DESC;
```

### 3. **Ejecución via MCP**
```
WebSocket → MCP Server → PostgreSQL → Resultados JSON
```

### 4. **Visualización Automática**
```
Datos → Transformador → Chart.js → Gráfico Interactivo
```

## 🛠️ Herramientas y Características

### 🤖 **Agente LLM (Gemini)**
- Conversión inteligente de lenguaje natural a SQL
- Validación de consultas generadas
- Soporte para consultas complejas con JOINs
- Manejo de fechas, agregaciones y filtros

### 📊 **Motor de Gráficos**
- **Tipos soportados**: Barras, Líneas, Circular, Dona, Dispersión, Radar
- **Interactividad**: Hover, zoom, exportación PNG
- **Responsive**: Adaptable a diferentes pantallas
- **Animaciones**: Transiciones suaves

### 🔄 **Transformador de Datos**
- **Auto-detección**: Reconoce tipos de datos automáticamente
- **Series temporales**: Gráficos de evolución temporal
- **Datos categóricos**: Distribuciones y comparaciones
- **Métricas automáticas**: Total, promedio, máximo, mínimo

### 🌐 **Frontend Moderno**
- **Chat interface**: Para consultas en lenguaje natural
- **Panel de gráficos**: Visualización en tiempo real
- **Métricas rápidas**: KPIs automáticos
- **Ejemplos integrados**: Consultas predefinidas

## 🔗 Enlaces y Puertos

- **Analytics Dashboard**: `file://frontend-analytics.html`
- **Cliente MCP Básico**: `file://client-mcp-direct.html`
- **Estado MCP**: http://localhost:3002/mcp-status
- **WebSocket Endpoint**: ws://localhost:3002

## 📊 Consultas de Ejemplo

### 📈 **Análisis de Empleados**
```
"Muestra los empleados por país"
"¿Cuántos empleados hay en cada región?"
"Empleados contratados por año"
```

### 🛒 **Análisis de Ventas**
```
"¿Cuáles son los productos más vendidos?"
"Ventas por categoría de producto"
"Evolución de pedidos por mes"
```

### 👥 **Análisis de Clientes**
```
"Top 10 clientes con más pedidos"
"Distribución de clientes por país"
"Clientes más activos este año"
```

### 📦 **Análisis de Productos**
```
"Productos con mayor stock"
"Categorías más populares"
"Productos descontinuados"
```

## 🎨 Tipos de Gráficos Disponibles

| Tipo | Ideal Para | Ejemplo |
|------|------------|---------|
| 📊 **Barras** | Comparaciones categóricas | Empleados por país |
| 📈 **Líneas** | Series temporales | Ventas por mes |
| 🥧 **Circular** | Distribuciones (≤8 categorías) | Productos por categoría |
| 🍩 **Dona** | Proporciones con centro libre | Participación de mercado |

## 🚀 Flujo de Trabajo Completo

1. **Usuario** escribe consulta en lenguaje natural
2. **Gemini AI** convierte la consulta a SQL válido
3. **MCP WebSocket Proxy** envía la consulta al servidor MCP
4. **MCP PostgreSQL Server** ejecuta la consulta en la base de datos
5. **PostgreSQL** retorna los datos estructurados
6. **Data Transformer** adapta los datos para gráficos
7. **Chart Engine** genera la visualización con Chart.js
8. **Frontend** muestra el gráfico y métricas automáticas

## 🔧 Comandos Útiles

```bash
# Iniciar sistema completo
npm run mcp:start

# Solo abrir dashboard
npm run analytics

# Solo abrir cliente MCP básico
npm run client

# Solo proxy WebSocket
npm run proxy

# Solo servidor MCP
npm run server
```

## 🎯 Características Técnicas

### ✅ **MCP Real**
- Protocolo JSON-RPC 2.0 completo
- Conexión stdio nativa (como Claude Desktop)
- Herramientas MCP: execute_query, describe_table, get_schema

### ✅ **Gemini AI**
- API key integrada
- Prompt engineering optimizado para SQL
- Validación de consultas generadas
- Manejo de errores inteligente

### ✅ **Chart.js Avanzado**
- Múltiples tipos de gráficos
- Animaciones y transiciones
- Exportación de imágenes
- Configuración responsive

### ✅ **WebSocket en Tiempo Real**
- Comunicación bidireccional
- Reconexión automática
- Estado de conexión visual
- Manejo de errores robusto

## 📖 Documentación Adicional

- Ver `MCP-DIRECT-README.md` para detalles técnicos del MCP
- Código fuente completamente documentado
- Ejemplos de uso en cada módulo

---
*🔗 Dashboard MCP Analytics - Lenguaje Natural → SQL → Gráficos*
*Compatible con protocolo Claude Desktop • Powered by Gemini AI • Chart.js*
