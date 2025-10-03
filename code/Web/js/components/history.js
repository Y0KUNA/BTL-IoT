// History Component - LED control history (using API)
class HistoryComponent {
    constructor() {
        this.container = document.getElementById('history-component');
        this.ledHistory = [];
        this.filteredHistory = [];
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
            this.ledHistory = [];
    
            data.forEach(row => {
                // Tìm ra key LED nào tồn tại trong row
                const ledKey = ["led1","led2","led3"].find(k => k in row && row[k] !== undefined);
                if (!ledKey) return; // không có đèn nào => bỏ qua
    
                const state = row[ledKey] === true || row[ledKey] === 1 ? "OFF" : "ON";
    
                this.ledHistory.push({
                    id: row.id, // có thể giữ nguyên id của row luôn
                    device: ledKey.toUpperCase(),
                    status: `Turned ${state}`,
                    timestamp: row.timestamp || "N/A",
                });
            });
    
            this.ledHistory.sort((a, b) => b.id - a.id);
            this.filteredHistory = [...this.ledHistory];
            this.render();
        } catch (error) {
            console.error('Error loading LED history:', error);
            this.showMessage('Không thể tải dữ liệu từ API!', 'error');
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
                <button id="refresh-history" class="refresh-btn">🔄 Refresh</button>
            </div>
        `;
    }

    renderSearchBox() {
        return `
            <input 
                type="text" 
                class="search-box" 
                placeholder="Search by timestamp (e.g., 2025-09-18, 14:30)..."
                value="${this.searchQuery}"
                id="history-search"
            >
        `;
    }

    renderHistoryTable() {
        return `
            <div class="led-history-table">
                ${this.renderTableHeader()}
                ${this.renderTableBody()}
                ${this.renderTableFooter()}
            </div>
        `;
    }

    renderTableHeader() {
        return `
            <div class="led-table-header">
                <div class="led-header-cell">#</div>
                <div class="led-header-cell">DEVICE</div>
                <div class="led-header-cell">STATUS</div>
                <div class="led-header-cell right">TIMESTAMP</div>
            </div>
        `;
    }

    renderTableBody() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredHistory.slice(startIndex, endIndex);

        return pageData.map((item, index) => this.renderTableRow(item, startIndex + index + 1)).join('');
    }

    renderTableRow(item, displayIndex) {
        const statusClass = item.status.includes('ON') ? 'on' : 'off';

        return `
            <div class="led-table-row">
                <div class="led-table-cell id">${displayIndex}</div>
                <div class="led-table-cell device">${item.device}</div>
                <div class="led-table-cell status ${statusClass}">${item.status}</div>
                <div class="led-table-cell timestamp">${item.timestamp}</div>
            </div>
        `;
    }

    renderTableFooter() {
        const totalEntries = this.filteredHistory.length;
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
        const maxVisiblePages = 3;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(`
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return pageNumbers.join('');
    }

    attachEventListeners() {
        const searchInput = this.container.querySelector('#history-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                // gọi API mới
                this.fetchHistoryFromAPI(this.searchQuery);
            });
        }

        const refreshBtn = this.container.querySelector('#refresh-history');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.fetchHistoryFromAPI(this.searchQuery));
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
                    this.updateTable();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.updateTable();
                }
            });
        }

        // ⬇️ Lấy tất cả nút số trang
        const pageButtons = this.container.querySelectorAll('.page-number');
        pageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(e.target.getAttribute('data-page'));
                this.currentPage = page;
                this.updateTable();
            });
        });


        const pageSizeSelect = this.container.querySelector('#page-size');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value, 10); // đổi số item/page
                this.currentPage = 1; // về trang đầu
                this.updateTable(); // render lại bảng
            });
        }
    }


    applySearch() {
        if (!this.searchQuery.trim()) {
            this.filteredHistory = [...this.ledHistory];
        } else {
            const query = this.searchQuery.toLowerCase();
            this.filteredHistory = this.ledHistory.filter(item => {
                return (
                    item.device.toLowerCase().includes(query) ||
                    item.status.toLowerCase().includes(query) ||
                    item.timestamp.toLowerCase().includes(query)
                );
            });
        }
        this.currentPage = 1;
        this.updateTable();
    }

    updateTable() {
        const tableContainer = this.container.querySelector('.led-history-table');
        if (tableContainer) {
            tableContainer.innerHTML = this.renderTableHeader() + this.renderTableBody() + this.renderTableFooter();
            this.attachPaginationEvents();
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
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.HistoryComponent = HistoryComponent;
}
