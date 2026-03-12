/* ============================================
   CryptoSignal Pro – Technical Analysis Engine
   RSI, MACD, SMA, EMA, Bollinger Bands
   ============================================ */

const TechnicalAnalysis = {
    // Calculate Simple Moving Average
    SMA(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                const slice = data.slice(i - period + 1, i + 1);
                const avg = slice.reduce((a, b) => a + b, 0) / period;
                result.push(avg);
            }
        }
        return result;
    },

    // Calculate Exponential Moving Average
    EMA(data, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        
        // First EMA value is SMA
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += data[i];
            result.push(null);
        }
        result[period - 1] = sum / period;
        
        for (let i = period; i < data.length; i++) {
            const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
            result.push(ema);
        }
        return result;
    },

    // Calculate RSI (Relative Strength Index)
    RSI(data, period = 14) {
        if (data.length < period + 1) return { values: [], current: null };
        
        const changes = [];
        for (let i = 1; i < data.length; i++) {
            changes.push(data[i] - data[i - 1]);
        }
        
        let gains = [];
        let losses = [];
        
        for (const change of changes) {
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        
        const result = [];
        
        // Initial average
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = 0; i < period; i++) result.push(null);
        
        let rs = avgGain / (avgLoss || 0.0001);
        result.push(100 - 100 / (1 + rs));
        
        for (let i = period; i < changes.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            rs = avgGain / (avgLoss || 0.0001);
            result.push(100 - 100 / (1 + rs));
        }
        
        return {
            values: result,
            current: result[result.length - 1]
        };
    },

    // Calculate MACD
    MACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const emaFast = this.EMA(data, fastPeriod);
        const emaSlow = this.EMA(data, slowPeriod);
        
        const macdLine = [];
        for (let i = 0; i < data.length; i++) {
            if (emaFast[i] !== null && emaSlow[i] !== null) {
                macdLine.push(emaFast[i] - emaSlow[i]);
            } else {
                macdLine.push(null);
            }
        }
        
        // Filter non-null values for signal line calculation
        const validMacd = macdLine.filter(v => v !== null);
        const signalLine = this.EMA(validMacd, signalPeriod);
        
        // Map signal line back to full length
        const fullSignal = [];
        let signalIdx = 0;
        for (let i = 0; i < macdLine.length; i++) {
            if (macdLine[i] !== null) {
                fullSignal.push(signalLine[signalIdx] || null);
                signalIdx++;
            } else {
                fullSignal.push(null);
            }
        }
        
        // Histogram
        const histogram = [];
        for (let i = 0; i < macdLine.length; i++) {
            if (macdLine[i] !== null && fullSignal[i] !== null) {
                histogram.push(macdLine[i] - fullSignal[i]);
            } else {
                histogram.push(null);
            }
        }
        
        return {
            macd: macdLine,
            signal: fullSignal,
            histogram: histogram,
            currentMacd: macdLine.filter(v => v !== null).slice(-1)[0] || 0,
            currentSignal: fullSignal.filter(v => v !== null).slice(-1)[0] || 0,
            currentHistogram: histogram.filter(v => v !== null).slice(-1)[0] || 0
        };
    },

    // Bollinger Bands
    BollingerBands(data, period = 20, multiplier = 2) {
        const sma = this.SMA(data, period);
        const upper = [];
        const lower = [];
        
        for (let i = 0; i < data.length; i++) {
            if (sma[i] === null) {
                upper.push(null);
                lower.push(null);
            } else {
                const slice = data.slice(i - period + 1, i + 1);
                const stdDev = Math.sqrt(
                    slice.reduce((sum, val) => sum + Math.pow(val - sma[i], 2), 0) / period
                );
                upper.push(sma[i] + multiplier * stdDev);
                lower.push(sma[i] - multiplier * stdDev);
            }
        }
        
        return { upper, middle: sma, lower };
    },

    // Generate comprehensive trading signal
    generateSignal(prices, settings = {}) {
        const rsiOverbought = settings.rsiOverbought || 70;
        const rsiOversold = settings.rsiOversold || 30;
        
        if (!prices || prices.length < 30) {
            return { signal: 'NEUTRAL', strength: 0, details: {} };
        }
        
        // Calculate all indicators
        const rsi = this.RSI(prices);
        const macd = this.MACD(prices);
        const sma7 = this.SMA(prices, 7);
        const sma14 = this.SMA(prices, 14);
        const sma30 = this.SMA(prices, 30);
        const ema7 = this.EMA(prices, 7);
        const ema14 = this.EMA(prices, 14);
        const bb = this.BollingerBands(prices);
        
        const currentPrice = prices[prices.length - 1];
        let score = 0; // -100 to +100
        const signals = [];
        
        // RSI Analysis (weight: 25)
        let rsiSignal = 'NEUTRAL';
        if (rsi.current !== null) {
            if (rsi.current < rsiOversold) {
                score += 25;
                rsiSignal = 'KAUF';
                signals.push({ indicator: 'RSI', signal: 'buy', detail: `RSI bei ${rsi.current.toFixed(1)} – Überverkauft` });
            } else if (rsi.current > rsiOverbought) {
                score -= 25;
                rsiSignal = 'VERKAUF';
                signals.push({ indicator: 'RSI', signal: 'sell', detail: `RSI bei ${rsi.current.toFixed(1)} – Überkauft` });
            } else if (rsi.current < 45) {
                score += 10;
                rsiSignal = 'LEICHT KAUF';
            } else if (rsi.current > 55) {
                score -= 10;
                rsiSignal = 'LEICHT VERKAUF';
            }
        }
        
        // MACD Analysis (weight: 25)
        let macdSignal = 'NEUTRAL';
        if (macd.currentMacd !== 0) {
            const hist = macd.currentHistogram;
            if (hist > 0 && macd.currentMacd > macd.currentSignal) {
                score += 25;
                macdSignal = 'KAUF';
                signals.push({ indicator: 'MACD', signal: 'buy', detail: 'MACD über Signal-Linie – Bullisch' });
            } else if (hist < 0 && macd.currentMacd < macd.currentSignal) {
                score -= 25;
                macdSignal = 'VERKAUF';
                signals.push({ indicator: 'MACD', signal: 'sell', detail: 'MACD unter Signal-Linie – Bärisch' });
            }
        }
        
        // Moving Averages (weight: 30)
        const maAnalysis = [];
        const maList = [
            { name: 'SMA 7', values: sma7 },
            { name: 'SMA 14', values: sma14 },
            { name: 'SMA 30', values: sma30 },
            { name: 'EMA 7', values: ema7 },
            { name: 'EMA 14', values: ema14 }
        ];
        
        let maBuyCount = 0, maSellCount = 0, maNeutralCount = 0;
        
        for (const ma of maList) {
            const lastVal = ma.values[ma.values.length - 1];
            if (lastVal !== null) {
                const diff = ((currentPrice - lastVal) / lastVal) * 100;
                let sig = 'neutral';
                if (diff > 0.5) { sig = 'buy'; maBuyCount++; }
                else if (diff < -0.5) { sig = 'sell'; maSellCount++; }
                else { maNeutralCount++; }
                maAnalysis.push({ name: ma.name, value: lastVal, signal: sig });
            }
        }
        
        const maScore = ((maBuyCount - maSellCount) / Math.max(maList.length, 1)) * 30;
        score += maScore;
        
        let maOverallSignal = 'NEUTRAL';
        if (maBuyCount > maSellCount + 1) {
            maOverallSignal = 'KAUF';
            signals.push({ indicator: 'MA', signal: 'buy', detail: `${maBuyCount} von ${maList.length} MAs bullisch` });
        } else if (maSellCount > maBuyCount + 1) {
            maOverallSignal = 'VERKAUF';
            signals.push({ indicator: 'MA', signal: 'sell', detail: `${maSellCount} von ${maList.length} MAs bärisch` });
        }
        
        // Bollinger Bands (weight: 20)
        let bbSignal = 'NEUTRAL';
        const lastUpper = bb.upper[bb.upper.length - 1];
        const lastLower = bb.lower[bb.lower.length - 1];
        if (lastUpper !== null && lastLower !== null) {
            if (currentPrice <= lastLower) {
                score += 20;
                bbSignal = 'KAUF';
                signals.push({ indicator: 'BB', signal: 'buy', detail: 'Preis am unteren Bollinger Band' });
            } else if (currentPrice >= lastUpper) {
                score -= 20;
                bbSignal = 'VERKAUF';
                signals.push({ indicator: 'BB', signal: 'sell', detail: 'Preis am oberen Bollinger Band' });
            }
        }
        
        // Determine overall signal
        let signal, signalClass;
        if (score >= 50) { signal = 'STARKER KAUF'; signalClass = 'strong-buy'; }
        else if (score >= 20) { signal = 'KAUF'; signalClass = 'buy'; }
        else if (score <= -50) { signal = 'STARKER VERKAUF'; signalClass = 'strong-sell'; }
        else if (score <= -20) { signal = 'VERKAUF'; signalClass = 'sell'; }
        else { signal = 'NEUTRAL'; signalClass = 'neutral'; }
        
        return {
            signal,
            signalClass,
            score,
            strength: Math.abs(score),
            rsi: rsi,
            rsiSignal,
            macd: macd,
            macdSignal,
            bollingerBands: bb,
            bbSignal,
            maAnalysis,
            maOverallSignal,
            maBuyCount,
            maSellCount,
            maNeutralCount,
            signals
        };
    }
};
