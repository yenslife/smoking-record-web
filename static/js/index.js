// Index page functionality

// Set today's date and current time as default and load persons
document.addEventListener('DOMContentLoaded', function() {
    const taipeiTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
    const taipeiDate = new Date(taipeiTime);

    document.getElementById('date').value = taipeiDate.toISOString().split('T')[0];
    document.getElementById('time').value = taipeiDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

    loadPersons();
    initQuickRecord();
    updateCurrentDate();

    // Start the daily reset scheduler
    scheduleNextReset();
});

// Quick record functionality
function initQuickRecord() {
    checkAndResetDaily();
    loadQuickRecordPersons();
}

function updateCurrentDate() {
    const now = new Date();
    const taipeiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Taipei"}));
    const dateStr = taipeiTime.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short'
    });
    document.getElementById('current-date').textContent = dateStr;
}

function getTodayKey() {
    const taipeiTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
    return new Date(taipeiTime).toISOString().split('T')[0];
}

function getTodayCount(personName) {
    const key = `quickRecord_${getTodayKey()}_${personName}`;
    return parseInt(localStorage.getItem(key) || '0');
}

function setTodayCount(personName, count) {
    const key = `quickRecord_${getTodayKey()}_${personName}`;
    localStorage.setItem(key, count.toString());
}

function checkAndResetDaily() {
    const lastResetKey = 'lastResetDate';
    const today = getTodayKey();
    const lastReset = localStorage.getItem(lastResetKey);

    if (lastReset !== today) {
        // Clear all previous day's quick records
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('quickRecord_') && !key.includes(today)) {
                localStorage.removeItem(key);
            }
        });
        localStorage.setItem(lastResetKey, today);
    }
}

