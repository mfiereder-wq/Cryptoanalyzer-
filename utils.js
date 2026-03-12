/* ============================================
   CryptoSignal Pro – Utility Functions
   ============================================ */

const Utils = {
    // Format currency
    formatCurrency(value, currency = 'usd', compact = false) {
        if (value === null || value === undefined) return '--';
        const symbols = { usd: '$', eur: '€', gbp: '£', chf: 'CHF ' };
        const sym = symbols[currency] || '$';
        
        if (compact && Math.abs(value) >= 1e9) {
            return sym + (value / 1e9).toFixed(2) + 'B';
        }
        if (compact && Math.abs(value) >= 1e6) {
            return sym + (value / 1e6).toFixed(2) + 'M';
        }
        if (compact && Math.abs(value) >= 1e3) {
            return sym + (value / 1e3).toFixed(2) + 'K';
        }
        
        if (value >= 1) {
            return sym + value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (value >= 0.01) {
            return sym + value.toFixed(4);
        } else {
            return sym + value.toFixed(8);
        }
    },

    // Format percentage
    formatPercent(value) {
        if (value === null || value === undefined) return '--';
        const sign = value >= 0 ? '+' : '';
        return sign + value.toFixed(2) + '%';
    },

    // Format number compact
    formatCompact(value) {
        if (value === null || value === undefined) return '--';
        if (Math.abs(value) >= 1e12) return (value / 1e12).toFixed(2) + 'T';
        if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(2) + 'B';
        if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(2) + 'M';
        if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return value.toFixed(2);
    },

    // Format time
    formatTime(date) {
        return new Date(date).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },

    // Format date and time
    formatDateTime(date) {
        return new Date(date).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format date for chart
    formatChartDate(timestamp, days) {
        const d = new Date(timestamp);
        if (days <= 1) {
            return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        } else if (days <= 30) {
            return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        } else {
            return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
        }
    },

    // Debounce function
    debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    // Generate unique ID
    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Local storage helpers
    save(key, data) {
        try {
            localStorage.setItem('csp_' + key, JSON.stringify(data));
        } catch (e) { console.warn('Storage save failed:', e); }
    },

    load(key, fallback = null) {
        try {
            const data = localStorage.getItem('csp_' + key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) { return fallback; }
    },

    // Color helpers
    getChangeColor(value) {
        return value >= 0 ? '#10b981' : '#ef4444';
    },

    getChangeClass(value) {
        return value >= 0 ? 'positive' : 'negative';
    },

    // Toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Browser notification
    async sendBrowserNotification(title, body, icon = '📊') {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon });
        }
    }
};
