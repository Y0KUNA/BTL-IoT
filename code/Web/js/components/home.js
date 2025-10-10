// Home Component - Main dashboard view
class HomeComponent {
    constructor() {
        this.container = document.getElementById('home-component');
        this.sensorData = {
            temperature: 0,
            humidity: 0,
            light: 0
        };
        this.ledStates = {
            led1: false,
            led2: false,
            led3: false
        };
        this.chartData = [];
        this.activeChartType = 'temperature';

        this.initializeData();
    }

    async initializeData() {
        await this.fetchSensorData();
        await this.fetchLEDState();
        this.render();
        setInterval(() => this.fetchSensorData(), 2000);
        setInterval(() => this.fetchLEDState(), 2000);
    }

    async fetchSensorData() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/sensors', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`  // 👈 thêm token vào đây
                }
              });
            if (!res.ok) throw new Error('Cannot fetch sensor data');
            const data = await res.json();

            this.sensorData = {
                temperature: data.temperature,
                humidity: data.humidity,
                light: data.light
            };

            const now = new Date();
            this.chartData.push({
                temperature: Number(data.temperature ?? 0),
                humidity: Number(data.humidity ?? 0),
                light: Number(data.light ?? 0),
                id: this.chartData.length + 1,
                timestamp: now,
                date: DateUtils.formatDate(now),
                time: DateUtils.formatTime(now)
            });

            if (this.chartData.length > 10) {
                this.chartData = this.chartData.slice(-10);
            }
            console.log("fetch xong");
            if (this.container.classList.contains('active')) {
                this.render();
                console.log("Sensor data updated:", this.sensorData);

            }
        } catch (err) {
            console.error('Lỗi lấy dữ liệu cảm biến:', err);
        }
    }

    // cho gọn bỏ luôn skipRender:
    async fetchLEDState() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/led', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`  // 👈 thêm token vào đây
                }
              });
            if (!res.ok) throw new Error('Cannot fetch LED state');
            const data = await res.json();
            this.ledStates = {
                led1: data.led1 === "ON",
                led2: data.led2 === "ON",
                led3: data.led3 === "ON"
            };
            // luôn render lại khi Home tab đang active
            if (this.container.classList.contains('active')) {
                this.render();
            }
        } catch (err) {
            console.error('Lỗi lấy trạng thái LED:', err);
        }
    }


    async sendLEDState(ledId) {
        try {
          const token = localStorage.getItem('token');
      
          // trạng thái mong muốn (không cập nhật vào this.ledStates)
          const desiredLedStates = { ...this.ledStates, [ledId]: !this.ledStates[ledId] };
          const payload = {
            led1: desiredLedStates.led1 ? "ON" : "OFF",
            led2: desiredLedStates.led2 ? "ON" : "OFF",
            led3: desiredLedStates.led3 ? "ON" : "OFF"
          };
      
          // gửi API
          const res = await fetch('http://localhost:3000/api/led', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
      
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Gửi LED state thất bại');
          }
      
          // Server trả về trạng thái LED thực tế 
          const data = await res.json();
          // cập nhật theo trạng thái thực tế trả về
          this.ledStates = {
            led1: data.ledState.led1 === "ON",
            led2: data.ledState.led2 === "ON",
            led3: data.ledState.led3 === "ON"
          };
      
          this.render();
        } catch (err) {
          console.error('Lỗi gửi trạng thái LED:', err);
          
        }
      }
      
      

    render() {
        console.log("Sensor data updated:", this.sensorData);

        if (!this.container) return;
        this.container.innerHTML = `
            <div class="home-dashboard">
                ${this.renderSensorCards()}
                ${this.renderDashboardGrid()}
            </div>
        `;
        this.attachEventListeners();
        this.renderChart();
    }

    /** 🔥 Tính màu nền theo giá trị cảm biến */
    /** 🔥 Gradient thân thiện đổi theo giá trị */
    getTemperatureGradient(temp) {
        const ratio = Math.min(Math.max(temp / 50, 0), 1);
        const r = Math.round(173 + (255 - 173) * ratio); // từ xanh nhạt (#ADD8E6) sang hồng (#FFB6C1)
        const g = Math.round(216 - (216 - 182) * ratio);
        const b = Math.round(230 - (230 - 193) * ratio);
        const color1 = `rgb(${r},${g},${b})`;
        const color2 = `rgb(${255},${200 - 80 * ratio},${200 - 100 * ratio})`;
        return `linear-gradient(135deg, ${color1}, ${color2})`;
    }

    getHumidityGradient(hum) {
        const ratio = Math.min(Math.max(hum / 100, 0), 1);
        const blue = Math.round(255 - 155 * ratio); // trắng → xanh nhạt
        const color1 = `rgb(${255},${255},${255})`;
        const color2 = `rgb(${100},${200},${blue})`;
        return `linear-gradient(135deg, ${color1}, ${color2})`;
    }

    getLightGradient(light) {
        // chuẩn hoá lux 0–1000 về 0–1
        const ratio = Math.min(Math.max(light / 1000, 0), 1);

        let color1, color2;

        if (light < 400) {
            // Sáng
            color1 = `rgb(255,255,200)`;
            color2 = `rgb(255,255,255)`;
        } else if (light < 700) {
            // Trung bình
            const gray = Math.round(200 - 50 * ratio);
            color1 = `rgb(${gray},${gray},${gray})`;
            color2 = `rgb(240,240,220)`;
        } else {
            // Tối
            color1 = `rgb(20,20,40)`;
            color2 = `rgb(70,70,120)`;
        }

        return `linear-gradient(135deg, ${color1}, ${color2})`;
    }



    /** 🔥 Màu chữ tự động */
    getTextColor(bgGradient) {
        // tìm tất cả giá trị màu trong gradient
        const colors = bgGradient.match(/(rgb\(\d+,\s*\d+,\s*\d+\)|#[0-9a-f]{3,6})/gi);
        if (!colors || colors.length === 0) return "#000000";
        // lấy màu cuối cùng
        let lastColor = colors[colors.length - 1];

        // chuyển về rgb array
        let rgb;
        if (lastColor.startsWith("#")) {
            // chuyển hex sang rgb
            let hex = lastColor.replace("#", "");
            if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
            rgb = [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
        } else {
            rgb = lastColor.match(/\d+/g).map(Number);
        }

        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
        return brightness > 128 ? "#000000" : "#ffffff";
    }


    renderSensorCards() {
        const tempBg = this.getTemperatureGradient(this.sensorData.temperature);
        const humBg = this.getHumidityGradient(this.sensorData.humidity);
        const lightBg = this.getLightGradient(this.sensorData.light);

        const tempText = this.getTextColor(tempBg);
        const humText = this.getTextColor(humBg);
        let lightText = this.sensorData.light < 700 ? "#000000" : "#ffffff";

        return `
        <div class="sensor-grid">
            <div class="sensor-card temperature" style="background:${tempBg}; color:${tempText}; border-radius: 12px; padding: 16px;">
                <div class="sensor-label">🌡 Temperature</div>
                <div class="sensor-value">${this.sensorData.temperature}°C</div>
            </div>

            <div class="sensor-card humidity" style="background:${humBg}; color:${humText}; border-radius: 12px; padding: 16px;">
                <div class="sensor-label">💧 Humidity</div>
                <div class="sensor-value">${this.sensorData.humidity}%</div>
            </div>

            <div class="sensor-card light" style="background:${lightBg}; color:${lightText}; border-radius: 12px; padding: 16px;">
                <div class="sensor-label">💡 Light</div>
                <div class="sensor-value">${this.sensorData.light} lux</div>
            </div>
        </div>
    `;
    }


    renderDashboardGrid() {
        return `
            <div class="dashboard-grid">
                ${this.renderLEDControls()}
                ${this.renderSensorChart()}
            </div>
        `;
    }

    renderLEDControls() {
        const powerConsumption = this.calculatePowerConsumption();

        return `
            <div class="led-controls">
                <div class="led-header">
                    <h2 class="card-title">LED Controls</h2>
                    <div class="connected-indicator">
                        <div class="connected-dot"></div>
                        <span class="connected-text">Connected</span>
                    </div>
                </div>
                <div class="led-list">
                    ${this.renderLEDItem('led1', 'LED 1')}
                    ${this.renderLEDItem('led2', 'LED 2')}
                    ${this.renderLEDItem('led3', 'LED 3')}
                </div>
                <div class="power-consumption">
                    <span class="power-label">Power Consumption</span>
                    <span class="power-value">${powerConsumption}W</span>
                </div>
            </div>
        `;
    }

    renderLEDItem(ledId, ledName) {
        const isOn = this.ledStates[ledId];
        return `
            <div class="led-item">
                <div class="led-info">
                    <div class="led-status-dot ${isOn ? 'on' : 'off'}"></div>
                    <span class="led-name">${ledName}</span>
                </div>
                <div class="led-toggle ${isOn ? 'on' : ''}" data-led="${ledId}">
                    <div class="led-toggle-handle"></div>
                </div>
            </div>
        `;
    }

    renderSensorChart() {
        return `
            <div class="sensor-chart">
                <div class="chart-header">
                    <h2 class="card-title">Sensor Chart</h2>
                </div>
                <canvas id="sensor-chart-canvas"></canvas>
            </div>
        `;
    }
    

    renderChartStats() {
        const stats = ChartUtils.calculateStats(this.chartData, this.activeChartType);
        const unit = this.getUnit(this.activeChartType);
        return `
            <div class="stat-card"><div class="stat-label">Min</div><div class="stat-value">${stats.min.toFixed(1)}${unit}</div></div>
            <div class="stat-card"><div class="stat-label">Max</div><div class="stat-value">${stats.max.toFixed(1)}${unit}</div></div>
            <div class="stat-card"><div class="stat-label">Avg</div><div class="stat-value">${stats.avg.toFixed(1)}${unit}</div></div>
        `;
    }

    attachEventListeners() {
        const ledToggles = this.container.querySelectorAll('.led-toggle');
        ledToggles.forEach(toggle => {
          toggle.addEventListener('click', async (e) => {
            const ledId = e.currentTarget.getAttribute('data-led');
            // gửi trạng thái mới nhưng chưa đổi UI
            await this.sendLEDState(ledId);
          });
        });
      
        const chartTabs = this.container.querySelectorAll('.chart-tab');
        chartTabs.forEach(tab => {
          tab.addEventListener('click', (e) => {
            const chartType = e.target.getAttribute('data-chart');
            this.switchChartType(chartType);
          });
        });
      }
      

    toggleLED(ledId) {
        this.ledStates[ledId] = !this.ledStates[ledId];
        this.render();
    }

    switchChartType(chartType) {
        this.activeChartType = chartType;
        this.renderChart();
    }

    render() {
        if (!this.container) return;
      
        // Nếu chart chưa có thì lần đầu render cả canvas
        if (!this.sensorChartInstance) {
          this.container.innerHTML = `
            <div class="home-dashboard">
              ${this.renderSensorCards()}
              <div class="dashboard-grid">
                ${this.renderLEDControls()}
                <div class="sensor-chart">
                  <div class="chart-header">
                    <h2 class="card-title">Sensor Chart</h2>
                  </div>
                  <canvas id="sensor-chart-canvas"></canvas>
                </div>
              </div>
            </div>
          `;
          this.attachEventListeners();
          // lần đầu khởi tạo chart
          this.renderChart();
        } else {
          // các lần sau chỉ cập nhật phần sensor/LED, KHÔNG ghi đè lại canvas
          const dashboard = this.container.querySelector('.home-dashboard');
          if (dashboard) {
            dashboard.querySelector('.sensor-grid').outerHTML = this.renderSensorCards();
            dashboard.querySelector('.led-controls').outerHTML = this.renderLEDControls();
          }
          this.attachEventListeners();
          // cập nhật dữ liệu chart (chart đã có sẵn)
          this.renderChart();
        }
      }
      
      
      renderChart() {
        const canvas = this.container.querySelector('#sensor-chart-canvas');
        if (!canvas) return;
      
        const labels = this.chartData.map(d => d.time);
      
        if (!this.sensorChartInstance) {
          // chỉ khởi tạo 1 lần
          this.sensorChartInstance = new Chart(canvas, {
            data: {
              labels,
              datasets: [
                {
                  type: 'line',
                  label: 'Temperature (°C)',
                  data: this.chartData.map(d => d.temperature),
                  borderColor: 'red',
                  backgroundColor: 'red',
                  yAxisID: 'y',
                  tension: 0.0
                },
                {
                  type: 'line',
                  label: 'Light (lux)',
                  data: this.chartData.map(d => d.light),
                  borderColor: 'yellow',
                  backgroundColor: 'yellow',
                  yAxisID: 'y1',
                  tension: 0.0
                },
                {
                  type: 'bar',
                  label: 'Humidity (%)',
                  data: this.chartData.map(d => d.humidity),
                  backgroundColor: 'blue',
                  yAxisID: 'y2'
                }
              ]
            },
            options: {
              responsive: true,
              interaction: { mode: 'index', intersect: false },
              stacked: false,
              scales: {
                y: {
                  type: 'linear',
                  position: 'left',
                  min: 0,
                  max: 50,
                  title: { display: true, text: 'Temperature (°C)' }
                },
                y1: {
                  type: 'linear',
                  position: 'right',
                  min: 0,
                  max: 1500,
                  title: { display: true, text: 'Light (lux)' },
                  grid: { drawOnChartArea: false }
                },
                y2: {
                  type: 'linear',
                  position: 'up',
                  min: 0,
                  max: 100,
                  title: { display: true, text: 'Humidity (%)' }
                },
                x: {
                  title: { display: true, text: 'Time' }
                }
              },
              plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
              }
            }
          });
        } else {
          // cập nhật dữ liệu
          this.sensorChartInstance.data.labels = labels;
          this.sensorChartInstance.data.datasets[0].data = this.chartData.map(d => d.temperature);
          this.sensorChartInstance.data.datasets[1].data = this.chartData.map(d => d.light);
          this.sensorChartInstance.data.datasets[2].data = this.chartData.map(d => d.humidity);
          this.sensorChartInstance.update();
        }
      }
      

    calculatePowerConsumption() {
        const onCount = Object.values(this.ledStates).filter(state => state).length;
        return onCount * 0.5;
    }

    getCurrentValue() {
        const value = this.sensorData[this.activeChartType];
        const unit = this.getUnit(this.activeChartType);
        return `${value}${unit}`;
    }

    getUnit(type) {
        switch (type) {
            case 'temperature': return '°C';
            case 'humidity': return '%';
            case 'light': return ' lux';
            default: return '';
        }
    }

    getChartColor(type) {
        switch (type) {
            case 'temperature': return '#FF6B6B';
            case 'humidity': return '#4ECDC4';
            case 'light': return '#FFD93D';
            default: return '#6366F1';
        }
    }
}

if (typeof window !== 'undefined') {
    window.HomeComponent = HomeComponent;
}
