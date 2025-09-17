// Persons page functionality

// Handle form submission
document.body.addEventListener('htmx:afterRequest', function(evt) {
    if (evt.detail.elt.id === 'add-person-form') {
        if (evt.detail.xhr.status === 200) {
            const person = JSON.parse(evt.detail.xhr.responseText);

            // Check if the persons list is currently showing the empty state
            const personsList = document.getElementById('persons-list');
            const hasEmptyState = personsList.querySelector('.text-center.text-gray-500');

            const html = `
                <div id="person-${person.id}" class="px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div id="display-${person.id}" class="flex items-center">
                                <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                    ${person.name.charAt(0).toUpperCase()}
                                </div>
                                <div class="text-sm font-medium text-gray-900">${person.name}</div>
                            </div>
                            <div id="edit-${person.id}" class="hidden">
                                <form class="flex items-center space-x-2"
                                      hx-put="/api/persons/${person.id}"
                                      hx-target="#person-${person.id}"
                                      hx-swap="outerHTML">
                                    <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                        ${person.name.charAt(0).toUpperCase()}
                                    </div>
                                    <input type="text" name="name" value="${person.name}" required
                                           class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                    <button type="submit" class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                                        儲存
                                    </button>
                                    <button type="button" onclick="cancelEdit(${person.id})"
                                            class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                        取消
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 ml-4">
                            <button onclick="startEdit(${person.id})" id="edit-btn-${person.id}"
                                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                編輯
                            </button>
                            <button class="delete-person inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    hx-delete="/api/persons/${person.id}"
                                    hx-target="#person-${person.id}"
                                    hx-swap="delete"
                                    onclick="return confirmDelete('${person.name}')">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                刪除
                            </button>
                        </div>
                    </div>
                </div>
            `;

            if (hasEmptyState) {
                // If empty state exists, replace entire content
                personsList.innerHTML = html;
            } else {
                // If there are already persons, add to the end
                personsList.insertAdjacentHTML('beforeend', html);
            }

            // Clear form after successful submission
            document.getElementById('add-person-form').reset();
            showToast('人員已成功新增！', 'success');
        } else if (evt.detail.xhr.status === 400) {
            const response = JSON.parse(evt.detail.xhr.responseText);
            showToast(response.detail, 'error');
        }
    }
});

// Custom response handler for edit person form
document.body.addEventListener('htmx:beforeSwap', function(evt) {
    if (evt.detail.elt.tagName === 'FORM' && evt.detail.elt.querySelector('input[name="name"]') && evt.detail.xhr.status === 200) {
        const person = JSON.parse(evt.detail.xhr.responseText);

        const html = `
            <div id="person-${person.id}" class="px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div id="display-${person.id}" class="flex items-center">
                            <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                ${person.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="text-sm font-medium text-gray-900">${person.name}</div>
                        </div>
                        <div id="edit-${person.id}" class="hidden">
                            <form class="flex items-center space-x-2"
                                  hx-put="/api/persons/${person.id}"
                                  hx-target="#person-${person.id}"
                                  hx-swap="outerHTML">
                                <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                    ${person.name.charAt(0).toUpperCase()}
                                </div>
                                <input type="text" name="name" value="${person.name}" required
                                       class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                <button type="submit" class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                                    儲存
                                </button>
                                <button type="button" onclick="cancelEdit(${person.id})"
                                        class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                    取消
                                </button>
                            </form>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <button onclick="startEdit(${person.id})" id="edit-btn-${person.id}"
                                class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            編輯
                        </button>
                        <button class="delete-person inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                hx-delete="/api/persons/${person.id}"
                                hx-target="#person-${person.id}"
                                hx-swap="delete"
                                onclick="return confirmDelete('${person.name}')">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            刪除
                        </button>
                    </div>
                </div>
            </div>
        `;

        evt.detail.serverResponse = html;
    }
});

