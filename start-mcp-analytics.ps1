# start-mcp-analytics.ps1 - Script de inicio para MCP Analytics Dashboard

Write-Host "Iniciando MCP Analytics Dashboard..." -ForegroundColor Green
Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js no encontrado. Instalalo desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar dependencias
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Verificar archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "Error: Archivo .env no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Configuracion verificada:" -ForegroundColor Cyan
Write-Host "- Base de datos: PostgreSQL (Supabase)" -ForegroundColor White
Write-Host "- MCP Server: mcp-postgres-server.js" -ForegroundColor White
Write-Host "- WebSocket Proxy: puerto 3002" -ForegroundColor White
Write-Host "- Gemini API: Integrado" -ForegroundColor White
Write-Host ""

# Verificar si el puerto 3002 esta en uso
$portInUse = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Puerto 3002 en uso. Cerrando procesos..." -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -eq "node"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Iniciar MCP Proxy en background
Write-Host "Iniciando MCP WebSocket Proxy..." -ForegroundColor Yellow
$mcpJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node mcp-websocket-proxy.js
}

# Esperar a que el proxy este listo
Start-Sleep -Seconds 3

# Verificar que el proxy este corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/mcp-status" -UseBasicParsing -TimeoutSec 5
    $status = $response.Content | ConvertFrom-Json
    Write-Host "Estado: $($status.status)" -ForegroundColor Cyan
    Write-Host "MCP Server: $($status.mcpServer)" -ForegroundColor Cyan
} catch {
    Write-Host "Advertencia: No se pudo verificar el estado del MCP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== MCP Analytics Dashboard ===" -ForegroundColor Green
Write-Host ""

# Abrir el Analytics Dashboard
try {
    Write-Host "Abriendo Analytics Dashboard..." -ForegroundColor Green
    Start-Process "frontend-analytics.html"
} catch {
    Write-Host "No se pudo abrir automaticamente. Abre manualmente:" -ForegroundColor Yellow
    Write-Host "   Archivo: frontend-analytics.html" -ForegroundColor White
}

Write-Host ""
Write-Host "Enlaces importantes:" -ForegroundColor Cyan
Write-Host "   Analytics Dashboard: file://$(Get-Location)/frontend-analytics.html" -ForegroundColor White
Write-Host "   Estado MCP: http://localhost:3002/mcp-status" -ForegroundColor White
Write-Host "   WebSocket: ws://localhost:3002" -ForegroundColor White
Write-Host ""

Write-Host "Caracteristicas del dashboard:" -ForegroundColor Cyan
Write-Host "   - Consultas en lenguaje natural con Gemini AI" -ForegroundColor White
Write-Host "   - Conversion automatica NL -> SQL" -ForegroundColor White
Write-Host "   - Ejecucion via MCP real (no simulado)" -ForegroundColor White
Write-Host "   - Graficos interactivos con Chart.js" -ForegroundColor White
Write-Host "   - Metricas automaticas" -ForegroundColor White
Write-Host "   - Multiples tipos de graficos" -ForegroundColor White
Write-Host ""

Write-Host "Ejemplos de consultas:" -ForegroundColor Yellow
Write-Host "   'Muestra los empleados por pais'" -ForegroundColor White
Write-Host "   'Cuales son los productos mas vendidos?'" -ForegroundColor White
Write-Host "   'Ventas por categoria de producto'" -ForegroundColor White
Write-Host "   'Evolucion de pedidos por mes'" -ForegroundColor White
Write-Host ""

Write-Host "Presiona Ctrl+C para detener el servidor..." -ForegroundColor Yellow
Write-Host "Logs del MCP Proxy:" -ForegroundColor Yellow

# Mostrar logs del MCP Proxy
try {
    while ($true) {
        $jobState = Get-Job -Id $mcpJob.Id
        if ($jobState.State -eq "Completed" -or $jobState.State -eq "Failed") {
            Write-Host "El MCP Proxy se ha detenido inesperadamente" -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "Deteniendo MCP Proxy..." -ForegroundColor Yellow
} finally {
    # Limpiar
    Remove-Job -Job $mcpJob -Force -ErrorAction SilentlyContinue
    Write-Host "MCP Analytics Dashboard cerrado" -ForegroundColor Green
}
