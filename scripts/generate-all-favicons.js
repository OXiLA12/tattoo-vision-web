import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère plusieurs versions du favicon avec padding pour meilleure visibilité
 */

const LOGO_SOURCE = path.join(__dirname, '..', 'assets', 'logo-original.png');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function generateFavicons() {
    console.log('🎨 Génération des favicons optimisés...\n');

    try {
        // Favicon 16x16 (très petit, pour les onglets)
        await sharp(LOGO_SOURCE)
            .resize(16, 16, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'favicon-16.png'));
        console.log('✅ favicon-16.png créé (16x16)');

        // Favicon 32x32 (standard)
        await sharp(LOGO_SOURCE)
            .resize(32, 32, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'favicon-32.png'));
        console.log('✅ favicon-32.png créé (32x32)');

        // Favicon 48x48 (Windows)
        await sharp(LOGO_SOURCE)
            .resize(48, 48, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'favicon-48.png'));
        console.log('✅ favicon-48.png créé (48x48)');

        // Favicon 64x64 (haute qualité)
        await sharp(LOGO_SOURCE)
            .resize(64, 64, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
        console.log('✅ favicon.png créé (64x64 - Retina)');

        // Version avec padding pour meilleure visibilité
        // On ajoute un padding de 20% pour que le logo ne touche pas les bords
        const sizes = [
            { size: 32, name: 'favicon-32-padded.png', padding: 6 },
            { size: 64, name: 'favicon-padded.png', padding: 12 }
        ];

        for (const config of sizes) {
            const logoSize = config.size - (config.padding * 2);

            await sharp(LOGO_SOURCE)
                .resize(logoSize, logoSize, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .extend({
                    top: config.padding,
                    bottom: config.padding,
                    left: config.padding,
                    right: config.padding,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(path.join(PUBLIC_DIR, config.name));

            console.log(`✅ ${config.name} créé (${config.size}x${config.size} avec padding)`);
        }

        console.log('\n✨ Tous les favicons ont été générés !\n');
        console.log('📝 Prochaines étapes :');
        console.log('   1. Rafraîchir le navigateur avec Ctrl + Shift + R');
        console.log('   2. Vider le cache si nécessaire');
        console.log('   3. Fermer/rouvrir l\'onglet pour forcer le rechargement\n');

        console.log('💡 Astuce : Si le favicon est toujours trop petit,');
        console.log('   c\'est normal - les navigateurs limitent la taille à 16-32px.');
        console.log('   Le logo dans la sidebar (12x12) est déjà beaucoup plus visible !\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

generateFavicons();
