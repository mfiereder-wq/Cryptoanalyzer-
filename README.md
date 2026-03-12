# 🚀 CryptoSignal Pro – Live Krypto Trading Signal Dashboard

Ein professionelles Echtzeit-Krypto-Trading-Dashboard mit technischer Analyse und automatischen Trading-Signalen.

## ✅ Implementierte Features

### 📊 Live Marktdaten
- Echtzeit-Preise von **15 Top-Kryptowährungen** via CoinGecko API
- Automatische Aktualisierung (konfigurierbar: 30s – 5min)
- Markt-Ticker im Header mit Preis und 24h-Veränderung
- Unterstützung für **USD, EUR, GBP, CHF**

### 📈 Technische Analyse Engine
- **RSI (Relative Strength Index)** – Überkauft/Überverkauft-Erkennung
- **MACD (Moving Average Convergence Divergence)** – Trendumkehr-Signale
- **SMA (Simple Moving Average)** – 7, 14, 30 Perioden
- **EMA (Exponential Moving Average)** – 7, 14 Perioden
- **Bollinger Bands** – Volatilitäts-Analyse

### 🚦 Trading Signale
- Automatische Generierung von **Kauf/Verkauf/Neutral**-Signalen
- Gewichteter Score aus allen Indikatoren (-100 bis +100)
- Signal-Stärke-Anzeige (Starker Kauf, Kauf, Neutral, Verkauf, Starker Verkauf)
- **Signal-Verlauf** mit Zeitstempel

### 📉 Interaktive Charts (ECharts)
- Preis-Chart mit Zoom und Tooltips
- RSI-Gauge-Anzeige
- MACD-Histogramm und Signal-Linien
- Fear & Greed Index Gauge
- Toggle für MA, Bollinger Bands, Volumen
- Zeiträume: 24H, 7T, 30T, 90T, 1J

### 🔔 Benachrichtigungen
- **Browser-Benachrichtigungen** bei neuen Signalen
- In-App Notification Panel
- Toast-Benachrichtigungen
- Konfigurierbare Schwellenwerte

### ⚙️ Einstellungen
- Aktualisierungs-Intervall (30s – 5min)
- Währungsauswahl (USD/EUR/GBP/CHF)
- RSI-Schwellenwerte anpassbar
- Sound-Benachrichtigungen (toggle)
- **Dark/Light Mode**
- Einstellungen werden im LocalStorage gespeichert

### 🎨 Design
- Professionelles Dark-Theme (Standard)
- Light-Theme verfügbar
- Voll responsive (Desktop, Tablet, Mobile)
- Smooth Animationen und Übergänge

## 📁 Projektstruktur

```
index.html                 → Haupt-Dashboard
css/
  └── style.css            → Komplettes Styling (Dark/Light Theme)
js/
  ├── utils.js             → Hilfsfunktionen (Formatierung, Toast, Notifications)
  ├── technical-analysis.js → TA Engine (RSI, MACD, SMA, EMA, BB)
  ├── charts.js            → Chart Manager (ECharts Konfiguration)
  └── app.js               → Haupt-App (API, State, UI, Events)
```

## 🌐 Einstiegspunkt

| Pfad | Beschreibung |
|------|-------------|
| `/index.html` | Haupt-Dashboard mit allen Features |

## 🔗 Verwendete APIs

| API | URL | Beschreibung |
|-----|-----|-------------|
| CoinGecko | `api.coingecko.com/api/v3/` | Krypto-Preise & Marktdaten (kostenlos, kein API-Key) |
| Alternative.me | `api.alternative.me/fng/` | Fear & Greed Index |

## 📦 Verwendete Bibliotheken (CDN)

- **ECharts 5** – Interaktive Charts und Gauges
- **Font Awesome 6** – Icons
- **Google Fonts** – Inter + JetBrains Mono

## 🪙 Watchlist (Standard)

Bitcoin, Ethereum, BNB, Solana, Cardano, XRP, Polkadot, Dogecoin, Avalanche, Chainlink, Polygon, Litecoin, Uniswap, Stellar, Cosmos

## 🚧 Noch nicht implementiert

- Portfolio-Tracker mit Kauf/Verkauf-Tracking
- Preis-Alarme für bestimmte Zielpreise
- Historische Signal-Performance-Analyse
- Weitere Indikatoren (Stochastic, ADX, OBV)
- Export von Signalen als CSV
- PWA-Unterstützung für Offline-Nutzung

## 💡 Empfohlene nächste Schritte

1. **Portfolio-Tracker** – Coins kaufen/verkaufen und P&L tracken
2. **Preis-Alarme** – Benachrichtigungen bei bestimmten Preisniveaus
3. **Mehr Indikatoren** – Stochastic RSI, ADX, Williams %R
4. **Backtesting** – Historische Signal-Performance auswerten
5. **PWA** – Service Worker für Offline-Fähigkeit

## ⚠️ Disclaimer

Dieses Dashboard dient nur zu Informationszwecken. Die Trading-Signale sind **keine Anlageberatung**. Investitionen in Kryptowährungen sind riskant. Bitte recherchiere immer eigenständig, bevor du Investitionsentscheidungen triffst.
