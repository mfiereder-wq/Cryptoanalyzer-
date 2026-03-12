/* ============================================
   CryptoSignal Pro – Main Application
   Live Crypto Data & Trading Signals
   ============================================ */

const App = {
    // State
    state: {
        coins: [],
        selectedCoin: null,
        priceHistory: [],
        timestamps: [],
        currentDays: 7,
        signals: [],
        notifications: [],
        settings: {
            interval: 60000,
            currency: 'usd',
            notificationsEnabled: true,
            soundEnabled: false,
            rsiOverbought: 70,
            rsiOversold: 30,
        },
        darkTheme: true,
        lastSignal: null,
        updateTimer: null,
        fearGreed: null,
    },

    // Default watchlist
    defaultWatchlist: [
        'bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano',
        'ripple', 'polkadot', 'dogecoin', 'avalanche-2', 'chainlink',
        'polygon', 'litecoin', 'uniswap', 'stellar', 'cosmos'
    ],

    // ====== INITIALIZATION ======
    async init() {
        console.log('🚀 CryptoSignal Pro starting...');

        // Load saved settings
        this.loadSettings();

        // Apply theme
        this.applyTheme();

        // Init charts
        ChartManager.initAll();
        ChartManager.setTheme(this.state.darkTheme);

        // Bind events
        this.bindEvents();

        // Load data
        try {
            await this.loadCoins();
            await this.loadFearGreed();

            // Select first coin
            if (this.state.coins.length > 0) {
                await this.selectCoin(this.state.coins[0]);
            }

            // Start auto-refresh
            this.startAutoRefresh();

            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
            }, 800);

            Utils.showToast('Dashboard geladen! Live-Daten aktiv.', 'success');
        } catch (error) {
            console.error('Init error:', error);
            document.getElementById('loading-screen').classList.add('hidden');
            Utils.showToast('Fehler beim Laden der Daten. Versuche erneut...', 'error');
            // Retry after 5s
            setTimeout(() => this.loadCoins(), 5000);
        }
    },

    // ====== DATA LOADING ======
    async loadCoins() {
        const currency = this.state.settings.currency;
        const ids = this.defaultWatchlist.join(',');

        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`
        );

        if (!response.ok) throw new Error('CoinGecko API error');
        this.state.coins = await response.json();

        this.renderCoinList();
        this.updateMarketTicker();
    },

    async loadCoinHistory(coinId, days) {
        const currency = this.state.settings.currency;
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
        );

        if (!response.ok) throw new Error('History API error');
        const data = await response.json();

        this.state.timestamps = data.prices.map(p => p[0]);
        this.state.priceHistory = data.prices.map(p => p[1]);

        return data;
    },

    async loadFearGreed() {
        try {
            const response = await fetch('https://api.alternative.me/fng/?limit=1');
            const data = await response.json();
            if (data && data.data && data.data[0]) {
                this.state.fearGreed = {
                    value: parseInt(data.data[0].value),
                    label: data.data[0].value_classification
                };
                this.updateFearGreed();
            }
        } catch (e) {
            console.warn('Fear & Greed API unavailable:', e);
        }
    },

    // ====== SIDEBAR TOGGLE ======
    toggleSidebar(forceClose = false) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (forceClose || sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        }
    },

    // ====== COIN SELECTION ======
    async selectCoin(coin) {
        this.state.selectedCoin = coin;

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 960) {
            this.toggleSidebar(true);
        }

        // Update active state in sidebar
        document.querySelectorAll('.coin-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === coin.id);
        });

        // Update header info
        document.getElementById('chart-coin-name').textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;

        // Update stat cards
        this.updateStatCards(coin);

        // Load history and analyze
        try {
            await this.loadCoinHistory(coin.id, this.state.currentDays);
            this.runAnalysis();
        } catch (e) {
            console.error('Error loading coin data:', e);
            Utils.showToast('Fehler beim Laden der Coin-Daten', 'error');
        }
    },

    // ====== ANALYSIS ======
    runAnalysis() {
        const prices = this.state.priceHistory;
        if (!prices || prices.length < 20) return;

        const analysis = TechnicalAnalysis.generateSignal(prices, {
            rsiOverbought: this.state.settings.rsiOverbought,
            rsiOversold: this.state.settings.rsiOversold,
        });

        // Update main signal
        this.updateSignalDisplay(analysis);

        // Update price chart
        const showMA = document.getElementById('toggle-ma').checked;
        const showBB = document.getElementById('toggle-bb').checked;
        const showVol = document.getElementById('toggle-vol').checked;
        ChartManager.updatePriceChart(
            this.state.timestamps, prices, analysis,
            this.state.currentDays, showMA, showBB, showVol
        );

        // Update RSI gauge
        if (analysis.rsi && analysis.rsi.current !== null) {
            ChartManager.updateRSIGauge(analysis.rsi.current);
            document.getElementById('rsi-value').textContent = analysis.rsi.current.toFixed(1);

            const rsiBadge = document.getElementById('rsi-badge');
            const rsiDesc = document.getElementById('rsi-desc');
            if (analysis.rsi.current < 30) {
                rsiBadge.textContent = 'Überverkauft';
                rsiBadge.className = 'analysis-badge buy';
                rsiDesc.textContent = '→ Kaufsignal';
            } else if (analysis.rsi.current > 70) {
                rsiBadge.textContent = 'Überkauft';
                rsiBadge.className = 'analysis-badge sell';
                rsiDesc.textContent = '→ Verkaufssignal';
            } else {
                rsiBadge.textContent = 'Neutral';
                rsiBadge.className = 'analysis-badge';
                rsiDesc.textContent = 'Im normalen Bereich';
            }
        }

        // Update MACD
        if (analysis.macd) {
            ChartManager.updateMACDChart(analysis.macd, prices.length);
            document.getElementById('macd-value').textContent = analysis.macd.currentMacd.toFixed(4);
            document.getElementById('macd-signal-value').textContent = analysis.macd.currentSignal.toFixed(4);

            const macdBadge = document.getElementById('macd-badge');
            if (analysis.macdSignal === 'KAUF') {
                macdBadge.textContent = 'Bullisch';
                macdBadge.className = 'analysis-badge buy';
            } else if (analysis.macdSignal === 'VERKAUF') {
                macdBadge.textContent = 'Bärisch';
                macdBadge.className = 'analysis-badge sell';
            } else {
                macdBadge.textContent = 'Neutral';
                macdBadge.className = 'analysis-badge';
            }
        }

        // Update Moving Averages
        this.updateMADisplay(analysis);

        // Update overall meter
        this.updateOverallMeter(analysis);

        // Check for new signals
        this.checkForNewSignals(analysis);
    },

    // ====== UI UPDATES ======
    updateStatCards(coin) {
        const currency = this.state.settings.currency;
        document.getElementById('current-price').textContent = Utils.formatCurrency(coin.current_price, currency);

        const change = coin.price_change_percentage_24h;
        const changeEl = document.getElementById('price-change');
        changeEl.textContent = Utils.formatPercent(change) + ' (24h)';
        changeEl.className = 'stat-change ' + Utils.getChangeClass(change);

        document.getElementById('current-volume').textContent = Utils.formatCurrency(coin.total_volume, currency, true);
        document.getElementById('current-marketcap').textContent = Utils.formatCurrency(coin.market_cap, currency, true);
    },

    updateSignalDisplay(analysis) {
        const signalEl = document.getElementById('current-signal');
        signalEl.textContent = analysis.signal;
        signalEl.className = 'stat-value signal-value ' + analysis.signalClass;

        const strengthEl = document.getElementById('signal-strength');
        strengthEl.textContent = `Stärke: ${analysis.strength}%`;

        // Update signal card icon color
        const signalIcon = document.querySelector('#stat-signal .stat-icon');
        if (analysis.signalClass.includes('buy')) {
            signalIcon.style.background = 'rgba(16, 185, 129, 0.1)';
            signalIcon.style.color = '#10b981';
        } else if (analysis.signalClass.includes('sell')) {
            signalIcon.style.background = 'rgba(239, 68, 68, 0.1)';
            signalIcon.style.color = '#ef4444';
        } else {
            signalIcon.style.background = 'rgba(245, 158, 11, 0.1)';
            signalIcon.style.color = '#f59e0b';
        }
    },

    updateMADisplay(analysis) {
        if (!analysis.maAnalysis) return;

        const maMap = {};
        analysis.maAnalysis.forEach(ma => {
            maMap[ma.name] = ma;
        });

        const currency = this.state.settings.currency;
        const entries = [
            { key: 'SMA 7', valId: 'sma7-val', sigId: 'sma7-sig' },
            { key: 'SMA 14', valId: 'sma14-val', sigId: 'sma14-sig' },
            { key: 'SMA 30', valId: 'sma30-val', sigId: 'sma30-sig' },
            { key: 'EMA 7', valId: 'ema7-val', sigId: 'ema7-sig' },
            { key: 'EMA 14', valId: 'ema14-val', sigId: 'ema14-sig' },
        ];

        for (const entry of entries) {
            const ma = maMap[entry.key];
            if (ma) {
                document.getElementById(entry.valId).textContent = Utils.formatCurrency(ma.value, currency);
                const sigEl = document.getElementById(entry.sigId);
                sigEl.textContent = ma.signal === 'buy' ? 'KAUF' : ma.signal === 'sell' ? 'VERKAUF' : 'NEUTRAL';
                sigEl.className = 'ma-signal ' + ma.signal;
            }
        }

        // MA badge
        const maBadge = document.getElementById('ma-badge');
        if (analysis.maOverallSignal === 'KAUF') {
            maBadge.textContent = 'Bullisch';
            maBadge.className = 'analysis-badge buy';
        } else if (analysis.maOverallSignal === 'VERKAUF') {
            maBadge.textContent = 'Bärisch';
            maBadge.className = 'analysis-badge sell';
        } else {
            maBadge.textContent = 'Neutral';
            maBadge.className = 'analysis-badge';
        }

        // Summary counts
        document.querySelector('#ma-buy-count span').textContent = analysis.maBuyCount;
        document.querySelector('#ma-sell-count span').textContent = analysis.maSellCount;
        document.querySelector('#ma-neutral-count span').textContent = analysis.maNeutralCount;
    },

    updateOverallMeter(analysis) {
        // Score ranges from -100 to +100, map to 0-100%
        const pct = ((analysis.score + 100) / 200) * 100;
        document.getElementById('overall-meter-pointer').style.left = pct + '%';

        const verdict = document.querySelector('.verdict-text');
        verdict.textContent = analysis.signal;
        verdict.className = 'verdict-text ' + analysis.signalClass;
    },

    updateFearGreed() {
        if (!this.state.fearGreed) return;
        const { value, label } = this.state.fearGreed;
        ChartManager.updateFearGreedGauge(value, label);

        const labelEl = document.getElementById('fear-greed-label');
        const translations = {
            'Extreme Fear': 'Extreme Angst',
            'Fear': 'Angst',
            'Neutral': 'Neutral',
            'Greed': 'Gier',
            'Extreme Greed': 'Extreme Gier'
        };
        labelEl.textContent = translations[label] || label;
        
        if (value <= 25) labelEl.style.color = '#ef4444';
        else if (value <= 45) labelEl.style.color = '#f97316';
        else if (value <= 55) labelEl.style.color = '#f59e0b';
        else if (value <= 75) labelEl.style.color = '#84cc16';
        else labelEl.style.color = '#10b981';
    },

    // ====== SIGNAL TRACKING ======
    checkForNewSignals(analysis) {
        const coin = this.state.selectedCoin;
        if (!coin) return;

        const currentSignalKey = `${coin.id}_${analysis.signal}`;
        if (this.state.lastSignal === currentSignalKey) return;
        this.state.lastSignal = currentSignalKey;

        // Only log non-neutral signals
        if (analysis.signalClass === 'neutral') return;

        // Add to signal history
        for (const sig of analysis.signals) {
            const signalEntry = {
                id: Utils.uid(),
                coin: coin.name,
                symbol: coin.symbol.toUpperCase(),
                type: sig.signal,
                indicator: sig.indicator,
                detail: sig.detail,
                price: coin.current_price,
                time: new Date(),
            };

            this.state.signals.unshift(signalEntry);

            // Add notification
            this.addNotification(signalEntry);
        }

        // Keep last 50 signals
        this.state.signals = this.state.signals.slice(0, 50);
        Utils.save('signals', this.state.signals);

        this.renderSignalList();

        // Browser notification
        if (this.state.settings.notificationsEnabled) {
            const emoji = analysis.signalClass.includes('buy') ? '🟢' : '🔴';
            Utils.sendBrowserNotification(
                `${emoji} ${analysis.signal} – ${coin.name}`,
                analysis.signals.map(s => s.detail).join('\n')
            );
        }

        // Toast
        const toastType = analysis.signalClass.includes('buy') ? 'success' : 
                          analysis.signalClass.includes('sell') ? 'warning' : 'info';
        Utils.showToast(
            `${analysis.signal}: ${coin.name} (${coin.symbol.toUpperCase()})`,
            toastType
        );
    },

    addNotification(signal) {
        this.state.notifications.unshift({
            id: signal.id,
            type: signal.type === 'buy' ? 'success' : signal.type === 'sell' ? 'danger' : 'warning',
            icon: signal.type === 'buy' ? 'fa-arrow-up' : signal.type === 'sell' ? 'fa-arrow-down' : 'fa-minus',
            title: `${signal.indicator}: ${signal.type === 'buy' ? 'Kaufsignal' : 'Verkaufssignal'}`,
            text: `${signal.coin} – ${signal.detail}`,
            time: signal.time,
        });

        this.state.notifications = this.state.notifications.slice(0, 30);

        // Update badge
        const badge = document.getElementById('notification-badge');
        badge.style.display = 'flex';
        badge.textContent = this.state.notifications.length;
    },

    // ====== RENDERING ======
    renderCoinList() {
        const container = document.getElementById('coin-list');
        const currency = this.state.settings.currency;
        const searchTerm = (document.getElementById('coin-search').value || '').toLowerCase();

        const filtered = this.state.coins.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.symbol.toLowerCase().includes(searchTerm)
        );

        container.innerHTML = filtered.map(coin => `
            <div class="coin-item ${this.state.selectedCoin?.id === coin.id ? 'active' : ''}" 
                 data-id="${coin.id}" onclick="App.selectCoin(App.state.coins.find(c => c.id === '${coin.id}'))">
                <img src="${coin.image}" alt="${coin.name}" loading="lazy">
                <div class="coin-item-info">
                    <div class="coin-item-name">${coin.name}</div>
                    <div class="coin-item-symbol">${coin.symbol}</div>
                </div>
                <div class="coin-item-right">
                    <div class="coin-item-price">${Utils.formatCurrency(coin.current_price, currency)}</div>
                    <div class="coin-item-change ${Utils.getChangeClass(coin.price_change_percentage_24h)}">
                        ${Utils.formatPercent(coin.price_change_percentage_24h)}
                    </div>
                </div>
            </div>
        `).join('');
    },

    updateMarketTicker() {
        const ticker = document.getElementById('market-ticker');
        const currency = this.state.settings.currency;
        const topCoins = this.state.coins.slice(0, 6);

        const items = topCoins.map(coin => `
            <div class="ticker-item">
                <img src="${coin.image}" alt="${coin.symbol}">
                <span class="ticker-name">${coin.symbol.toUpperCase()}</span>
                <span class="ticker-price">${Utils.formatCurrency(coin.current_price, currency)}</span>
                <span class="ticker-change ${Utils.getChangeClass(coin.price_change_percentage_24h)}">
                    ${Utils.formatPercent(coin.price_change_percentage_24h)}
                </span>
            </div>
        `).join('');

        // Duplicate for seamless scroll
        ticker.innerHTML = items + items;
    },

    renderSignalList() {
        const container = document.getElementById('signal-list');
        const currency = this.state.settings.currency;

        if (this.state.signals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-satellite-dish"></i>
                    <p>Warte auf Signale...</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.state.signals.slice(0, 20).map(sig => `
            <div class="signal-item">
                <div class="signal-item-icon ${sig.type}">
                    <i class="fas ${sig.type === 'buy' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                </div>
                <div class="signal-item-info">
                    <div class="signal-item-title">${sig.coin} (${sig.symbol}) – ${sig.indicator}</div>
                    <div class="signal-item-detail">${sig.detail}</div>
                </div>
                <div class="signal-item-time">${Utils.formatDateTime(sig.time)}</div>
            </div>
        `).join('');
    },

    renderNotifications() {
        const container = document.getElementById('notification-list');

        if (this.state.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <i class="fas fa-bell-slash"></i>
                    <p>Keine Benachrichtigungen</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.state.notifications.map(n => `
            <div class="notification-item">
                <div class="notification-item-icon ${n.type}">
                    <i class="fas ${n.icon}"></i>
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${n.title}</div>
                    <div class="notification-item-text">${n.text}</div>
                    <div class="notification-item-time">${Utils.formatDateTime(n.time)}</div>
                </div>
            </div>
        `).join('');
    },

    // ====== AUTO REFRESH ======
    startAutoRefresh() {
        if (this.state.updateTimer) clearInterval(this.state.updateTimer);

        this.state.updateTimer = setInterval(async () => {
            try {
                await this.loadCoins();
                if (this.state.selectedCoin) {
                    // Find updated coin data
                    const updated = this.state.coins.find(c => c.id === this.state.selectedCoin.id);
                    if (updated) {
                        this.state.selectedCoin = updated;
                        this.updateStatCards(updated);
                    }
                    await this.loadCoinHistory(this.state.selectedCoin.id, this.state.currentDays);
                    this.runAnalysis();
                }

                // Update connection status
                document.querySelector('.status-dot').style.background = '#10b981';
                document.querySelector('.status-text').textContent = 'Live';
            } catch (e) {
                console.warn('Refresh error:', e);
                document.querySelector('.status-dot').style.background = '#ef4444';
                document.querySelector('.status-text').textContent = 'Offline';
            }
        }, this.state.settings.interval);
    },

    // ====== EVENT BINDING ======
    bindEvents() {
        // Sidebar toggle
        document.getElementById('btn-sidebar-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });

        document.getElementById('btn-sidebar-close').addEventListener('click', () => {
            this.toggleSidebar(true);
        });

        document.getElementById('sidebar-overlay').addEventListener('click', () => {
            this.toggleSidebar(true);
        });

        // Coin search
        document.getElementById('coin-search').addEventListener('input',
            Utils.debounce(() => this.renderCoinList(), 300)
        );

        // Timeframe buttons
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.currentDays = parseInt(e.target.dataset.days);

                if (this.state.selectedCoin) {
                    try {
                        await this.loadCoinHistory(this.state.selectedCoin.id, this.state.currentDays);
                        this.runAnalysis();
                    } catch (e) {
                        Utils.showToast('Fehler beim Laden', 'error');
                    }
                }
            });
        });

        // Indicator toggles
        ['toggle-ma', 'toggle-bb', 'toggle-vol'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.runAnalysis());
        });

        // Theme toggle
        document.getElementById('btn-theme').addEventListener('click', () => {
            this.state.darkTheme = !this.state.darkTheme;
            this.applyTheme();
            ChartManager.setTheme(this.state.darkTheme);
            this.runAnalysis(); // Re-render charts with new theme
            Utils.save('darkTheme', this.state.darkTheme);
        });

        // Settings modal
        document.getElementById('btn-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'flex';
            this.populateSettings();
        });

        document.getElementById('btn-close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });

        document.getElementById('btn-save-settings').addEventListener('click', () => {
            this.saveSettings();
            document.getElementById('settings-modal').style.display = 'none';
            Utils.showToast('Einstellungen gespeichert!', 'success');
        });

        // Notification panel
        document.getElementById('btn-notifications').addEventListener('click', () => {
            const panel = document.getElementById('notification-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            this.renderNotifications();
        });

        document.getElementById('btn-clear-notifications').addEventListener('click', () => {
            this.state.notifications = [];
            document.getElementById('notification-badge').style.display = 'none';
            this.renderNotifications();
        });

        // Clear signals
        document.getElementById('btn-clear-signals').addEventListener('click', () => {
            this.state.signals = [];
            Utils.save('signals', []);
            this.renderSignalList();
        });

        // Close notification panel on outside click
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notification-panel');
            const btn = document.getElementById('btn-notifications');
            if (!panel.contains(e.target) && !btn.contains(e.target)) {
                panel.style.display = 'none';
            }
        });

        // Close settings on overlay click
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settings-modal')) {
                document.getElementById('settings-modal').style.display = 'none';
            }
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            setTimeout(() => {
                Notification.requestPermission();
            }, 3000);
        }
    },

    // ====== SETTINGS ======
    populateSettings() {
        document.getElementById('setting-interval').value = this.state.settings.interval;
        document.getElementById('setting-currency').value = this.state.settings.currency;
        document.getElementById('setting-notifications').checked = this.state.settings.notificationsEnabled;
        document.getElementById('setting-sound').checked = this.state.settings.soundEnabled;
        document.getElementById('setting-rsi-overbought').value = this.state.settings.rsiOverbought;
        document.getElementById('setting-rsi-oversold').value = this.state.settings.rsiOversold;
    },

    saveSettings() {
        const oldCurrency = this.state.settings.currency;

        this.state.settings.interval = parseInt(document.getElementById('setting-interval').value);
        this.state.settings.currency = document.getElementById('setting-currency').value;
        this.state.settings.notificationsEnabled = document.getElementById('setting-notifications').checked;
        this.state.settings.soundEnabled = document.getElementById('setting-sound').checked;
        this.state.settings.rsiOverbought = parseInt(document.getElementById('setting-rsi-overbought').value);
        this.state.settings.rsiOversold = parseInt(document.getElementById('setting-rsi-oversold').value);

        Utils.save('settings', this.state.settings);

        // Restart timer with new interval
        this.startAutoRefresh();

        // Reload if currency changed
        if (oldCurrency !== this.state.settings.currency) {
            this.loadCoins().then(() => {
                if (this.state.selectedCoin) {
                    const updated = this.state.coins.find(c => c.id === this.state.selectedCoin.id);
                    if (updated) this.selectCoin(updated);
                }
            });
        }
    },

    loadSettings() {
        const saved = Utils.load('settings');
        if (saved) {
            this.state.settings = { ...this.state.settings, ...saved };
        }

        const savedTheme = Utils.load('darkTheme');
        if (savedTheme !== null) {
            this.state.darkTheme = savedTheme;
        }

        const savedSignals = Utils.load('signals');
        if (savedSignals) {
            this.state.signals = savedSignals;
        }
    },

    // ====== THEME ======
    applyTheme() {
        document.body.classList.toggle('light-theme', !this.state.darkTheme);
        const icon = document.querySelector('#btn-theme i');
        icon.className = this.state.darkTheme ? 'fas fa-moon' : 'fas fa-sun';
    },
};

// ====== START ======
document.addEventListener('DOMContentLoaded', () => App.init());
