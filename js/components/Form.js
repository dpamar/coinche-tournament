/**
 * Form.js - Reusable form components
 * All functions return HTML strings for form elements
 */

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Create a text input field
 * @param {string} id - Input ID
 * @param {string} label - Label text
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Initial value
 * @returns {string} HTML string for text input
 */
function createTextInput(id, label, placeholder = '', value = '') {
    const escapedId = escapeHtml(id);
    const escapedLabel = escapeHtml(label);
    const escapedPlaceholder = escapeHtml(placeholder);
    const escapedValue = escapeHtml(value);

    return `
        <div class="form-group">
            <label for="${escapedId}">${escapedLabel}</label>
            <input
                type="text"
                id="${escapedId}"
                name="${escapedId}"
                placeholder="${escapedPlaceholder}"
                value="${escapedValue}"
            />
        </div>
    `;
}

/**
 * Create a number input field
 * @param {string} id - Input ID
 * @param {string} label - Label text
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} value - Initial value
 * @returns {string} HTML string for number input
 */
function createNumberInput(id, label, min, max, value = 0) {
    const escapedId = escapeHtml(id);
    const escapedLabel = escapeHtml(label);
    const escapedMin = escapeHtml(String(min));
    const escapedMax = escapeHtml(String(max));
    const escapedValue = escapeHtml(String(value));

    return `
        <div class="form-group">
            <label for="${escapedId}">${escapedLabel}</label>
            <input
                type="number"
                id="${escapedId}"
                name="${escapedId}"
                min="${escapedMin}"
                max="${escapedMax}"
                value="${escapedValue}"
            />
        </div>
    `;
}

/**
 * Create a select dropdown
 * @param {string} id - Select ID
 * @param {string} label - Label text
 * @param {Array<{value: string, text: string}>} options - Options array
 * @param {string} selected - Selected value (optional)
 * @returns {string} HTML string for select element
 */
function createSelect(id, label, options, selected = '') {
    const escapedId = escapeHtml(id);
    const escapedLabel = escapeHtml(label);

    const optionsHtml = options.map(option => {
        const escapedValue = escapeHtml(option.value);
        const escapedText = escapeHtml(option.text);
        const selectedAttr = option.value === selected ? ' selected' : '';
        return `<option value="${escapedValue}"${selectedAttr}>${escapedText}</option>`;
    }).join('');

    return `
        <div class="form-group">
            <label for="${escapedId}">${escapedLabel}</label>
            <select id="${escapedId}" name="${escapedId}">
                ${optionsHtml}
            </select>
        </div>
    `;
}

/**
 * Create a form group wrapper
 * @param {string} label - Label text
 * @param {string} input - Input HTML string
 * @returns {string} HTML string for form group
 */
function createFormGroup(label, input) {
    const escapedLabel = escapeHtml(label);

    return `
        <div class="form-group">
            <label>${escapedLabel}</label>
            ${input}
        </div>
    `;
}
