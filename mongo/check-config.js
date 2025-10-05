/**
 * Script de vérification de la configuration
 * Exécutez: node check-config.js
 */

require('dotenv').config();

console.log('\n========================================');
console.log('🔍 VÉRIFICATION DE LA CONFIGURATION');
console.log('========================================\n');

// Vérifier les variables d'environnement
const requiredVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'API_PREFIX'];
const missingVars = [];

console.log('📋 Variables d\'environnement:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: MANQUANT`);
  } else {
    // Masquer les valeurs sensibles
    if (varName === 'JWT_SECRET' || varName === 'MONGODB_URI') {
      const masked = value.substring(0, 10) + '...' + value.substring(value.length - 5);
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }
});

console.log('\n========================================');

if (missingVars.length > 0) {
  console.log('⚠️  ATTENTION: Variables manquantes!');
  console.log('Créez un fichier .env avec ces variables:');
  missingVars.forEach(v => console.log(`  - ${v}`));
  console.log('\nCopiez .env.example en .env et remplissez les valeurs.');
  process.exit(1);
} else {
  console.log('✅ Configuration OK!');
  console.log(`\n🚀 Le serveur démarrera sur: http://localhost:${process.env.PORT}${process.env.API_PREFIX}`);
  console.log('========================================\n');
}
