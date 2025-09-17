// Common utility functions

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    toast.innerHTML = `
        <div class="${bgColor} text-white px-6 py-3 rounded-lg shadow-lg">
            ${message}
        </div>
    `;

    setTimeout(() => {
        toast.innerHTML = '';
    }, 3000);
}

// Common person loading function
function loadPersons(selectElementId = 'person') {
    return fetch('/api/persons')
        .then(response => response.json())
        .then(persons => {
            const select = document.getElementById(selectElementId);
            if (select) {
                // Keep the default option
                select.innerHTML = '<option value="">請選擇人物</option>';

                persons.forEach(person => {
                    const option = document.createElement('option');
                    option.value = person.name;
                    option.textContent = person.name;
                    select.appendChild(option);
                });
            }
            return persons;
        })
        .catch(error => {
            console.error('Error loading persons:', error);
            throw error;
        });
}

// Common HTMX error handler
function handleHTMXError(evt) {
    if (evt.detail.xhr.status === 400) {
        const response = JSON.parse(evt.detail.xhr.responseText);
        showToast(response.detail, 'error');
    }
}