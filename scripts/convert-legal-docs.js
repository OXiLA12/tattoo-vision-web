import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour convertir les fichiers Markdown en HTML
 * Usage: node scripts/convert-legal-docs.js
 */

// Configuration
const LEGAL_DIR = path.join(__dirname, '..', 'legal');
const OUTPUT_DIR = path.join(__dirname, '..', 'legal-site');

// Template HTML
const htmlTemplate = (title, content, lastUpdated) => `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Tattoo Vision</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f7fafc;
            padding: 20px;
            line-height: 1.6;
            color: #2d3748;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 60px 50px;
        }

        .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 3px solid #667eea;
        }

        .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
        }

        h1 {
            color: #1a202c;
            font-size: 36px;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .last-updated {
            color: #718096;
            font-style: italic;
            font-size: 14px;
        }

        .content h2 {
            color: #2d3748;
            font-size: 28px;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }

        .content h3 {
            color: #4a5568;
            font-size: 22px;
            margin-top: 30px;
            margin-bottom: 15px;
        }

        .content h4 {
            color: #667eea;
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        .content p {
            margin-bottom: 15px;
            line-height: 1.8;
        }

        .content ul, .content ol {
            margin-left: 30px;
            margin-bottom: 20px;
        }

        .content li {
            margin-bottom: 10px;
            line-height: 1.6;
        }

        .content strong {
            color: #1a202c;
            font-weight: 600;
        }

        .content a {
            color: #667eea;
            text-decoration: none;
            border-bottom: 1px solid rgba(102, 126, 234, 0.3);
        }

        .content a:hover {
            border-bottom-color: #667eea;
        }

        .content code {
            background: #f7fafc;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #e53e3e;
        }

        .content blockquote {
            border-left: 4px solid #667eea;
            padding-left: 20px;
            margin: 20px 0;
            color: #4a5568;
            font-style: italic;
        }

        .content hr {
            border: none;
            border-top: 2px solid #e2e8f0;
            margin: 40px 0;
        }

        .back-link {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
        }

        .back-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
        }

        .back-link a:hover {
            text-decoration: underline;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            color: #a0aec0;
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 40px 25px;
            }

            h1 {
                font-size: 28px;
            }

            .content h2 {
                font-size: 24px;
            }

            .content h3 {
                font-size: 20px;
            }
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 20px;
            }

            .back-link {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📄</div>
            <h1>${title}</h1>
            <p class="last-updated">${lastUpdated}</p>
        </div>

        <div class="content">
            ${content}
        </div>

        <div class="back-link">
            <a href="index.html">← Retour à l'accueil</a>
        </div>

        <div class="footer">
            <p>© 2026 Tattoo Vision. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;

// Fonction simple pour convertir Markdown en HTML
function markdownToHtml(markdown) {
    let html = markdown;

    // Supprimer le titre principal et la date (déjà dans le template)
    html = html.replace(/^# .+\n\n\*\*Dernière mise à jour\*\* : .+\n\n/m, '');

    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^  - (.+)$/gm, '<li style="margin-left: 20px;">$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs
    html = html.split('\n\n').map(para => {
        if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<hr') || para.startsWith('<li')) {
            return para;
        }
        return para.trim() ? `<p>${para.trim()}</p>` : '';
    }).join('\n');

    // Clean up extra newlines
    html = html.replace(/\n{3,}/g, '\n\n');

    return html;
}

// Fonction pour extraire la date de mise à jour
function extractLastUpdated(markdown) {
    const match = markdown.match(/\*\*Dernière mise à jour\*\* : (.+)/);
    return match ? `Dernière mise à jour : ${match[1]}` : 'Dernière mise à jour : 2026';
}

// Fonction pour extraire le titre
function extractTitle(markdown) {
    const match = markdown.match(/^# (.+)/m);
    return match ? match[1].replace(/ - Tattoo Vision/, '') : 'Document';
}

// Convertir les fichiers
function convertFiles() {
    console.log('🔄 Conversion des documents légaux...\n');

    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Fichiers à convertir
    const files = [
        { input: 'privacy-policy.md', output: 'privacy.html' },
        { input: 'terms-of-service.md', output: 'terms.html' }
    ];

    files.forEach(({ input, output }) => {
        const inputPath = path.join(LEGAL_DIR, input);
        const outputPath = path.join(OUTPUT_DIR, output);

        console.log(`📄 Conversion de ${input}...`);

        // Lire le fichier Markdown
        const markdown = fs.readFileSync(inputPath, 'utf-8');

        // Extraire les métadonnées
        const title = extractTitle(markdown);
        const lastUpdated = extractLastUpdated(markdown);

        // Convertir en HTML
        const content = markdownToHtml(markdown);

        // Générer le HTML final
        const html = htmlTemplate(title, content, lastUpdated);

        // Écrire le fichier HTML
        fs.writeFileSync(outputPath, html, 'utf-8');

        console.log(`✅ ${output} créé avec succès!\n`);
    });

    console.log('✨ Conversion terminée!\n');
    console.log('📁 Fichiers générés dans:', OUTPUT_DIR);
    console.log('\n📋 Fichiers créés:');
    console.log('  - index.html (page d\'accueil)');
    console.log('  - privacy.html (politique de confidentialité)');
    console.log('  - terms.html (conditions d\'utilisation)');
    console.log('  - support.html (page de support)');
    console.log('\n🚀 Prêt à être déployé sur Netlify, Vercel ou GitHub Pages!');
}

// Exécuter la conversion
try {
    convertFiles();
} catch (error) {
    console.error('❌ Erreur lors de la conversion:', error.message);
    process.exit(1);
}
