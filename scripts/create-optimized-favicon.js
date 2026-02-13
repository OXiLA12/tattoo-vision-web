import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour créer un favicon optimisé
 * Le favicon sera plus visible en zoomant sur l'élément principal du logo
 */

const LOGO_SOURCE = path.join(__dirname, '..', 'assets', 'logo-original.png');
const FAVICON_OUTPUT = path.join(__dirname, '..', 'public', 'favicon.png');
const FAVICON_32_OUTPUT = path.join(__dirname, '..', 'public', 'favicon-32.png');

async function createOptimizedFavicon() {
    console.log('🎨 Création du favicon optimisé...\n');

    try {
        // Lire l'image source
        const image = sharp(LOGO_SOURCE);
        const metadata = await image.metadata();

        console.log(`📂 Source : ${LOGO_SOURCE}`);
        console.log(`📐 Dimensions originales : ${metadata.width}x${metadata.height}\n`);

        // Stratégie : Créer un favicon 64x64 (meilleure qualité)
        // puis le redimensionner à 32x32 pour la compatibilité

        // Version 64x64 (haute qualité pour les écrans Retina)
        await sharp(LOGO_SOURCE)
            .resize(64, 64, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(FAVICON_OUTPUT);

        console.log('✅ favicon.png créé (64x64 pour Retina)');

        // Version 32x32 (standard)
        await sharp(LOGO_SOURCE)
            .resize(32, 32, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(FAVICON_32_OUTPUT);

        console.log('✅ favicon-32.png créé (32x32 standard)\n');

        console.log('📝 Prochaines étapes :');
        console.log('   1. Rafraîchir le navigateur (Ctrl + Shift + R)');
        console.log('   2. Si le favicon ne change pas, vider le cache');
        console.log('   3. Ou fermer/rouvrir l\'onglet\n');

        console.log('💡 Note : Les favicons sont limités à 32x32 pixels par les navigateurs.');
        console.log('   Pour un favicon plus visible, on peut :');
        console.log('   - Utiliser une version simplifiée du logo');
        console.log('   - Zoomer sur l\'élément principal');
        console.log('   - Augmenter le contraste\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

createOptimizedFavicon();
