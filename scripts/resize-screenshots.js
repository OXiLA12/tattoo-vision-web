/**
 * Script pour redimensionner les screenshots aux tailles App Store
 * Usage: node scripts/resize-screenshots.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tailles requises par Apple
const SIZES = {
    'iphone-6.7': { width: 1290, height: 2796, name: 'iPhone 14 Pro Max' },
    'iphone-6.5': { width: 1242, height: 2688, name: 'iPhone 11 Pro Max' },
};

const INPUT_DIR = './screenshots/raw';
const OUTPUT_DIR = './screenshots/app-store';

async function resizeScreenshots() {
    // Créer les dossiers si nécessaire
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Lire tous les fichiers du dossier input
    const files = fs.readdirSync(INPUT_DIR).filter(f =>
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
    );

    console.log(`📸 Found ${files.length} screenshots to process\n`);

    for (const file of files) {
        const inputPath = path.join(INPUT_DIR, file);
        const baseName = path.parse(file).name;

        console.log(`Processing: ${file}`);

        for (const [key, size] of Object.entries(SIZES)) {
            const outputPath = path.join(OUTPUT_DIR, `${baseName}-${key}.png`);

            try {
                await sharp(inputPath)
                    .resize(size.width, size.height, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 1 }
                    })
                    .png()
                    .toFile(outputPath);

                console.log(`  ✅ ${size.name}: ${outputPath}`);
            } catch (error) {
                console.error(`  ❌ Error for ${size.name}:`, error.message);
            }
        }

        console.log('');
    }

    console.log('🎉 All screenshots processed!');
    console.log(`📁 Output folder: ${OUTPUT_DIR}`);
}

// Vérifier si sharp est installé
try {
    require.resolve('sharp');
    resizeScreenshots();
} catch (e) {
    console.error('❌ Sharp is not installed!');
    console.log('📦 Install it with: npm install sharp');
    console.log('Then run this script again.');
}
