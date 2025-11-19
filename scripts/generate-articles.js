const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const articlesJsonPath = path.join(srcDir, 'articles.json');
const outputFilePath = path.join(srcDir, 'generated-articles.ts');

try {
    const articlesData = fs.readFileSync(articlesJsonPath, 'utf8');
    const articles = JSON.parse(articlesData);

    let importStatements = '';
    let exportObject = 'export const articleContents: Record<string, string> = {\n';

    articles.forEach((article, index) => {
        const importName = `article_${index}`;
        // Ensure the path is relative to the generated file (which is in src/)
        // The paths in JSON are like "./articles/..." which works if they are relative to src/
        importStatements += `import ${importName} from '${article.file}';\n`;
        exportObject += `  '${article.file}': ${importName},\n`;
    });

    exportObject += '};\n\n';
    exportObject += `export const articles = ${JSON.stringify(articles, null, 2)};\n`;

    const fileContent = `// This file is auto-generated. Do not edit manually.\n\n${importStatements}\n${exportObject}`;

    fs.writeFileSync(outputFilePath, fileContent);
    console.log(`Successfully generated ${outputFilePath}`);

} catch (error) {
    console.error('Error generating articles:', error);
    process.exit(1);
}
