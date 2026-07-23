/**
 * Button.js - Reusable button components
 * All functions return HTML strings for buttons
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
 * Create a button with custom class
 * Uses data-action attribute for event delegation
 * @param {string} text - Button text
 * @param {string} action - Action identifier or function call for data-action
 * @param {string} className - Additional CSS classes
 * @returns {string} HTML string for button
 */
function createButton(text, action = '', className = '') {
    const escapedText = escapeHtml(text);

    // All actions use data-action for centralized event handling
    const actionAttr = action ? ` data-action="${escapeHtml(action)}"` : '';
    const classAttr = className ? ` class="${escapeHtml(className)}"` : '';

    return `<button type="button"${classAttr}${actionAttr}>${escapedText}</button>`;
}

/**
 * Create a primary button
 * @param {string} text - Button text
 * @param {string} action - Action identifier or function call
 * @returns {string} HTML string for primary button
 */
function createPrimaryButton(text, action = '') {
    return createButton(text, action, 'btn-primary');
}

/**
 * Create a secondary button
 * @param {string} text - Button text
 * @param {string} action - Action identifier or function call
 * @returns {string} HTML string for secondary button
 */
function createSecondaryButton(text, action = '') {
    return createButton(text, action, 'btn-secondary');
}

/**
 * Create a danger button
 * @param {string} text - Button text
 * @param {string} action - Action identifier or function call
 * @returns {string} HTML string for danger button
 */
function createDangerButton(text, action = '') {
    return createButton(text, action, 'btn-danger');
}
