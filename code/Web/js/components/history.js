// History Component - LED control history (using API)
class HistoryComponent {
    constructor() {
        this.container = document.getElementById('history-component');
        this.ledHistory = [];
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.searchQuery = '';

        this.fetchHistoryFromAPI();
    }

    async fetchHistoryFromAPI(search = "") {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                search: search,
                sortField: "id",
                order: "desc"
            });

            const response = await fetch(`http://localhost:3000/api/led/history?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch history');

            const data = await response.json();
            console.log("📦 API Data:", data);

            // Reset old data only after successful fetch
            this.ledHistory = [];

            data.forEach(row => {
                if (!row || !row.led || !row.state) return;

                this.ledHistory.push({
                    id: row.id,
                    device: row.led.toUpperCase(),
                    status: `Turned ${row.state}`,
                    timestamp: row.timestamp || "N/A",
                });
            });

            // Sort by ID descending
            this.ledHistory.sort((a, b) => b.id - a.id);

            this.render();
        } catch (error) {
            console.error('❌ Failed to load LED history:', error);
            this.showMessage('Failed to load data from API!', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="led-history-container">
                ${this.renderHeader()}
                ${this.renderSearchBox()}
                ${this.renderHistoryTable()}
            </div>
        `;

        this.attachEventListeners();
    }

    renderHeader() {
        return `
            <div class="led-history-header">
                <h1 class="card-title">LED Control History</h1>
            </div>
        `;
    }

    renderSearchBox() {
        return `
            <div class="filter-section" style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <input 
                    type="text"
                    id="history-search"
                    placeholder="Search..."
                    value="${this.searchQuery}"
                    style="flex:1;height:36px;padding:0 10px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-size:14px;"
                >
                <button id="search-btn" class="btn btn-primary" style="height:36px;">Search</button>
                <button id="refresh-history" class="btn btn-secondary" style="height:36px;">Refresh</button>
            </div>
        `;
    }

    renderHistoryTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.ledHistory.slice(startIndex, endIndex);

        return `
            <div class="led-history-table">
                ${this.renderTableHeader()}
                ${this.renderTableBody(pageData, startIndex)}
                ${this.renderTableFooter()}
            </div>
        `;
    }

    renderTableHeader() {
        return `
            <div class="led-table-header" style="display:grid;grid-template-columns:80px 1fr 1fr 200px;">
                <div class="led-header-cell">ID</div>
                <div class="led-header-cell">DEVICE</div>
                <div class="led-header-cell">STATUS</div>
                <div class="led-header-cell right">TIMESTAMP</div>
            </div>
        `;
    }

    renderTableBody(pageData, startIndex) {
        if (pageData.length === 0) {
            return `<div class="no-data-row">No data available</div>`;
        }
        return pageData
            .map((item, index) => this.renderTableRow(item, startIndex + index + 1))
            .join('');
    }

    renderTableRow(item) {
        const statusClass = item.status.includes('ON') ? 'on' : 'off';
        return `
            <div class="led-table-row" style="display:grid;grid-template-columns:80px 1fr 1fr 200px;">
                <div class="led-table-cell id">${item.id}</div>
                <div class="led-table-cell device">${item.device}</div>
                <div class="led-table-cell status ${statusClass}">${item.status}</div>
                <div class="led-table-cell timestamp">${item.timestamp}</div>
            </div>
        `;
    }

    renderTableFooter() {
        const totalEntries = this.ledHistory.length;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, totalEntries);
        const totalPages = Math.ceil(totalEntries / this.itemsPerPage);

        return `
            <div class="led-pagination">
                <div class="led-pagination-info">
                    <span>Showing ${totalEntries > 0 ? startIndex + 1 : 0} to ${endIndex} of ${totalEntries} results</span>
                </div>
                <div class="led-pagination-controls">
                    <button class="pagination-btn" id="prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                    ${this.renderPageNumbers(totalPages)}
                    <button class="pagination-btn" id="next-btn" ${this.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>Next</button>
                </div>
                <div class="pagination-info">
                    <span class="items-per-page">Items per page:</span>
                    <select class="page-size-select" id="page-size">
                        ${[5, 10, 20, 50].map(size => `<option value="${size}" ${this.itemsPerPage === size ? "selected" : ""}>${size}</option>`).join("")}
                    </select>
                </div>
            </div>
        `;
    }

    renderPageNumbers(totalPages) {
    const pageNumbers = [];
    const current = this.currentPage;

    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(this.createPageButton(i, i === current));
        }
        return pageNumbers.join("");
    }

    // Gần đầu
    if (current <= 4) {
        for (let i = 1; i <= 4; i++) {
            pageNumbers.push(this.createPageButton(i, i === current));
        }
        pageNumbers.push(`<span class="ellipsis">...</span>`);
        pageNumbers.push(this.createPageButton(totalPages));
    }
    // Gần cuối
    else if (current >= totalPages - 3) {
        pageNumbers.push(this.createPageButton(1));
        pageNumbers.push(`<span class="ellipsis">...</span>`);
        for (let i = totalPages - 3; i <= totalPages; i++) {
            pageNumbers.push(this.createPageButton(i, i === current));
        }
    }
    // Ở giữa
    else {
        pageNumbers.push(this.createPageButton(1));
        pageNumbers.push(`<span class="ellipsis">...</span>`);
        for (let i = current - 1; i <= current + 1; i++) {
            pageNumbers.push(this.createPageButton(i, i === current));
        }
        pageNumbers.push(`<span class="ellipsis">...</span>`);
        pageNumbers.push(this.createPageButton(totalPages));
    }

    return pageNumbers.join("");
}

createPageButton(pageNumber, isActive = false) {
    return `
        <button 
            class="page-number ${isActive ? "active" : ""}" 
            data-page="${pageNumber}"
            style="
                btn btn-outline
            "
        >${pageNumber}</button>
    `;
}


    attachEventListeners() {
        const searchInput = this.container.querySelector('#history-search');
        const searchBtn = this.container.querySelector('#search-btn');
        const refreshBtn = this.container.querySelector('#refresh-history');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.fetchHistoryFromAPI(this.searchQuery);
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.searchQuery = '';
                this.currentPage = 1;
                this.fetchHistoryFromAPI('');
            });
        }

        this.attachPaginationEvents();
    }

    attachPaginationEvents() {
        const prevBtn = this.container.querySelector('#prev-btn');
        const nextBtn = this.container.querySelector('#next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.render();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.ledHistory.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.render();
                }
            });
        }

        const pageButtons = this.container.querySelectorAll('.page-number');
        pageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(e.target.getAttribute('data-page'));
                this.currentPage = page;
                this.render();
            });
        });

        const pageSizeSelect = this.container.querySelector('#page-size');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value, 10);
                this.currentPage = 1;
                this.render();
            });
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `history-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#6366F1'};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(messageEl);
        setTimeout(() => messageEl.remove(), 3000);
    }
}

if (typeof window !== 'undefined') {
    window.HistoryComponent = HistoryComponent;
}
