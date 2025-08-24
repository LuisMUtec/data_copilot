// data-transformer.js - Transformador de datos para gráficos

class DataTransformer {
    constructor() {
        this.supportedChartTypes = ['bar', 'line', 'pie', 'doughnut', 'scatter', 'radar'];
    }

    // Transformar datos de MCP para gráficos
    transformDataForChart(mcpData, context = {}) {
        if (!mcpData || !mcpData.rows || mcpData.rows.length === 0) {
            return null;
        }

        const { columns, rows } = mcpData;
        
        // Determinar el mejor tipo de transformación basado en los datos
        const transformation = this.detectTransformationType(columns, rows, context);
        
        switch (transformation.type) {
            case 'categorical':
                return this.transformCategoricalData(columns, rows, transformation);
            case 'time_series':
                return this.transformTimeSeriesData(columns, rows, transformation);
            case 'numerical':
                return this.transformNumericalData(columns, rows, transformation);
            case 'comparative':
                return this.transformComparativeData(columns, rows, transformation);
            default:
                return this.transformGenericData(columns, rows, transformation);
        }
    }

    // Detectar tipo de transformación necesaria
    detectTransformationType(columns, rows, context) {
        const sampleRow = rows[0];
        const columnTypes = this.analyzeColumnTypes(columns, rows);
        
        // Detectar series temporales
        if (this.hasDateColumn(columnTypes)) {
            return {
                type: 'time_series',
                dateColumn: this.findDateColumn(columnTypes),
                valueColumn: this.findNumericColumn(columnTypes)
            };
        }
        
        // Detectar datos categóricos (texto + número)
        if (this.hasCategoricalPattern(columnTypes)) {
            return {
                type: 'categorical',
                labelColumn: this.findTextColumn(columnTypes),
                valueColumn: this.findNumericColumn(columnTypes)
            };
        }
        
        // Detectar datos numéricos puros
        if (this.hasMultipleNumericColumns(columnTypes)) {
            return {
                type: 'numerical',
                columns: this.findNumericColumns(columnTypes)
            };
        }
        
        // Detectar datos comparativos
        if (rows.length > 1 && columns.length >= 2) {
            return {
                type: 'comparative',
                labelColumn: columns[0],
                valueColumn: columns[1]
            };
        }
        
        return {
            type: 'generic',
            columns: columns
        };
    }

    // Transformar datos categóricos (más común)
    transformCategoricalData(columns, rows, transformation) {
        const labelCol = transformation.labelColumn;
        const valueCol = transformation.valueColumn;
        
        const labels = [];
        const data = [];
        const colors = this.generateColors(rows.length);
        
        rows.forEach(row => {
            const labelIndex = columns.indexOf(labelCol);
            const valueIndex = columns.indexOf(valueCol);
            
            if (labelIndex !== -1 && valueIndex !== -1) {
                labels.push(String(row[labelIndex]));
                data.push(Number(row[valueIndex]) || 0);
            }
        });
        
        // Calcular métricas
        const total = data.reduce((sum, val) => sum + val, 0);
        const average = total / data.length;
        const max = Math.max(...data);
        const min = Math.min(...data);
        
        return {
            type: 'categorical',
            labels: labels,
            datasets: [{
                label: valueCol,
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 2
            }],
            metrics: {
                'Total': this.formatNumber(total),
                'Promedio': this.formatNumber(average),
                'Máximo': this.formatNumber(max),
                'Mínimo': this.formatNumber(min)
            },
            rawData: { columns, rows }
        };
    }

    // Transformar datos de series temporales
    transformTimeSeriesData(columns, rows, transformation) {
        const dateCol = transformation.dateColumn;
        const valueCol = transformation.valueColumn;
        
        const labels = [];
        const data = [];
        
        // Ordenar por fecha
        const sortedRows = rows.sort((a, b) => {
            const dateA = new Date(a[columns.indexOf(dateCol)]);
            const dateB = new Date(b[columns.indexOf(dateCol)]);
            return dateA - dateB;
        });
        
        sortedRows.forEach(row => {
            const dateIndex = columns.indexOf(dateCol);
            const valueIndex = columns.indexOf(valueCol);
            
            if (dateIndex !== -1 && valueIndex !== -1) {
                const date = new Date(row[dateIndex]);
                labels.push(this.formatDate(date));
                data.push(Number(row[valueIndex]) || 0);
            }
        });
        
        const total = data.reduce((sum, val) => sum + val, 0);
        const average = total / data.length;
        const trend = this.calculateTrend(data);
        
        return {
            type: 'time_series',
            labels: labels,
            datasets: [{
                label: valueCol,
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }],
            metrics: {
                'Total': this.formatNumber(total),
                'Promedio': this.formatNumber(average),
                'Tendencia': trend > 0 ? '📈 Creciente' : trend < 0 ? '📉 Decreciente' : '➡️ Estable',
                'Puntos': data.length
            },
            rawData: { columns, rows }
        };
    }