// Auto-refresh quick record at midnight Taipei time
function scheduleNextReset() {
    const now = new Date();
    const taipeiNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Taipei"}));
    const tomorrow = new Date(taipeiNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - taipeiNow.getTime();

    setTimeout(() => {
        checkAndResetDaily();
        loadQuickRecordPersons();
        updateCurrentDate();
        scheduleNextReset(); // Schedule next reset
    }, msUntilMidnight);
}

function loadQuickRecordPersons() {
    const today = getTodayKey();

    fetch('/api/persons')
        .then(response => response.json())
        .then(persons => {
            const container = document.getElementById('quick-record-list');
            container.innerHTML = '';

            // Load today's actual records from backend for each person
            const personPromises = persons.map(person => {
                return fetch(`/api/records?person=${encodeURIComponent(person.name)}&date=${today}`)
                    .then(response => response.json())
                    .then(records => {
                        // Sum today's cigarette count for this person
                        const actualCount = records.reduce((sum, record) => sum + record.count, 0);

                        // Update localStorage to match backend
                        setTodayCount(person.name, actualCount);

                        return { ...person, count: actualCount };
                    })
                    .catch(error => {
                        console.error(`Error loading records for ${person.name}:`, error);
                        return { ...person, count: 0 };
                    });
            });

            // Wait for all person data to load
            Promise.all(personPromises).then(personsWithCounts => {
                personsWithCounts.forEach(person => {
                    const personHtml = `
                        <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div class="text-lg font-medium text-gray-900">${person.name}</div>
                            <div class="flex items-center space-x-4">
                                <button class="quick-btn-minus w-8 h-8 rounded-full border-2 border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500 font-bold text-lg flex items-center justify-center" data-person="${person.name}">
                                    −
                                </button>
                                <div class="px-4 py-2 border-2 border-gray-300 rounded-lg min-w-[60px] text-center font-bold text-lg" id="count-${person.name}">
                                    ${person.count}
                                </div>
                                <button class="quick-btn-plus w-8 h-8 rounded-full border-2 border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-500 font-bold text-lg flex items-center justify-center" data-person="${person.name}">
                                    +
                                </button>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', personHtml);
                });

                // Add event listeners for quick record buttons
                container.querySelectorAll('.quick-btn-plus').forEach(btn => {
                    btn.addEventListener('click', (e) => updateQuickRecord(e.target.dataset.person, 1));
                });

                container.querySelectorAll('.quick-btn-minus').forEach(btn => {
                    btn.addEventListener('click', (e) => updateQuickRecord(e.target.dataset.person, -1));
                });

            });
        })
        .catch(error => console.error('Error loading persons for quick record:', error));
}

function updateQuickRecord(personName, change) {
    const currentCount = getTodayCount(personName);
    const newCount = Math.max(0, currentCount + change);

    if (newCount !== currentCount) {
        setTodayCount(personName, newCount);

        // Update display immediately with visual feedback
        const countElement = document.getElementById(`count-${personName}`);
        if (countElement) {
            countElement.textContent = newCount;

            // Add visual feedback for the change
            if (change > 0) {
                countElement.style.backgroundColor = '#f0fdf4'; // green background
            } else {
                countElement.style.backgroundColor = '#fef2f2'; // red background
            }
            setTimeout(() => {
                countElement.style.backgroundColor = '';
            }, 300);
        }

        if (change > 0) {
            // Add record to backend when increasing count
            const formData = new FormData();
            formData.append('date', getTodayKey());
            formData.append('person', personName);
            formData.append('count', change.toString());

            // Add current time in Taipei timezone
            const taipeiTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
            const timeStr = new Date(taipeiTime).toTimeString().split(' ')[0]; // HH:MM:SS format
            formData.append('time', timeStr);

            fetch('/api/records', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(record => {
                // Add the new record to the top of the records list immediately
                addRecordToList(record);
                showToast(`已為 ${personName} 新增 ${change} 支煙記錄！`, 'success');

                // Immediately sync all quick record counters
                setTimeout(() => {
                    syncQuickRecordCounters();
                }, 100);
            })
            .catch(error => {
                console.error('Error adding record:', error);
                showToast('新增記錄失敗', 'error');
                // Revert the count on error
                setTodayCount(personName, currentCount);
                document.getElementById(`count-${personName}`).textContent = currentCount;
            });
        } else if (change < 0) {
            // Delete the most recent record for this person when decreasing count
            deleteLatestRecordForPerson(personName);
        }
    }
}

function addRecordToList(record) {
    const recordHtml = `
        <div id="record-${record.id}" class="px-4 sm:px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 sm:space-x-4">
                        <div class="text-sm font-medium text-gray-900">
                            ${record.date} ${record.time ? record.time.substring(0, 5) : ''}
                        </div>
                        <div class="text-sm text-gray-600">
                            ${record.person}
                        </div>
                        <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ${record.count} 支
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-end mt-2 sm:mt-0 sm:ml-4">
                    <button class="delete-record inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            hx-delete="/api/records/${record.id}"
                            hx-target="#record-${record.id}"
                            hx-swap="delete"
                            onclick="return confirmDeleteRecord('${record.date}', '${record.person}', ${record.count}, '${record.time || ''}')">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        <span class="hidden sm:inline">刪除</span>
                        <span class="sm:hidden">🗑️</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Check if the records list is showing empty state
    const recordsList = document.getElementById('records-list');
    const hasEmptyState = recordsList.querySelector('.text-center.text-gray-500');

    if (hasEmptyState) {
        // If empty state exists, replace entire content
        recordsList.innerHTML = recordHtml;
        // Process HTMX attributes for the new content
        htmx.process(recordsList);
    } else {
        // If there are already records, add to the beginning
        recordsList.insertAdjacentHTML('afterbegin', recordHtml);
        // Process HTMX attributes for the newly added record
        const newRecord = document.getElementById(`record-${record.id}`);
        htmx.process(newRecord);
    }

    // Sync quick record counters after adding record to list
    setTimeout(() => {
        syncQuickRecordCounters();
    }, 50);
}

function deleteLatestRecordForPerson(personName) {
    const today = getTodayKey();

    // Find the latest record for this person today
    fetch(`/api/records?person=${encodeURIComponent(personName)}&date=${today}&limit=1`)
        .then(response => response.json())
        .then(records => {
            if (records.length > 0) {
                const latestRecord = records[0];

                // Delete the record from backend
                fetch(`/api/records/${latestRecord.id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.ok) {
                        // Remove the record from the UI
                        const recordElement = document.getElementById(`record-${latestRecord.id}`);
                        if (recordElement) {
                            recordElement.remove();
                        }
                        showToast(`已刪除 ${personName} 的最新記錄`, 'success');
                    } else {
                        throw new Error('Delete failed');
                    }
                })
                .catch(error => {
                    console.error('Error deleting record:', error);
                    showToast('刪除記錄失敗', 'error');
                    // Revert the count on error
                    const currentCount = getTodayCount(personName);
                    setTodayCount(personName, currentCount + 1);
                    document.getElementById(`count-${personName}`).textContent = currentCount + 1;
                });
            } else {
                showToast(`${personName} 今日沒有記錄可刪除`, 'error');
                // Revert the count
                const currentCount = getTodayCount(personName);
                setTodayCount(personName, currentCount + 1);
                document.getElementById(`count-${personName}`).textContent = currentCount + 1;
            }
        })
        .catch(error => {
            console.error('Error finding latest record:', error);
            showToast('查找記錄失敗', 'error');
            // Revert the count
            const currentCount = getTodayCount(personName);
            setTodayCount(personName, currentCount + 1);
            document.getElementById(`count-${personName}`).textContent = currentCount + 1;
        });
}

// Update quick record count after deleting a record from records list
function updateQuickRecordCountAfterDelete(personName) {

    const currentCount = getTodayCount(personName);

    if (currentCount > 0) {
        const newCount = currentCount - 1;
        setTodayCount(personName, newCount);

        // Try multiple ways to find and update the element
        let countElement = document.getElementById(`count-${personName}`);

        // If getElementById fails, try querySelector
        if (!countElement) {
            countElement = document.querySelector(`[id="count-${personName}"]`);
        }

        // If still not found, try finding by partial match
        if (!countElement) {
            const allCountElements = document.querySelectorAll('[id^="count-"]');

            allCountElements.forEach(elem => {
                if (elem.id.includes(personName)) {
                    countElement = elem;
                }
            });
        }

        if (countElement) {
            const oldValue = countElement.textContent;
            countElement.textContent = newCount;

            // Force a visual refresh
            countElement.style.backgroundColor = '#fef2f2';
            setTimeout(() => {
                countElement.style.backgroundColor = '';
            }, 300);
        } else {

            // If direct element update fails, try the sync function
            setTimeout(() => {
                syncQuickRecordCounters();
            }, 100);
        }

    } else {

        // If localStorage shows 0 but we're deleting, sync with backend immediately
        syncQuickRecordCounters();
    }
}

// Sync quick record counters with today's actual records
function syncQuickRecordCounters(retryCount = 0) {
    const today = getTodayKey();

    // Get all persons from quick record list
    const personElements = document.querySelectorAll('[id^="count-"]');

    if (personElements.length === 0 && retryCount < 3) {
        setTimeout(() => {
            syncQuickRecordCounters(retryCount + 1);
        }, 500);
        return;
    } else if (personElements.length === 0) {
        return;
    }

    personElements.forEach(element => {
        const personName = element.id.replace('count-', '');

        // Fetch today's records for this person
        fetch(`/api/records?person=${encodeURIComponent(personName)}&date=${today}`)
            .then(response => response.json())
            .then(records => {
                const actualCount = records.reduce((sum, record) => sum + record.count, 0);

                // Update localStorage and display
                setTodayCount(personName, actualCount);

                // Update the element directly (we already have the reference)
                const oldValue = element.textContent;
                element.textContent = actualCount;

                // Add visual feedback
                element.style.backgroundColor = '#f0f9ff';
                setTimeout(() => {
                    element.style.backgroundColor = '';
                }, 500);
            })
            .catch(error => {
                console.error(`Error syncing records for ${personName}:`, error);
            });
    });
}

// Handle form submission success
document.body.addEventListener('htmx:afterRequest', function(evt) {
    if (evt.detail.xhr.status === 200 && evt.detail.elt.id === 'add-form') {
        const record = JSON.parse(evt.detail.xhr.responseText);

        // Create HTML for the new record
        const recordHtml = `
            <div id="record-${record.id}" class="px-4 sm:px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2 sm:space-x-4">
                            <div class="text-sm font-medium text-gray-900">
                                ${record.date} ${record.time ? record.time.substring(0, 5) : ''}
                            </div>
                            <div class="text-sm text-gray-600">
                                ${record.person}
                            </div>
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ${record.count} 支
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-end mt-2 sm:mt-0 sm:ml-4">
                        <button class="delete-record inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                hx-delete="/api/records/${record.id}"
                                hx-target="#record-${record.id}"
                                hx-swap="delete"
                                onclick="return confirmDeleteRecord('${record.date}', '${record.person}', ${record.count}, '${record.time || ''}')">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <span class="hidden sm:inline">刪除</span>
                            <span class="sm:hidden">🗑️</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Check if the records list is showing empty state
        const recordsList = document.getElementById('records-list');
        const hasEmptyState = recordsList.querySelector('.text-center.text-gray-500');

        if (hasEmptyState) {
            // If empty state exists, replace entire content
            recordsList.innerHTML = recordHtml;
            // Process HTMX attributes for the new content
            htmx.process(recordsList);
        } else {
            // If there are already records, add to the beginning
            recordsList.insertAdjacentHTML('afterbegin', recordHtml);
            // Process HTMX attributes for the newly added record
            const newRecord = document.getElementById(`record-${record.id}`);
            htmx.process(newRecord);
        }

        // Clear form after successful submission
        document.getElementById('add-form').reset();
        const taipeiTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
        const taipeiDate = new Date(taipeiTime);

        document.getElementById('date').value = taipeiDate.toISOString().split('T')[0];
        document.getElementById('time').value = taipeiDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

        // Show success toast
        showToast('記錄已成功新增！', 'success');

        // Sync quick record counters after manual record addition
        setTimeout(() => {
            syncQuickRecordCounters();
        }, 100);
    }
});

// Handle records list response - convert JSON to HTML
document.body.addEventListener('htmx:beforeSwap', function(evt) {
    if (evt.detail.target.id === 'records-list') {
        const records = JSON.parse(evt.detail.xhr.responseText);

        if (records.length === 0) {
            evt.detail.serverResponse = `
                <div class="px-6 py-8 text-center text-gray-500">
                    沒有找到記錄
                </div>
            `;
        } else {
            const recordsHtml = records.map(record => `
                <div id="record-${record.id}" class="px-4 sm:px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-2 sm:space-x-4">
                                <div class="text-sm font-medium text-gray-900">
                                    ${record.date} ${record.time ? record.time.substring(0, 5) : ''}
                                </div>
                                <div class="text-sm text-gray-600">
                                    ${record.person}
                                </div>
                                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ${record.count} 支
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center justify-end mt-2 sm:mt-0 sm:ml-4">
                            <button class="delete-record inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    hx-delete="/api/records/${record.id}"
                                    hx-target="#record-${record.id}"
                                    hx-swap="delete"
                                    onclick="return confirmDeleteRecord('${record.date}', '${record.person}', ${record.count}, '${record.time || ''}')">
                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                <span class="hidden sm:inline">刪除</span>
                                <span class="sm:hidden">🗑️</span>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            evt.detail.serverResponse = recordsHtml;
        }

        // Schedule sync after records list is updated
        setTimeout(() => {
            syncQuickRecordCounters();
        }, 100);
    }
});

// Use MutationObserver to watch for changes in recent records and update quick counts
function setupRecordListObserver() {
    const recordsContainer = document.getElementById('records-list');
    if (!recordsContainer) {
        setTimeout(setupRecordListObserver, 100);
        return;
    }


    const observer = new MutationObserver(function(mutations) {
        let recordDeleted = false;

        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Check if any nodes were removed (deleted records)
                mutation.removedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.id && node.id.startsWith('record-')) {
                        recordDeleted = true;
                    }
                });
            }
        });

        if (recordDeleted) {
            showToast('記錄已刪除！', 'success');
            // Wait a bit to ensure all DOM changes are complete
            setTimeout(() => {
                syncQuickRecordCounters();
            }, 100);
        }
    });

    // Start observing the records container for child list changes
    observer.observe(recordsContainer, {
        childList: true,
        subtree: true
    });

}

// Start the observer when page loads
setupRecordListObserver();

function confirmDeleteRecord(date, person, count, time) {
    const timeStr = time ? ` ${time.substring(0, 5)}` : '';
    return confirm(`確定要刪除這筆記錄嗎？\n\n日期：${date}${timeStr}\n人物：${person}\n數量：${count} 支`);
}