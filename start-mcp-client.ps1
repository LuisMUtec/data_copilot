# Script de inicio rápido para Cliente MCP Directo
# Inicia el proxy WebSocket MCP y abre el cliente web

Write-Host "🚀 Iniciando Cliente MCP Directo..." -ForegroundColor Green
Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Por favor instala Node.js" -ForegroundColor Red
    exit 1
}

# Verificar dependencias
if (-not (Test-Path "node_modules\ws")) {
    Write-Host "📦 Instalando dependencia WebSocket..." -ForegroundColor Yellow
    npm install ws
}

# Verificar archivos necesarios
$requiredFiles = @(
    "mcp-websocket-proxy.js",
    "mcp-postgres-server.js",
    "client-mcp-direct.html",
    ".env"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Archivos faltantes:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    exit 1
}

# Verificar si el puerto 3002 está disponible
$portCheck = netstat -an | Select-String ":3002 "
if ($portCheck) {
    Write-Host "⚠️  Puerto 3002 en uso. Cerrando procesos..." -ForegroundColor Yellow
    
    # Intentar cerrar procesos en puerto 3002
    $processes = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
    foreach ($proc in $processes) {
        try {
            Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "🔄 Proceso cerrado en puerto 3002" -ForegroundColor Yellow
        } catch {
            # Ignorar errores
        }
    }
    Start-Sleep -Seconds 2
}

Write-Host "🔄 Iniciando MCP WebSocket Proxy..." -ForegroundColor Yellow

# Iniciar el proxy MCP en segundo plano
$mcpJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node mcp-websocket-proxy.js
}

# Esperar a que el servidor esté listo
Write-Host "⏳ Esperando que el MCP Proxy esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Verificar que el servidor esté ejecutándose
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/mcp-status" -TimeoutSec 5 -ErrorAction Stop
    $status = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ MCP Proxy ejecutándose correctamente" -ForegroundColor Green
    Write-Host "📊 Estado: $($status.status)" -ForegroundColor Cyan
    Write-Host "🔗 Clientes conectados: $($status.clients)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error verificando estado del MCP Proxy" -ForegroundColor Red
    Write-Host "🔍 Revisando logs del job..." -ForegroundColor Yellow
    
    # Mostrar salida del job
    $jobOutput = Receive-Job -Job $mcpJob
    if ($jobOutput) {
        Write-Host $jobOutput -ForegroundColor Gray
    }
    
    Write-Host "🔄 El servidor puede estar iniciándose. Continuando..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Abriendo cliente MCP en el navegador..." -ForegroundColor Green

# Abrir el cliente en el navegador
try {
    Start-Process "http://localhost:3002/client-mcp-direct.html"
    Write-Host "✅ Cliente MCP abierto en el navegador" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No se pudo abrir automáticamente. Abre manualmente:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3002/client-mcp-direct.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎯 Cliente MCP Directo iniciado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Información de la sesión:" -ForegroundColor Cyan
Write-Host "   🔗 Cliente web: http://localhost:3002/client-mcp-direct.html" -ForegroundColor White
Write-Host "   📊 Estado MCP: http://localhost:3002/mcp-status" -ForegroundColor White
Write-Host "   🔌 WebSocket: ws://localhost:3002" -ForegroundColor White
Write-Host "   📁 Archivos: http://localhost:3002/" -ForegroundColor White

Write-Host ""
Write-Host "🛠️  Características del cliente:" -ForegroundColor Cyan
Write-Host "   ✅ Conexión directa al MCP (como Claude Desktop)" -ForegroundColor Green
Write-Host "   ✅ Protocolo JSON-RPC sobre WebSocket" -ForegroundColor Green
Write-Host "   ✅ Herramientas MCP: execute_query, describe_table, get_schema" -ForegroundColor Green
Write-Host "   ✅ Análisis con Google AI preparado" -ForegroundColor Green
Write-Host "   ✅ Interfaz moderna y responsive" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Para detener el servidor:" -ForegroundColor Yellow
Write-Host "   Ctrl+C en esta ventana o cerrar PowerShell" -ForegroundColor White

Write-Host ""
Write-Host "📖 Documentación adicional:" -ForegroundColor Cyan
Write-Host "   - CLIENTE-README.md" -ForegroundColor White
Write-Host "   - README.md" -ForegroundColor White

# Mantener el script corriendo para mostrar logs
Write-Host ""
Write-Host "📊 Logs del MCP Proxy (Ctrl+C para salir):" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Gray

try {
    while ($true) {
        $jobOutput = Receive-Job -Job $mcpJob
        if ($jobOutput) {
            Write-Host $jobOutput -ForegroundColor Gray
        }
        Start-Sleep -Seconds 1
        
        # Verificar si el job sigue corriendo
        if ($mcpJob.State -ne "Running") {
            Write-Host "⚠️  El MCP Proxy se ha detenido inesperadamente" -ForegroundColor Yellow
            break
        }
    }
} catch {
    Write-Host "Deteniendo MCP Proxy..." -ForegroundColor Yellow
} finally {
    # Limpiar
    Remove-Job -Job $mcpJob -Force -ErrorAction SilentlyContinue
    Write-Host "Cliente MCP Directo cerrado" -ForegroundColor Green
}