// Handle edit form success
document.body.addEventListener('htmx:afterRequest', function(evt) {
    if (evt.detail.xhr.status === 200 && evt.detail.elt.tagName === 'FORM' && evt.detail.elt.querySelector('input[name="name"]')) {
        showToast('人員名稱已更新！', 'success');
    } else if (evt.detail.xhr.status === 400 && evt.detail.elt.tagName === 'FORM' && evt.detail.elt.querySelector('input[name="name"]')) {
        const response = JSON.parse(evt.detail.xhr.responseText);
        showToast(response.detail, 'error');
    }
});

// Handle delete success
document.body.addEventListener('htmx:afterRequest', function(evt) {
    if (evt.detail.xhr.status === 200 && evt.detail.elt.classList.contains('delete-person')) {
        showToast('人員已刪除！', 'success');
    } else if (evt.detail.xhr.status === 400 && evt.detail.elt.classList.contains('delete-person')) {
        const response = JSON.parse(evt.detail.xhr.responseText);
        showToast(response.detail, 'error');
    }
});

// Custom response handler for persons list
document.body.addEventListener('htmx:beforeSwap', function(evt) {
    if (evt.detail.target.id === 'persons-list') {
        const persons = JSON.parse(evt.detail.xhr.responseText);
        let html = '';

        if (persons.length === 0) {
            html = `
                <div class="px-6 py-8 text-center text-gray-500">
                    <div class="text-gray-400 text-4xl mb-3">👥</div>
                    <div class="text-sm">尚無人員資料</div>
                    <div class="text-xs text-gray-400 mt-1">請使用上方表單新增人員</div>
                </div>
            `;
        } else {
            persons.forEach(person => {
                html += `
                    <div id="person-${person.id}" class="px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div id="display-${person.id}" class="flex items-center">
                                    <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                        ${person.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="text-sm font-medium text-gray-900">${person.name}</div>
                                </div>
                                <div id="edit-${person.id}" class="hidden">
                                    <form class="flex items-center space-x-2"
                                          hx-put="/api/persons/${person.id}"
                                          hx-target="#person-${person.id}"
                                          hx-swap="outerHTML">
                                        <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                            ${person.name.charAt(0).toUpperCase()}
                                        </div>
                                        <input type="text" name="name" value="${person.name}" required
                                               class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                        <button type="submit" class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                                            儲存
                                        </button>
                                        <button type="button" onclick="cancelEdit(${person.id})"
                                                class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                            取消
                                        </button>
                                    </form>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-4">
                                <button onclick="startEdit(${person.id})" id="edit-btn-${person.id}"
                                        class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    編輯
                                </button>
                                <button class="delete-person inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        hx-delete="/api/persons/${person.id}"
                                        hx-target="#person-${person.id}"
                                        hx-swap="delete"
                                        onclick="return confirmDelete('${person.name}')">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    刪除
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        evt.detail.serverResponse = html;
    }
});

function startEdit(personId) {
    document.getElementById(`display-${personId}`).classList.add('hidden');
    document.getElementById(`edit-${personId}`).classList.remove('hidden');
    document.getElementById(`edit-btn-${personId}`).classList.add('hidden');

    // Focus on input
    const input = document.querySelector(`#edit-${personId} input[name="name"]`);
    input.focus();
    input.select();
}

function cancelEdit(personId) {
    document.getElementById(`display-${personId}`).classList.remove('hidden');
    document.getElementById(`edit-${personId}`).classList.add('hidden');
    document.getElementById(`edit-btn-${personId}`).classList.remove('hidden');
}

function confirmDelete(personName) {
    return confirm(`確定要刪除「${personName}」嗎？\n\n⚠️ 注意：如果該人員有相關記錄，將無法刪除。`);
}

// Handle ESC key to cancel edit
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const editForms = document.querySelectorAll('[id^="edit-"]:not(.hidden)');
        editForms.forEach(form => {
            const personId = form.id.split('-')[1];
            cancelEdit(personId);
        });
    }
});