    // Transformar datos numéricos múltiples
    transformNumericalData(columns, rows, transformation) {
        const numericColumns = transformation.columns;
        const datasets = [];
        const colors = this.generateColors(numericColumns.length);
        
        numericColumns.forEach((col, index) => {
            const colIndex = columns.indexOf(col);
            const data = rows.map(row => Number(row[colIndex]) || 0);
            
            datasets.push({
                label: col,
                data: data,
                backgroundColor: colors[index],
                borderColor: colors[index].replace('0.8', '1'),
                borderWidth: 2
            });
        });
        
        const labels = rows.map((row, index) => `Item ${index + 1}`);
        
        return {
            type: 'numerical',
            labels: labels,
            datasets: datasets,
            metrics: {
                'Columnas': numericColumns.length,
                'Registros': rows.length,
                'Variables': numericColumns.join(', ')
            },
            rawData: { columns, rows }
        };
    }

    // Transformar datos comparativos
    transformComparativeData(columns, rows, transformation) {
        const labelCol = transformation.labelColumn;
        const valueCol = transformation.valueColumn;
        
        const labels = rows.map(row => String(row[0]));
        const data = rows.map(row => Number(row[1]) || 0);
        const colors = this.generateColors(rows.length);
        
        return {
            type: 'comparative',
            labels: labels,
            datasets: [{
                label: valueCol,
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 2
            }],
            metrics: {
                'Items': rows.length,
                'Total': this.formatNumber(data.reduce((sum, val) => sum + val, 0))
            },
            rawData: { columns, rows }
        };
    }

    // Transformar datos genéricos
    transformGenericData(columns, rows, transformation) {
        // Usar la primera columna como etiquetas y las demás como datos
        const labels = rows.map(row => String(row[0]));
        const datasets = [];
        
        for (let i = 1; i < columns.length; i++) {
            const data = rows.map(row => {
                const value = row[i];
                return Number(value) || 0;
            });
            
            datasets.push({
                label: columns[i],
                data: data,
                backgroundColor: this.generateColors(1)[0],
                borderColor: this.generateColors(1)[0].replace('0.8', '1'),
                borderWidth: 2
            });
        }
        
        return {
            type: 'generic',
            labels: labels,
            datasets: datasets,
            metrics: {
                'Columnas': columns.length,
                'Filas': rows.length
            },
            rawData: { columns, rows }
        };
    }

    // Analizar tipos de columnas
    analyzeColumnTypes(columns, rows) {
        const types = {};
        
        columns.forEach((col, index) => {
            const sampleValues = rows.slice(0, 5).map(row => row[index]);
            types[col] = this.detectColumnType(sampleValues);
        });
        
        return types;
    }

    // Detectar tipo de columna
    detectColumnType(values) {
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        
        if (nonNullValues.length === 0) return 'unknown';
        
        // Detectar fecha
        if (this.isDateValue(nonNullValues[0])) return 'date';
        
        // Detectar número
        if (nonNullValues.every(v => !isNaN(Number(v)))) return 'number';
        
        // Por defecto texto
        return 'text';
    }

    // Verificar si es valor de fecha
    isDateValue(value) {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime()) && String(value).match(/\d{4}|\d{2}\/|\d{2}-/);
    }

    // Verificar si tiene columna de fecha
    hasDateColumn(columnTypes) {
        return Object.values(columnTypes).includes('date');
    }

    // Verificar patrón categórico
    hasCategoricalPattern(columnTypes) {
        const textCols = Object.values(columnTypes).filter(type => type === 'text').length;
        const numberCols = Object.values(columnTypes).filter(type => type === 'number').length;
        return textCols >= 1 && numberCols >= 1;
    }

    // Verificar múltiples columnas numéricas
    hasMultipleNumericColumns(columnTypes) {
        return Object.values(columnTypes).filter(type => type === 'number').length > 1;
    }

    // Encontrar columna de fecha
    findDateColumn(columnTypes) {
        return Object.keys(columnTypes).find(col => columnTypes[col] === 'date');
    }

    // Encontrar columna de texto
    findTextColumn(columnTypes) {
        return Object.keys(columnTypes).find(col => columnTypes[col] === 'text');
    }

    // Encontrar columna numérica
    findNumericColumn(columnTypes) {
        return Object.keys(columnTypes).find(col => columnTypes[col] === 'number');
    }

    // Encontrar todas las columnas numéricas
    findNumericColumns(columnTypes) {
        return Object.keys(columnTypes).filter(col => columnTypes[col] === 'number');
    }

    // Generar colores para gráficos
    generateColors(count) {
        const colors = [
            'rgba(102, 126, 234, 0.8)',
            'rgba(244, 63, 94, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(84, 250, 175, 0.8)'
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    // Formatear números
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toFixed(0);
        }
    }

    // Formatear fechas
    formatDate(date) {
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short' 
        });
    }

    // Calcular tendencia simple
    calculateTrend(data) {
        if (data.length < 2) return 0;
        const first = data[0];
        const last = data[data.length - 1];
        return last - first;
    }
}

// Función global para transformar datos
function transformDataForChart(mcpData, context) {
    const transformer = new DataTransformer();
    return transformer.transformDataForChart(mcpData, context);
}
