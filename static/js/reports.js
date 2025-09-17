// Reports page functionality

let dailyChart, personChart;

// Pagination state
let currentPage = 1;
let pageSize = 25;
let totalRecords = 0;
let allRecords = []; // Store all records for client-side pagination

// Set default date range (last 7 days)
const today = new Date();
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);

document.getElementById('start-date').value = lastWeek.toISOString().split('T')[0];
document.getElementById('end-date').value = today.toISOString().split('T')[0];

// Load initial data
document.addEventListener('DOMContentLoaded', function () {
    loadPersonsForFilter();
    updateReports();
    initializePagination();
});

// Initialize pagination event listeners
function initializePagination() {
    // Page size selector
    document.getElementById('page-size').addEventListener('change', function(e) {
        pageSize = parseInt(e.target.value);
        currentPage = 1; // Reset to first page
        fetchPaginatedRecords(); // Fetch new page from server
    });

    // Previous page button
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            fetchPaginatedRecords(); // Fetch previous page from server
        }
    });

    // Next page button
    document.getElementById('next-page').addEventListener('click', function() {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            fetchPaginatedRecords(); // Fetch next page from server
        }
    });
}

// Load persons for dropdown filter
function loadPersonsForFilter() {
    fetch('/api/persons')
        .then(response => response.json())
        .then(persons => {
            const select = document.getElementById('person-filter');
            // Keep the default option
            select.innerHTML = '<option value="">全部</option>';

            persons.forEach(person => {
                const option = document.createElement('option');
                option.value = person.name;
                option.textContent = person.name;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading persons:', error));
}

function updateReports() {
    currentPage = 1; // Reset to first page when filters change

    // First get all records for statistics and charts, then fetch paginated records
    fetchAllRecordsForStats().then(() => {
        // After we know the total count, fetch paginated records
        fetchPaginatedRecords();
    });
}

// Fetch all records for statistics and charts
function fetchAllRecordsForStats() {
    const person = document.getElementById('person-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let url = '/api/records';
    const params = [];

    if (person) params.push(`person=${person}`);
    if (startDate) params.push(`date_gte=${startDate}`);
    if (endDate) params.push(`date_lte=${endDate}`);

    // Add a high limit for statistics (but still reasonable)
    params.push('limit=10000');

    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            updateStatistics(data);
            updateCharts(data);

            // Store total count for pagination info
            totalRecords = data.length;
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            throw error;
        });
}

// Fetch paginated records for table display
function fetchPaginatedRecords() {
    const person = document.getElementById('person-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let url = '/api/records';
    const params = [];

    if (person) params.push(`person=${person}`);
    if (startDate) params.push(`date_gte=${startDate}`);
    if (endDate) params.push(`date_lte=${endDate}`);

    // Add pagination parameters
    params.push(`limit=${pageSize}`);

    // Calculate offset (skip) for current page
    const offset = (currentPage - 1) * pageSize;
    if (offset > 0) {
        params.push(`skip=${offset}`);
    }

    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            allRecords = data; // This is now just current page records
            updateTableDisplay();
            updatePaginationControls();
        })
        .catch(error => console.error('Error fetching records:', error));
}

function updateStatistics(data) {
    const totalRecords = data.length;
    const totalCigarettes = data.reduce((sum, record) => sum + record.count, 0);
    const dailyAverage = totalRecords > 0 ? (totalCigarettes / totalRecords).toFixed(1) : 0;
    const maxDaily = totalRecords > 0 ? Math.max(...data.map(r => r.count)) : 0;

    document.getElementById('total-records').textContent = totalRecords;
    document.getElementById('total-cigarettes').textContent = totalCigarettes;
    document.getElementById('daily-average').textContent = dailyAverage;
    document.getElementById('max-daily').textContent = maxDaily;
}

function updateCharts(data) {
    // Daily trend chart
    const dailyData = {};
    data.forEach(record => {
        if (!dailyData[record.date]) {
            dailyData[record.date] = 0;
        }
        dailyData[record.date] += record.count;
    });

    const dates = Object.keys(dailyData).sort();
    const counts = dates.map(date => dailyData[date]);

    if (dailyChart) dailyChart.destroy();
    const dailyCtx = document.getElementById('daily-chart').getContext('2d');
    dailyChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '每日抽煙數',
                data: counts,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Person comparison chart
    const personData = {};
    data.forEach(record => {
        if (!personData[record.person]) {
            personData[record.person] = 0;
        }
        personData[record.person] += record.count;
    });

    const persons = Object.keys(personData);
    const personCounts = persons.map(person => personData[person]);

    if (personChart) personChart.destroy();
    const personCtx = document.getElementById('person-chart').getContext('2d');
    personChart = new Chart(personCtx, {
        type: 'bar',
        data: {
            labels: persons,
            datasets: [{
                label: '總抽煙數',
                data: personCounts,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update table display with current page data
function updateTableDisplay() {
    const tbody = document.getElementById('records-table');
    const mobileContainer = document.getElementById('records-mobile');

    tbody.innerHTML = '';
    mobileContainer.innerHTML = '';

    // Sort by date descending
    const sortedRecords = [...allRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">尚無記錄資料</td></tr>';
        mobileContainer.innerHTML = '<div class="px-4 py-8 text-center text-gray-500">尚無記錄資料</div>';
        document.getElementById('pagination-container').style.display = 'none';
        return;
    }

    // Show pagination container
    document.getElementById('pagination-container').style.display = 'block';

    // No need to slice - allRecords is already paginated from server
    // Render all records (which are already the current page records)
    sortedRecords.forEach(record => {
        // Desktop table row
        const row = `
          <tr id="record-row-${record.id}">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.date}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.person}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">${record.count} 支</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="delete-record-btn inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      onclick="deleteRecord(${record.id}, '${record.date}', '${record.person}', ${record.count})">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                刪除
              </button>
            </td>
          </tr>
        `;
        tbody.innerHTML += row;

        // Mobile card view
        const card = `
          <div id="record-mobile-${record.id}" class="px-4 py-4 border-b border-gray-200 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="text-sm font-medium text-gray-900">${record.date}</div>
                  <div class="text-sm text-gray-600">${record.person}</div>
                  <div class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ${record.count} 支
                  </div>
                </div>
              </div>
              <button class="delete-record-btn inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                      onclick="deleteRecord(${record.id}, '${record.date}', '${record.person}', ${record.count})">
                🗑️
              </button>
            </div>
          </div>
        `;
        mobileContainer.innerHTML += card;
    });
}

// Update pagination controls
function updatePaginationControls() {
    if (totalRecords === 0) {
        document.getElementById('pagination-container').style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(totalRecords / pageSize);
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);

    // Update pagination info
    document.getElementById('pagination-start').textContent = startRecord;
    document.getElementById('pagination-end').textContent = endRecord;
    document.getElementById('pagination-total').textContent = totalRecords;

    // Update page size selector
    document.getElementById('page-size').value = pageSize;

    // Update navigation buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    // Generate page numbers
    generatePageNumbers(totalPages);
}

// Generate page number buttons
function generatePageNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById('page-numbers');
    pageNumbersContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Calculate which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Adjust range if we're near the beginning or end
    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }

    // First page and ellipsis
    if (startPage > 1) {
        addPageButton(1, false);
        if (startPage > 2) {
            pageNumbersContainer.innerHTML += '<span class="px-2 py-2 text-sm text-gray-500">...</span>';
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        addPageButton(i, i === currentPage);
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbersContainer.innerHTML += '<span class="px-2 py-2 text-sm text-gray-500">...</span>';
        }
        addPageButton(totalPages, false);
    }
}

// Add page button
function addPageButton(pageNum, isActive) {
    const pageNumbersContainer = document.getElementById('page-numbers');
    const buttonClass = isActive
        ? 'relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-indigo-50 border-indigo-500 text-indigo-600'
        : 'relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50';

    const button = document.createElement('button');
    button.className = buttonClass;
    button.textContent = pageNum;
    button.onclick = () => {
        if (currentPage !== pageNum) {
            currentPage = pageNum;
            fetchPaginatedRecords(); // Fetch selected page from server
        }
    };

    pageNumbersContainer.appendChild(button);
}

function deleteRecord(recordId, date, person, count) {
    if (confirm(`確定要刪除這筆記錄嗎？\n\n日期：${date}\n人物：${person}\n數量：${count} 支`)) {
        fetch(`/api/records/${recordId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    // Remove from allRecords array
                    allRecords = allRecords.filter(record => record.id !== recordId);
                    totalRecords = allRecords.length;

                    // Adjust current page if needed
                    const totalPages = Math.ceil(totalRecords / pageSize);
                    if (currentPage > totalPages && totalPages > 0) {
                        currentPage = totalPages;
                    }

                    // Update statistics and charts with remaining records
                    updateStatistics(allRecords);
                    updateCharts(allRecords);

                    // Update table display and pagination
                    updateTableDisplay();
                    updatePaginationControls();

                    // Show success message
                    showToast('記錄已刪除！');
                } else {
                    showToast('刪除失敗', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('刪除失敗', 'error');
            });
    }
}