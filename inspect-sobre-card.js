const fs = require('fs');
const p = 'C:/Users/ERLANE/.gemini/antigravity/scratch/seupatrimonionobrasil/index.html';
const html = fs.readFileSync(p, 'utf8');

const sobreIdx = html.indexOf('Consultora Patrimonial em consórcios imobiliários');
console.log(html.substring(sobreIdx - 400, sobreIdx + 300));
