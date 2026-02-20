import fs from 'fs';
import path from 'path';

const basePath = 'c:/Users/Clara/Desktop/Projectes/nomade/src';
const filesToProcess = [];

function findFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'ui' && entry.name !== 'data' && entry.name !== 'tests' && entry.name !== 'node_modules') {
            findFiles(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.includes('.test.')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('console.log(') || content.includes('console.error(')) {
                // Skip files already fully converted
                if (content.includes("from '@/utils/logger'") || content.includes("from '../utils/logger'")) {
                    // Already has logger, but might still have console.log
                    if (content.includes('console.log(') || content.includes('console.error(')) {
                        filesToProcess.push(fullPath);
                    }
                } else {
                    filesToProcess.push(fullPath);
                }
            }
        }
    }
}

findFiles(path.join(basePath, 'hooks'));
findFiles(path.join(basePath, 'pages'));
findFiles(path.join(basePath, 'components'));

// Emoji regex pattern
const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F000}-\u{1FFFF}\u{E0020}-\u{E007F}✅❌⏳]/gu;

let totalReplacements = 0;
let filesModified = 0;

for (const filePath of filesToProcess) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Add logger import if not already present
    if (!content.includes("from '@/utils/logger'") && !content.includes("from '../utils/logger'")) {
        // Find last import statement
        const lines = content.split('\n');
        let lastImportLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                lastImportLine = i;
            }
        }
        if (lastImportLine >= 0) {
            lines.splice(lastImportLine + 1, 0, "import { logger } from '@/utils/logger';");
            content = lines.join('\n');
        }
    }

    // Replace console.log -> logger.debug
    // Handle multiline console.log calls
    content = content.replace(/if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*console\.log\(/g, () => {
        totalReplacements++;
        return 'logger.debug(';
    });

    content = content.replace(/console\.log\(/g, () => {
        totalReplacements++;
        return 'logger.debug(';
    });

    // Replace console.error -> logger.error
    content = content.replace(/console\.error\(/g, () => {
        totalReplacements++;
        return 'logger.error(';
    });

    // Clean emoji prefixes from string arguments
    content = content.replace(/logger\.(debug|error|info|warn)\('([^']*?)'/g, (match, level, msg) => {
        const cleaned = msg.replace(emojiPattern, '').replace(/^\s+/, '').replace(/\s+$/, '');
        return `logger.${level}('${cleaned}'`;
    });

    content = content.replace(/logger\.(debug|error|info|warn)\(`([^`]*?)`/g, (match, level, msg) => {
        const cleaned = msg.replace(emojiPattern, '').replace(/^\s+/, '').replace(/\s+$/, '');
        return `logger.${level}(\`${cleaned}\``;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesModified++;
        console.log(`Modified: ${path.relative(basePath, filePath)}`);
    }
}

console.log(`\nTotal files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`);
