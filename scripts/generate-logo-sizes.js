import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour redimensionner le logo en différentes tailles
 * 
 * PRÉREQUIS :
 * npm install sharp
 * 
 * USAGE :
 * 1. Placer votre logo original dans : project/assets/logo-original.png
 * 2. Exécuter : node scripts/generate-logo-sizes.js
 * 3. Les fichiers seront générés dans public/ et ios/
 */

// Configuration
const LOGO_SOURCE = path.join(__dirname, '..', 'assets', 'logo-original.png');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IOS_ICON_DIR = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

// Tailles à générer
const SIZES = [
    // Pour le web
    { size: 512, name: 'logo.png', dir: PUBLIC_DIR, removeAlpha: false },
    { size: 512, name: 'logo-512.png', dir: PUBLIC_DIR, removeAlpha: false },
    { size: 192, name: 'logo-192.png', dir: PUBLIC_DIR, removeAlpha: false },
    { size: 32, name: 'favicon.png', dir: PUBLIC_DIR, removeAlpha: false },
    { size: 32, name: 'favicon-32.png', dir: PUBLIC_DIR, removeAlpha: false },

    // Pour iOS (App Store - SANS transparence)
    { size: 1024, name: 'AppIcon-1024.png', dir: PUBLIC_DIR, removeAlpha: true },
];

async function generateLogoSizes() {
    console.log('🎨 Génération des différentes tailles de logo...\n');

    // Vérifier que le fichier source existe
    if (!fs.existsSync(LOGO_SOURCE)) {
        console.error('❌ Erreur : Fichier source introuvable !');
        console.error(`   Attendu : ${LOGO_SOURCE}`);
        console.error('\n📝 Instructions :');
        console.error('   1. Créer le dossier : project/assets/');
        console.error('   2. Placer votre logo original dans : project/assets/logo-original.png');
        console.error('   3. Relancer ce script\n');
        process.exit(1);
    }

    // Créer les dossiers si nécessaire
    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    console.log(`📂 Source : ${LOGO_SOURCE}\n`);

    // Générer chaque taille
    for (const config of SIZES) {
        try {
            const outputPath = path.join(config.dir, config.name);

            console.log(`🔄 Génération de ${config.name} (${config.size}x${config.size})...`);

            let pipeline = sharp(LOGO_SOURCE)
                .resize(config.size, config.size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: config.removeAlpha ? 1 : 0 }
                });

            // Supprimer la transparence si nécessaire (pour App Store)
            if (config.removeAlpha) {
                pipeline = pipeline.flatten({ background: '#000000' });
            }

            await pipeline.png().toFile(outputPath);

            console.log(`✅ ${config.name} créé avec succès !`);

            if (config.removeAlpha) {
                console.log(`   ⚠️  Transparence supprimée (requis pour App Store)`);
            }

            console.log('');
        } catch (error) {
            console.error(`❌ Erreur lors de la génération de ${config.name}:`, error.message);
        }
    }

    console.log('✨ Génération terminée !\n');
    console.log('📁 Fichiers générés :');
    console.log('   - public/logo.png (512x512)');
    console.log('   - public/logo-512.png (512x512)');
    console.log('   - public/logo-192.png (192x192)');
    console.log('   - public/favicon.png (32x32)');
    console.log('   - public/favicon-32.png (32x32)');
    console.log('   - public/AppIcon-1024.png (1024x1024, sans transparence)\n');

    console.log('📝 Prochaines étapes :');
    console.log('   1. Vérifier les fichiers générés dans public/');
    console.log('   2. Ajouter AppIcon-1024.png dans Xcode :');
    console.log('      - npx cap open ios');
    console.log('      - Assets.xcassets → AppIcon → Glisser-déposer AppIcon-1024.png');
    console.log('   3. Synchroniser : npx cap sync ios');
    console.log('   4. Tester : npm run dev\n');
}

// Exécuter
generateLogoSizes().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
