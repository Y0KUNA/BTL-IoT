// Utility Functions for IoT Dashboard

// Date and Time utilities
const DateUtils = {
    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    },

    formatTime(date, withSeconds = false) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return withSeconds ? date.toTimeString().split(' ')[0].slice(0, 5) : date.toTimeString().split(' ')[0].slice(0, 8);
    },

    formatDateTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return `${this.formatDate(date)} ${this.formatTime(date)}`;
    },

    getCurrentTime() {
        return new Date();
    },

    addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    },

    subtractHours(date, hours) {
        return new Date(date.getTime() - hours * 60 * 60 * 1000);
    }
};

// Data generation utilities
const DataGenerator = {
    generateTemperature() {
        // Generate realistic temperature data between 20-35°C
        const baseTemp = 27.5;
        const variation = (Math.random() - 0.5) * 10;
        return Math.round((baseTemp + variation) * 10) / 10;
    },

    generateHumidity() {
        // Generate humidity data between 40-90%
        const baseHumidity = 65;
        const variation = (Math.random() - 0.5) * 30;
        return Math.round((baseHumidity + variation) * 10) / 10;
    },

    generateLight() {
        // Generate light data between 100-1000 lux
        const baseLight = 500;
        const variation = (Math.random() - 0.5) * 600;
        return Math.round(baseLight + variation);
    },

    generateSensorData() {
        return {
            temperature: this.generateTemperature(),
            humidity: this.generateHumidity(),
            light: this.generateLight(),
            timestamp: DateUtils.getCurrentTime()
        };
    },

    generateHistoryData(hours = 24, interval = 2) {
        const data = [];
        const now = DateUtils.getCurrentTime();
        const pointCount = Math.floor(hours / interval);

        for (let i = pointCount; i >= 0; i--) {
            const timestamp = DateUtils.subtractHours(now, i * interval);
            data.push({
                id: pointCount - i + 1,
                date: DateUtils.formatDate(timestamp),
                time: DateUtils.formatTime(timestamp),
                temperature: this.generateTemperature(),
                humidity: this.generateHumidity(),
                light: this.generateLight(),
                timestamp: timestamp
            });
        }

        return data;
    },

    generateLEDHistory(count = 25) {
        const devices = ['LED 1', 'LED 2', 'LED 3'];
        const statuses = ['Turned ON', 'Turned OFF'];
        const data = [];
        const now = DateUtils.getCurrentTime();

        for (let i = 0; i < count; i++) {
            const timestamp = DateUtils.subtractHours(now, Math.random() * 48);
            data.push({
                id: i + 1,
                device: devices[Math.floor(Math.random() * devices.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                timestamp: DateUtils.formatDateTime(timestamp)
            });
        }

        // Sort by timestamp descending
        return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
};

// Status determination utilities
const StatusUtils = {
    getTemperatureStatus(temp) {
        if (temp < 22 || temp > 30) return { status: 'warning', text: 'Warning', color: '#FFC107' };
        return { status: 'normal', text: 'Normal', color: '#28A745' };
    },

    getHumidityStatus(humidity) {
        if (humidity > 70) return { status: 'high', text: 'High', color: '#FFC107' };
        if (humidity < 40) return { status: 'low', text: 'Low', color: '#FF6B6B' };
        return { status: 'normal', text: 'Normal', color: '#28A745' };
    },

    getLightStatus(light) {
        if (light < 200) return { status: 'low', text: 'Low', color: '#FF6B6B' };
        if (light > 800) return { status: 'high', text: 'High', color: '#FFC107' };
        return { status: 'optimal', text: 'Optimal', color: '#28A745' };
    }
};

// DOM manipulation utilities
const DOMUtils = {
    createElement(tag, className, textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    },

    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    show(element) {
        element.style.display = 'block';
    },

    hide(element) {
        element.style.display = 'none';
    },

    toggle(element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    },

    setAttributes(element, attributes) {
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
    }
};

// Chart utilities
const ChartUtils = {
    generateChartData(dataPoints, valueKey = 'temperature') {
        return dataPoints.map(point => ({
            x: point.timestamp,
            y: point[valueKey],
            label: DateUtils.formatTime(point.timestamp)
        }));
    },

    calculateStats(data, valueKey = 'temperature') {
        const values = data.map(item => item[valueKey]);
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, val) => sum + val, 0) / values.length
        };
    },

    createSimpleChart(container, data, color = '#FF6B6B') {
        // Simple SVG chart implementation
        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 400 160">
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.2" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0" />
                    </linearGradient>
                </defs>
                ${this.generateChartPath(data, color)}
            </svg>
        `;
    },

    generateChartPath(data, color) {
        if (!data || data.length === 0) return '';
        
        const width = 400;
        const height = 160;
        const padding = 20;
        
        const minY = Math.min(...data.map(d => d.y));
        const maxY = Math.max(...data.map(d => d.y));
        const rangeY = maxY - minY || 1;
        
        const points = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((d.y - minY) / rangeY) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');
        
        return `
            <polyline fill="none" stroke="${color}" stroke-width="2" points="${points}" />
            <polygon fill="url(#chartGradient)" points="${points} ${width - padding},${height - padding} ${padding},${height - padding}" />
        `;
    }
};

// Local storage utilities
const StorageUtils = {
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },

    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Failed to remove from localStorage:', e);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
            return false;
        }
    }
};

// Animation utilities
const AnimationUtils = {
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    fadeOut(element, duration = 300) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = (startOpacity * (1 - progress)).toString();
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    slideDown(element, duration = 300) {
        element.style.overflow = 'hidden';
        element.style.height = '0px';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight + 'px';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (progress * parseInt(targetHeight)) + 'px';
            
            if (progress >= 1) {
                element.style.height = 'auto';
                element.style.overflow = 'visible';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
};

// Export utilities
if (typeof window !== 'undefined') {
    window.DateUtils = DateUtils;
    window.DataGenerator = DataGenerator;
    window.StatusUtils = StatusUtils;
    window.DOMUtils = DOMUtils;
    window.ChartUtils = ChartUtils;
    window.StorageUtils = StorageUtils;
    window.AnimationUtils = AnimationUtils;
}
