class SensorsComponent {
  constructor() {
    this.container = document.getElementById("sensors-component");
    this.historyData = [];
    this.filteredData = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.searchQuery = "";
    this.searchField = "all";
    this.sortField = "timestamp"; // mặc định
    this.sortOrder = "desc"; // mặc định mới nhất -> cũ

    this.fetchDataFromAPI();
  }

  async fetchDataFromAPI(searchField = this.searchField, searchQuery = this.searchQuery) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/sensors/history?sortField=${this.sortField}&order=${this.sortOrder}&searchField=${searchField}&searchQuery=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // 👈 thêm token vào đây
          }
        }
      );
      if (!res.ok) throw new Error("Không lấy được dữ liệu từ API");
      const data = await res.json();
  
      this.historyData = data.map((item, index) => ({
        id: item.id || index + 1,
        temperature: item.temperature,
        humidity: item.humidity,
        light: item.light,
        timestamp: item.timestamp || new Date().toISOString(),
      }));
  
      this.filteredData = [...this.historyData];
      this.render();
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu từ API:", err);
      this.container.innerHTML = `<p style="color:red;">Không thể tải dữ liệu từ server</p>`;
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="sensors-dashboard">
        ${this.renderSearchBox()}
        <div id="sensor-table-container">
          ${this.renderDataTable()}
        </div>
      </div>
    `;
    this.attachEventListeners();
  }

  renderSearchBox() {
    return `
      <div class="filter-section" style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      ">
        <select id="sensor-search-field" style="
            flex: 0 0 160px;
            height: 36px;
            padding: 0 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
          ">
          <option value="all" ${this.searchField === "all" ? "selected" : ""}>Tất cả</option>
          <option value="id" ${this.searchField === "id" ? "selected" : ""}>ID</option>
          <option value="temperature" ${this.searchField === "temperature" ? "selected" : ""}>Nhiệt độ</option>
          <option value="humidity" ${this.searchField === "humidity" ? "selected" : ""}>Độ ẩm</option>
          <option value="light" ${this.searchField === "light" ? "selected" : ""}>Ánh sáng</option>
          <option value="timestamp" ${this.searchField === "timestamp" ? "selected" : ""}>Thời gian</option>
        </select>
  
        <input 
          type="text"
          id="sensor-search"
          placeholder="Nhập từ khóa tìm kiếm..."
          value="${this.searchQuery}"
          style="
            flex: 1;
            height: 36px;
            padding: 0 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
          "
        >
      </div>
    `;
  }

  renderDataTable() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageData = this.filteredData.slice(startIndex, endIndex);

    return `
      <div class="table-header">
        <h3 class="table-title">Sensor History</h3>
        <span class="entries-info">
          Showing ${startIndex + 1}-${Math.min(endIndex, this.filteredData.length)} of ${this.filteredData.length} entries
        </span>
      </div>
      <table class="sensor-table">
        <thead>
          <tr>
            ${this.renderSortableHeader("id", "ID")}
            ${this.renderSortableHeader("temperature", "Temperature (°C)")}
            ${this.renderSortableHeader("humidity", "Humidity (%)")}
            ${this.renderSortableHeader("light", "Light (lux)")}
            ${this.renderSortableHeader("timestamp", "Timestamp")}
          </tr>
        </thead>
        <tbody>
          ${pageData.map((item) => this.renderTableRow(item)).join("")}
        </tbody>
      </table>
      ${this.renderPagination()}
    `;
  }

  renderSortableHeader(field, label) {
    const arrow =
      this.sortField === field
        ? this.sortOrder === "desc"
          ? "↓"
          : "↑"
        : "";
    return `<th class="sortable" data-field="${field}" style="cursor:pointer;">${label} ${arrow}</th>`;
  }

  renderTableRow(item) {
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.temperature ?? "-"}</td>
        <td>${item.humidity ?? "-"}</td>
        <td>${item.light ?? "-"}</td>
        <td>${item.timestamp}</td>
      </tr>
    `;
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    return `
      <div class="pagination">
        <button class="btn btn-outline" ${this.currentPage === 1 ? "disabled" : ""} id="prev-page">Previous</button>
        <button class="btn btn-outline" ${this.currentPage === totalPages ? "disabled" : ""} id="next-page">Next</button>
        <div class="pagination-info">
          <span class="items-per-page">Items per page:</span>
          <select class="page-size-select" id="page-size">
            ${[5, 10, 20, 50]
              .map(
                (size) =>
                  `<option value="${size}" ${
                    this.itemsPerPage === size ? "selected" : ""
                  }>${size}</option>`
              )
              .join("")}
          </select>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const searchInput = this.container.querySelector("#sensor-search");
    const searchFieldSelect = this.container.querySelector("#sensor-search-field");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.applySearch();
      });
    }
    if (searchFieldSelect) {
      searchFieldSelect.addEventListener("change", (e) => {
        this.searchField = e.target.value;
        this.applySearch();
      });
    }

    // sort header click
    this.container.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const field = th.dataset.field;
        if (this.sortField === field) {
          // toggle order
          this.sortOrder = this.sortOrder === "desc" ? "asc" : "desc";
        } else {
          this.sortField = field;
          this.sortOrder = "desc";
        }
        this.fetchDataFromAPI(); // gọi API mới
      });
    });

    this.attachPaginationEvents();
  }

  attachPaginationEvents() {
    const prevPage = this.container.querySelector("#prev-page");
    const nextPage = this.container.querySelector("#next-page");
    const pageSize = this.container.querySelector("#page-size");

    if (prevPage)
      prevPage.addEventListener("click", () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.updateTable();
        }
      });
    if (nextPage)
      nextPage.addEventListener("click", () => {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.updateTable();
        }
      });
    if (pageSize)
      pageSize.addEventListener("change", (e) => {
        this.itemsPerPage = parseInt(e.target.value);
        this.currentPage = 1;
        this.updateTable();
      });
  }

  applySearch() {
    const query = this.searchQuery.trim();
    const field = this.searchField;
  
    // gọi lại API
    this.fetchDataFromAPI(field, query);
  }

  updateTable() {
    const tableContainer = this.container.querySelector("#sensor-table-container");
    if (tableContainer) {
      tableContainer.innerHTML = this.renderDataTable();
      this.attachEventListeners();
    }
  }
}

if (typeof window !== "undefined") {
  window.SensorsComponent = SensorsComponent;
}
