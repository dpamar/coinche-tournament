#!/usr/bin/env node

/**
 * Script de validation de la logique des poules
 * Teste les cas d'usage principaux
 */

// Simuler les classes nécessaires
class MockSetupView {
    constructor() {
        this.tempPoolCount = null;
        this.tempQualifiedCount = 8;
        this.tempTeams = [];
    }

    getMinPoolsForQualified(qualifiedCount) {
        if (qualifiedCount <= 4) return 2;
        else if (qualifiedCount <= 8) return 3;
        else if (qualifiedCount <= 16) return 6;
        else return 11;
    }

    calculatePoolSizesForCount(teamCount, poolCount) {
        const avgSize = teamCount / poolCount;
        if (avgSize < 4 || avgSize > 5) return null;

        const fiveCount = teamCount - (poolCount * 4);
        const fourCount = poolCount - fiveCount;

        if (fiveCount < 0 || (fiveCount > 0 && fiveCount % 2 !== 0)) return null;

        const poolSizes = [];
        for (let i = 0; i < fiveCount; i++) poolSizes.push(5);
        for (let i = 0; i < fourCount; i++) poolSizes.push(4);

        return poolSizes;
    }

    calculateDistribution(teamCount, poolCount) {
        const poolSizes = this.calculatePoolSizesForCount(teamCount, poolCount);
        if (!poolSizes) return null;

        const count4 = poolSizes.filter(s => s === 4).length;
        const count5 = poolSizes.filter(s => s === 5).length;

        if (count4 > 0 && count5 > 0) {
            return `${count4} poules de 4 + ${count5} poules de 5`;
        } else if (count4 > 0) {
            return `${count4} poules de 4`;
        } else {
            return `${count5} poules de 5`;
        }
    }
}

// Tests
function runTests() {
    console.log('=== Tests de validation ===\n');

    const testCases = [
        { teams: 20, qualified: 8, name: 'Cas demandé #1' },
        { teams: 16, qualified: 8, name: 'Cas demandé #2' },
        { teams: 12, qualified: 4, name: 'Petit tournoi' },
        { teams: 24, qualified: 8, name: 'Tournoi moyen' },
        { teams: 18, qualified: 8, name: 'Cas délicat 18' },
        { teams: 22, qualified: 8, name: 'Cas délicat 22' }
    ];

    testCases.forEach(test => {
        console.log(`\n${test.name}: ${test.teams} équipes, ${test.qualified} qualifiés`);
        console.log('─'.repeat(60));

        const view = new MockSetupView();
        view.tempQualifiedCount = test.qualified;
        for (let i = 0; i < test.teams; i++) {
            view.tempTeams.push(`Team ${i + 1}`);
        }

        const minPools = view.getMinPoolsForQualified(test.qualified);
        const maxPools = Math.floor(test.teams / 4);

        console.log(`Poules possibles: ${minPools} à ${maxPools}`);

        let validCount = 0;
        for (let poolCount = minPools; poolCount <= maxPools; poolCount++) {
            const dist = view.calculateDistribution(test.teams, poolCount);
            if (dist) {
                const sizes = view.calculatePoolSizesForCount(test.teams, poolCount);
                console.log(`  ✓ ${poolCount} poules: ${dist}`);
                console.log(`    → Tailles: [${sizes.join(', ')}]`);
                validCount++;
            }
        }

        if (validCount === 0) {
            console.log('  ⚠️  AUCUNE OPTION VALIDE!');
        } else {
            console.log(`  ✅ ${validCount} option(s) valide(s)`);
        }
    });

    console.log('\n=== Tests terminés ===\n');
}

runTests();
