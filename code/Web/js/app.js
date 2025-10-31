// Main Application Controller
class IoTDashboard {
    constructor() {
        // nếu chưa login thì currentTab = 'login'
        this.currentTab = localStorage.getItem('token') ? 'home' : 'login';

        // Khởi tạo component
        this.components = {
            home: new HomeComponent(),
            profile: new ProfileComponent(),
            sensors: new SensorsComponent(),
            history: new HistoryComponent(),
            login: new LoginComponent(() => this.handleLoginSuccess())
        };

        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadComponent(this.currentTab);
        this.startLiveUpdates();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                console.log(`Navigating to tab: ${tabName}`);
                // Nếu chưa login mà click tab khác login => chặn
                

                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navEl = document.querySelector(`[data-tab="${tabName}"]`);
        if (navEl) navEl.classList.add('active');

        // Update components
        document.querySelectorAll('.component').forEach(component => {
            component.classList.remove('active');
        });
        const tabEl = document.getElementById(`${tabName}-component`);
        if (tabEl) tabEl.classList.add('active');

        // Load component content
        this.currentTab = tabName;
        this.loadComponent(tabName);
        console.log(`Switched to tab: ${tabName}`);
    }

    loadComponent(tabName) {
        const component = this.components[tabName];
        if (component && typeof component.render === 'function') {
            component.render();
        }
    }

    startLiveUpdates() {
        // Update sensor data every 2 seconds
        setInterval(() => {
            if (this.currentTab === 'home' && this.components.home) {
                this.components.home.fetchSensorData();
            }
        }, 2000);

        // Update timestamp every second
        setInterval(() => {
            this.updateLiveIndicator();
        }, 1000);
    }

    updateLiveIndicator(lastUpdateIso) {
  const indicator = document.getElementById("liveIndicator");
  const lastUpdateEl = document.getElementById("lastUpdate");

  // If no timestamp -> offline
  if (!lastUpdateIso) {
    if (indicator) {
      indicator.classList.remove("online");
      indicator.classList.add("offline");
      indicator.textContent = "ESP8266: Offline";
    }
    if (lastUpdateEl) lastUpdateEl.textContent = "—";
    return;
  }

  const last = new Date(lastUpdateIso);
  const ageMs = Date.now() - last.getTime();
  const SENSOR_TIMEOUT_MS = 6000; // keep in sync with backend

  if (ageMs <= SENSOR_TIMEOUT_MS) {
    if (indicator) {
      indicator.classList.remove("offline");
      indicator.classList.add("online");
      indicator.textContent = "ESP8266: Online";
    }
  } else {
    if (indicator) {
      indicator.classList.remove("online");
      indicator.classList.add("offline");
      indicator.textContent = "ESP8266: Offline";
    }
  }

  if (lastUpdateEl) lastUpdateEl.textContent = last.toLocaleString();
}

    handleLoginSuccess() {
        // Được gọi khi LoginComponent login thành công
        // chuyển sang tab home
        this.switchTab('home');
    }
}

// CSS Animation for live indicator
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 0.3; }
        100% { opacity: 0.8; }
    }
`;
document.head.appendChild(style);

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.iotDashboard = new IoTDashboard();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDashboard;
}
