import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour supprimer le fond noir du logo et le rendre transparent
 * 
 * USAGE :
 * node scripts/remove-black-background.js
 */

const LOGO_SOURCE = path.join(__dirname, '..', 'assets', 'logo-original.png');
const LOGO_OUTPUT = path.join(__dirname, '..', 'assets', 'logo-transparent.png');

async function removeBlackBackground() {
    console.log('🎨 Suppression du fond noir du logo...\n');

    try {
        // Lire l'image
        const image = sharp(LOGO_SOURCE);
        const metadata = await image.metadata();

        console.log(`📂 Source : ${LOGO_SOURCE}`);
        console.log(`📐 Dimensions : ${metadata.width}x${metadata.height}\n`);

        // Convertir en raw pour traiter pixel par pixel
        const { data, info } = await image
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Traiter chaque pixel
        const threshold = 30; // Seuil pour considérer un pixel comme "noir"

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Si le pixel est proche du noir (RGB tous < threshold)
            if (r < threshold && g < threshold && b < threshold) {
                // Rendre transparent
                data[i + 3] = 0; // Alpha = 0
            }
        }

        // Créer une nouvelle image avec les pixels modifiés
        await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .png()
            .toFile(LOGO_OUTPUT);

        console.log(`✅ Logo avec transparence créé : ${LOGO_OUTPUT}\n`);
        console.log('📝 Prochaines étapes :');
        console.log('   1. Renommer logo-transparent.png en logo-original.png');
        console.log('   2. Exécuter : node scripts/generate-logo-sizes.js');
        console.log('   3. Rafraîchir l\'app (F5)\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

removeBlackBackground();
