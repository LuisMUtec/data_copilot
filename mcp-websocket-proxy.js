const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const cors = require('cors');

class MCPWebSocketProxy {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        this.mcpProcess = null;
        this.mcpStdin = null;
        this.mcpReadline = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.connectedClients = new Set();
        
        this.setupExpress();
        this.setupWebSocket();
        this.startMCPServer();
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Servir archivos estáticos
        this.app.use(express.static('.'));
        
        // Endpoint de estado
        this.app.get('/mcp-status', (req, res) => {
            res.json({
                status: this.mcpProcess ? 'running' : 'stopped',
                clients: this.connectedClients.size,
                pendingRequests: this.pendingRequests.size
            });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔗 Cliente web conectado al MCP proxy');
            this.connectedClients.add(ws);

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleClientMessage(ws, message);
                } catch (error) {
                    console.error('Error procesando mensaje del cliente:', error);
                    ws.send(JSON.stringify({
                        error: 'Invalid message format',
                        details: error.message
                    }));
                }
            });

            ws.on('close', () => {
                console.log('🔌 Cliente web desconectado del MCP proxy');
                this.connectedClients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('Error en WebSocket:', error);
                this.connectedClients.delete(ws);
            });

            // Enviar mensaje de bienvenida
            ws.send(JSON.stringify({
                type: 'welcome',
                message: 'Conectado al MCP PostgreSQL Proxy',
                capabilities: ['execute_query', 'describe_table', 'get_schema']
            }));
        });
    }

    async startMCPServer() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Iniciando MCP PostgreSQL Server...');
            
            // Configuración del entorno
            const env = {
                ...process.env,
                POSTGRES_CONNECTION_STRING: process.env.DATABASE_URI || process.env.DATABASE_URL
            };

            // Ejecutar el MCP server
            this.mcpProcess = spawn('node', ['mcp-postgres-server.js'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: env,
                cwd: process.cwd()
            });

            this.mcpProcess.on('error', (error) => {
                console.error('❌ Error al iniciar MCP Server:', error.message);
                reject(error);
            });

            this.mcpProcess.stderr.on('data', (data) => {
                console.error('MCP Server:', data.toString().trim());
            });

            // Configurar comunicación JSON-RPC
            this.mcpReadline = readline.createInterface({
                input: this.mcpProcess.stdout,
                crlfDelay: Infinity
            });

            this.mcpReadline.on('line', (line) => {
                try {
                    const response = JSON.parse(line);
                    this.handleMCPResponse(response);
                } catch (error) {
                    console.error('Error parsing MCP response:', error.message);
                }
            });

            this.mcpStdin = this.mcpProcess.stdin;

            // Inicializar el protocolo MCP
            setTimeout(async () => {
                await this.initializeMCP();
                resolve();
            }, 1000);
        });
    }

    async initializeMCP() {
        const initRequest = {
            jsonrpc: '2.0',
            id: ++this.requestId,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    resources: {},
                    tools: {}
                },
                clientInfo: {
                    name: 'mcp-websocket-proxy',
                    version: '1.0.0'
                }
            }
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(initRequest.id, { resolve, reject, type: 'init' });
            this.mcpStdin.write(JSON.stringify(initRequest) + '\n');
            
            setTimeout(() => {
                if (this.pendingRequests.has(initRequest.id)) {
                    this.pendingRequests.delete(initRequest.id);
                    reject(new Error('MCP initialization timeout'));
                }
            }, 10000);
        });
    }

    async handleClientMessage(ws, message) {
        const { type, method, params, id: clientId } = message;

        if (type === 'mcp-request') {
            const mcpRequest = {
                jsonrpc: '2.0',
                id: ++this.requestId,
                method: method,
                params: params || {}
            };

            // Guardar la información del cliente para la respuesta
            this.pendingRequests.set(mcpRequest.id, {
                clientWs: ws,
                clientId: clientId,
                resolve: (result) => {
                    ws.send(JSON.stringify({
                        type: 'mcp-response',
                        id: clientId,
                        success: true,
                        result: result
                    }));
                },
                reject: (error) => {
                    ws.send(JSON.stringify({
                        type: 'mcp-response',
                        id: clientId,
                        success: false,
                        error: error.message || error
                    }));
                }
            });

            // Enviar solicitud al MCP server
            this.mcpStdin.write(JSON.stringify(mcpRequest) + '\n');

            // Timeout de seguridad
            setTimeout(() => {
                if (this.pendingRequests.has(mcpRequest.id)) {
                    const pending = this.pendingRequests.get(mcpRequest.id);
                    this.pendingRequests.delete(mcpRequest.id);
                    pending.reject(new Error('Request timeout'));
                }
            }, 30000);
        }
    }

    handleMCPResponse(response) {
        const { id } = response;
        
        if (this.pendingRequests.has(id)) {
            const { resolve, reject, type } = this.pendingRequests.get(id);
            this.pendingRequests.delete(id);

            if (response.error) {
                reject(new Error(response.error.message || 'MCP Error'));
            } else {
                if (type === 'init') {
                    console.log('✅ MCP Server inicializado correctamente');
                }
                resolve(response.result);
            }
        }
    }

    start(port = 3002) {
        this.server.listen(port, () => {
            console.log(`🔗 MCP WebSocket Proxy ejecutándose en puerto ${port}`);
            console.log(`🌐 WebSocket endpoint: ws://localhost:${port}`);
            console.log(`📊 Status endpoint: http://localhost:${port}/mcp-status`);
            console.log(`📁 Cliente web disponible en: http://localhost:${port}/client-web.html`);
        });
    }

    stop() {
        if (this.mcpProcess) {
            this.mcpProcess.kill();
        }
        this.server.close();
    }
}

// Instalar ws si no está disponible
try {
    require('ws');
} catch (error) {
    console.log('📦 Instalando dependencia ws...');
    const { execSync } = require('child_process');
    execSync('npm install ws', { stdio: 'inherit' });
}

// Inicializar el proxy
const proxy = new MCPWebSocketProxy();
proxy.start(3002);

// Manejar señales de terminación
process.on('SIGINT', () => {
    console.log('\n🔌 Cerrando MCP WebSocket Proxy...');
    proxy.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔌 Cerrando MCP WebSocket Proxy...');
    proxy.stop();
    process.exit(0);
});

module.exports = MCPWebSocketProxy;
