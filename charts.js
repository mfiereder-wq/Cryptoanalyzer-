/* ============================================
   CryptoSignal Pro – Chart Manager (ECharts)
   ============================================ */

const ChartManager = {
    priceChart: null,
    rsiGauge: null,
    macdChart: null,
    fearGreedGauge: null,
    darkTheme: true,

    colors() {
        return this.darkTheme ? {
            bg: 'transparent',
            text: '#8899aa',
            textBright: '#e8edf5',
            grid: '#1e2d3d',
            green: '#10b981',
            red: '#ef4444',
            blue: '#3b82f6',
            purple: '#8b5cf6',
            yellow: '#f59e0b',
            orange: '#f97316',
            greenArea: 'rgba(16,185,129,0.08)',
            redArea: 'rgba(239,68,68,0.08)',
            blueArea: 'rgba(59,130,246,0.15)',
        } : {
            bg: 'transparent',
            text: '#64748b',
            textBright: '#1a202c',
            grid: '#e2e8f0',
            green: '#10b981',
            red: '#ef4444',
            blue: '#3b82f6',
            purple: '#8b5cf6',
            yellow: '#f59e0b',
            orange: '#f97316',
            greenArea: 'rgba(16,185,129,0.1)',
            redArea: 'rgba(239,68,68,0.1)',
            blueArea: 'rgba(59,130,246,0.15)',
        };
    },

    initAll() {
        this.priceChart = echarts.init(document.getElementById('price-chart'));
        this.rsiGauge = echarts.init(document.getElementById('rsi-gauge'));
        this.macdChart = echarts.init(document.getElementById('macd-chart'));
        this.fearGreedGauge = echarts.init(document.getElementById('fear-greed-gauge'));

        window.addEventListener('resize', () => {
            this.priceChart?.resize();
            this.rsiGauge?.resize();
            this.macdChart?.resize();
            this.fearGreedGauge?.resize();
        });
    },

    // ====== PRICE CHART ======
    updatePriceChart(timestamps, prices, analysis, days, showMA, showBB, showVol) {
        const c = this.colors();
        const labels = timestamps.map(t => Utils.formatChartDate(t, days));

        const series = [
            {
                name: 'Preis',
                type: 'line',
                data: prices,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 2.5, color: c.blue },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59,130,246,0.25)' },
                        { offset: 1, color: 'rgba(59,130,246,0.02)' }
                    ])
                },
            }
        ];

        // Moving Averages
        if (showMA && analysis) {
            const sma7 = TechnicalAnalysis.SMA(prices, 7);
            const sma14 = TechnicalAnalysis.SMA(prices, 14);
            series.push({
                name: 'SMA 7',
                type: 'line',
                data: sma7,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 1.5, color: c.yellow, type: 'dashed' },
            });
            series.push({
                name: 'SMA 14',
                type: 'line',
                data: sma14,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 1.5, color: c.purple, type: 'dashed' },
            });
        }

        // Bollinger Bands
        if (showBB && analysis && analysis.bollingerBands) {
            const bb = analysis.bollingerBands;
            series.push({
                name: 'BB Oben',
                type: 'line',
                data: bb.upper,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 1, color: c.orange, type: 'dotted', opacity: 0.7 },
            });
            series.push({
                name: 'BB Unten',
                type: 'line',
                data: bb.lower,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 1, color: c.orange, type: 'dotted', opacity: 0.7 },
            });
        }

        const option = {
            backgroundColor: c.bg,
            tooltip: {
                trigger: 'axis',
                backgroundColor: this.darkTheme ? '#1a2332' : '#ffffff',
                borderColor: this.darkTheme ? '#2a3a4d' : '#e2e8f0',
                textStyle: { color: c.textBright, fontSize: 12 },
                formatter: function(params) {
                    let html = `<div style="font-weight:600;margin-bottom:4px;">${params[0].axisValue}</div>`;
                    params.forEach(p => {
                        if (p.value !== null && p.value !== undefined) {
                            html += `<div style="display:flex;align-items:center;gap:6px;font-size:12px;">
                                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                                ${p.seriesName}: <strong>${typeof p.value === 'number' ? p.value.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:6}) : p.value}</strong>
                            </div>`;
                        }
                    });
                    return html;
                }
            },
            legend: {
                data: series.map(s => s.name),
                top: 5,
                textStyle: { color: c.text, fontSize: 11 },
                itemWidth: 16,
                itemHeight: 8,
            },
            grid: {
                left: 12,
                right: 12,
                top: 40,
                bottom: showVol ? 80 : 30,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: labels,
                axisLine: { lineStyle: { color: c.grid } },
                axisLabel: { color: c.text, fontSize: 10 },
                axisTick: { show: false },
            },
            yAxis: [
                {
                    type: 'value',
                    splitLine: { lineStyle: { color: c.grid, type: 'dashed' } },
                    axisLabel: { 
                        color: c.text, 
                        fontSize: 10,
                        formatter: (v) => {
                            if (v >= 1000) return (v/1000).toFixed(1) + 'K';
                            return v.toFixed(2);
                        }
                    },
                    axisLine: { show: false },
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100,
                }
            ],
            series: series
        };

        this.priceChart.setOption(option, true);
    },

    // ====== RSI GAUGE ======
    updateRSIGauge(value) {
        const c = this.colors();
        let color = c.yellow;
        if (value < 30) color = c.green;
        else if (value > 70) color = c.red;

        const option = {
            backgroundColor: c.bg,
            series: [{
                type: 'gauge',
                startAngle: 200,
                endAngle: -20,
                min: 0,
                max: 100,
                center: ['50%', '65%'],
                radius: '90%',
                itemStyle: { color: color },
                progress: {
                    show: true,
                    width: 14,
                    roundCap: true,
                },
                pointer: {
                    length: '55%',
                    width: 5,
                    itemStyle: { color: c.textBright }
                },
                axisLine: {
                    lineStyle: {
                        width: 14,
                        color: [
                            [0.3, c.green],
                            [0.7, c.yellow],
                            [1, c.red]
                        ]
                    }
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: {
                    distance: 20,
                    color: c.text,
                    fontSize: 10,
                    formatter: (v) => {
                        if (v === 0) return '0';
                        if (v === 30) return '30';
                        if (v === 50) return '50';
                        if (v === 70) return '70';
                        if (v === 100) return '100';
                        return '';
                    }
                },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}',
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono',
                    color: color,
                    offsetCenter: [0, '10%']
                },
                data: [{ value: value ? Math.round(value * 10) / 10 : 0 }]
            }]
        };

        this.rsiGauge.setOption(option, true);
    },

    // ====== MACD CHART ======
    updateMACDChart(macdData, length) {
        const c = this.colors();
        // Get last N entries
        const n = Math.min(length, 60);
        const macdSlice = macdData.macd.slice(-n);
        const signalSlice = macdData.signal.slice(-n);
        const histSlice = macdData.histogram.slice(-n);

        const labels = Array.from({ length: n }, (_, i) => i + 1);

        const option = {
            backgroundColor: c.bg,
            tooltip: { trigger: 'axis' },
            grid: {
                left: 5,
                right: 5,
                top: 10,
                bottom: 5,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: labels,
                axisLine: { show: false },
                axisLabel: { show: false },
                axisTick: { show: false },
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: c.grid, type: 'dashed' } },
                axisLabel: { show: false },
                axisLine: { show: false },
            },
            series: [
                {
                    name: 'Histogram',
                    type: 'bar',
                    data: histSlice.map(v => ({
                        value: v,
                        itemStyle: { color: v >= 0 ? c.green : c.red, opacity: 0.7 }
                    })),
                    barWidth: '60%',
                },
                {
                    name: 'MACD',
                    type: 'line',
                    data: macdSlice,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 1.5, color: c.blue },
                },
                {
                    name: 'Signal',
                    type: 'line',
                    data: signalSlice,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 1.5, color: c.orange },
                }
            ]
        };

        this.macdChart.setOption(option, true);
    },

    // ====== FEAR & GREED GAUGE ======
    updateFearGreedGauge(value, label) {
        const c = this.colors();
        let color = c.yellow;
        if (value <= 25) color = c.red;
        else if (value <= 45) color = c.orange;
        else if (value <= 55) color = c.yellow;
        else if (value <= 75) color = '#84cc16';
        else color = c.green;

        const option = {
            backgroundColor: c.bg,
            series: [{
                type: 'gauge',
                startAngle: 200,
                endAngle: -20,
                min: 0,
                max: 100,
                center: ['50%', '70%'],
                radius: '95%',
                itemStyle: { color: color },
                progress: {
                    show: true,
                    width: 12,
                    roundCap: true,
                },
                pointer: {
                    length: '50%',
                    width: 4,
                    itemStyle: { color: c.textBright }
                },
                axisLine: {
                    lineStyle: {
                        width: 12,
                        color: [
                            [0.25, c.red],
                            [0.45, c.orange],
                            [0.55, c.yellow],
                            [0.75, '#84cc16'],
                            [1, c.green]
                        ]
                    }
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}',
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono',
                    color: color,
                    offsetCenter: [0, '5%']
                },
                data: [{ value: value || 0 }]
            }]
        };

        this.fearGreedGauge.setOption(option, true);
    },

    // Update theme
    setTheme(dark) {
        this.darkTheme = dark;
    }
};
