/**
 * Table.js - Reusable table components
 * All functions return HTML strings for tables
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
 * Create a generic table
 * @param {Array<string>} headers - Array of header strings
 * @param {Array<Array<any>>|Array<Object>} rows - Array of row data (arrays or objects)
 * @param {string} className - Additional CSS classes
 * @returns {string} HTML string for table
 */
function createTable(headers, rows, className = '') {
    const classAttr = className ? ` class="${escapeHtml(className)}"` : '';

    // Create header row
    const headerHtml = headers.map(header =>
        `<th>${escapeHtml(String(header))}</th>`
    ).join('');

    // Create body rows
    const rowsHtml = rows.map(row => {
        let cells;

        // Handle both array and object rows
        if (Array.isArray(row)) {
            cells = row.map(cell =>
                `<td>${escapeHtml(String(cell))}</td>`
            ).join('');
        } else {
            cells = Object.values(row).map(cell =>
                `<td>${escapeHtml(String(cell))}</td>`
            ).join('');
        }

        return `<tr>${cells}</tr>`;
    }).join('');

    return `
        <table${classAttr}>
            <thead>
                <tr>${headerHtml}</tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;
}

/**
 * Create a ranking table for teams
 * Columns: Rang, Équipe, V (Victoires), D (Défaites), PM (Points Marqués),
 *          PE (Points Encaissés), GA (Goal Average)
 * @param {Array<Object>} teams - Array of team objects with ranking data
 * @returns {string} HTML string for ranking table
 */
function createRankingTable(teams) {
    const headers = ['Rang', 'Équipe', 'V', 'D', 'PM', 'PE', 'GA'];

    const rows = teams.map((team, index) => {
        const rank = index + 1;
        const wins = team.wins || 0;
        const losses = team.losses || 0;
        const pointsFor = team.pointsFor || 0;
        const pointsAgainst = team.pointsAgainst || 0;
        const goalAverage = pointsFor - pointsAgainst;

        return [
            rank,
            team.name || 'Équipe inconnue',
            wins,
            losses,
            pointsFor,
            pointsAgainst,
            goalAverage > 0 ? `+${goalAverage}` : goalAverage
        ];
    });

    return createTable(headers, rows, 'ranking-table');
}

/**
 * Create a match table
 * Columns: Équipe 1, Score, Équipe 2, Statut
 * @param {Array<Object>} matches - Array of match objects
 * @returns {string} HTML string for match table
 */
function createMatchTable(matches) {
    const headers = ['Équipe 1', 'Score', 'Équipe 2', 'Statut'];

    const rows = matches.map(match => {
        const team1 = escapeHtml(match.team1 || 'Équipe 1');
        const team2 = escapeHtml(match.team2 || 'Équipe 2');

        let score;
        if (match.status === 'completed' && match.score1 !== undefined && match.score2 !== undefined) {
            score = `${match.score1} - ${match.score2}`;
        } else {
            score = '- - -';
        }

        let status;
        switch (match.status) {
            case 'pending':
                status = 'À venir';
                break;
            case 'in_progress':
                status = 'En cours';
                break;
            case 'completed':
                status = 'Terminé';
                break;
            default:
                status = 'Inconnu';
        }

        return `
            <tr>
                <td>${team1}</td>
                <td class="score">${escapeHtml(score)}</td>
                <td>${team2}</td>
                <td class="status status-${escapeHtml(match.status || 'unknown')}">${escapeHtml(status)}</td>
            </tr>
        `;
    }).join('');

    return `
        <table class="match-table">
            <thead>
                <tr>
                    ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}
