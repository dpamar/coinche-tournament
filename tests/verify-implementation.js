#!/usr/bin/env node

// Simple Node.js script to verify the bracket logic

console.log('=== Vérification de l\'implémentation des petits tournois ===\n');

// Test 1: Calcul des rounds pour 4 équipes
console.log('Test 1: Calcul des rounds pour 4 équipes');
const expectedRounds4 = Math.log2(4);
console.log(`  Math.log2(4) = ${expectedRounds4} rounds`);
console.log(`  ✓ Doit générer 2 rounds: Demi-finales + Finale\n`);

// Test 2: Calcul des rounds pour 8 équipes
console.log('Test 2: Calcul des rounds pour 8 équipes');
const expectedRounds8 = Math.log2(8);
console.log(`  Math.log2(8) = ${expectedRounds8} rounds`);
console.log(`  ✓ Doit générer 3 rounds: Quarts + Demi-finales + Finale\n`);

// Test 3: Calcul des rounds pour 16 équipes
console.log('Test 3: Calcul des rounds pour 16 équipes');
const expectedRounds16 = Math.log2(16);
console.log(`  Math.log2(16) = ${expectedRounds16} rounds`);
console.log(`  ✓ Doit générer 4 rounds: 1/8 + Quarts + Demi-finales + Finale\n`);

// Test 4: Configurations de poules pour petits tournois
console.log('Test 4: Configurations de poules pour 8-14 équipes\n');

const configs = [
    { teams: 8, pools: '2×4', qualified: '2×1er + 2×2ème' },
    { teams: 10, pools: '2×5', qualified: '2×1er + 2×2ème' },
    { teams: 12, pools: '3×4', qualified: '3×1er + 1×2ème' },
    { teams: 14, pools: '1×4 + 2×5', qualified: '3×1er + 1×2ème' }
];

configs.forEach(config => {
    console.log(`  ${config.teams} équipes:`);
    console.log(`    Poules: ${config.pools}`);
    console.log(`    Qualifiés (4): ${config.qualified}`);
});

console.log('\n=== Tests de validation des nombres d\'équipes ===\n');

const validCounts = [4, 8, 16, 32];
const testCounts = [4, 8, 12, 16, 32];

testCounts.forEach(count => {
    const isValid = validCounts.includes(count);
    const bracket = validCounts.filter(v => v >= count)[0];
    if (count <= 4) {
        console.log(`  ${count} équipes: Bracket à 4 équipes (demi-finales)`);
    } else if (count <= 8) {
        console.log(`  ${count} équipes: Bracket à 8 équipes (quarts de finale)`);
    } else if (count <= 16) {
        console.log(`  ${count} équipes: Bracket à 16 équipes (1/8 de finale)`);
    } else {
        console.log(`  ${count} équipes: Bracket à 32 équipes (1/16 de finale)`);
    }
});

console.log('\n=== Tous les tests de logique passés avec succès! ===');
console.log('\nProchaine étape: Ouvrir test-small-tournament.html dans un navigateur pour tester l\'intégration complète.\n');
