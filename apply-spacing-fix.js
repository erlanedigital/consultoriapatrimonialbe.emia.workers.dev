const fs = require('fs');
const path = require('path');

const basePath = 'C:/Users/ERLANE/.gemini/antigravity/scratch/seupatrimonionobrasil';
const indexPath = path.join(basePath, 'index.html');
const stylesPath = path.join(basePath, 'styles.css');

// 1. Update index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Update Oe copy paragraph to include bottom breathing space
const oldOe = 'function Oe({eyebrow:e,title:t,copy:n,dark:A=!1}){return h("div",{className:"max-w-3xl mx-auto text-center",style:{textAlign:"center",margin:"0 auto"},children:[i("p",{className:`text-[13px] sm:text-[15px] font-extrabold uppercase tracking-[0.22em] text-center w-full block mx-auto ${A?"text-[#E4C98E]":"text-[#8A6E3E]"}`,style:{textAlign:"center",display:"block",width:"100%"},children:e}),i("h2",{className:`font-serif fluid-h2 mt-4 font-medium text-center w-full block mx-auto ${A?"text-white":"text-[#5A1220]"}`,style:{textAlign:"center",display:"block",width:"100%"},children:t}),n&&i("p",{className:`mt-5 text-[16px] leading-7 sm:text-lg text-center w-full block mx-auto ${A?"text-white/75":"text-[#6B5A5E]"}`,style:{textAlign:"center",display:"block",width:"100%"},children:n})]})}';

const newOe = 'function Oe({eyebrow:e,title:t,copy:n,dark:A=!1}){return h("div",{className:"max-w-3xl mx-auto text-center mb-8 sm:mb-12",style:{textAlign:"center",margin:"0 auto 2.5rem auto"},children:[i("p",{className:`text-[13px] sm:text-[15px] font-extrabold uppercase tracking-[0.22em] text-center w-full block mx-auto ${A?"text-[#E4C98E]":"text-[#8A6E3E]"}`,style:{textAlign:"center",display:"block",width:"100%"},children:e}),i("h2",{className:`font-serif fluid-h2 mt-4 font-medium text-center w-full block mx-auto ${A?"text-white":"text-[#5A1220]"}`,style:{textAlign:"center",display:"block",width:"100%"},children:t}),n&&i("p",{className:`mt-5 text-[16px] leading-7 sm:text-lg text-center w-full block mx-auto ${A?"text-white/75":"text-[#6B5A5E]"}`,style:{textAlign:"center",display:"block",width:"100%",marginTop:"1.25rem"},children:n})]})}';

if (html.includes(oldOe)) {
  html = html.replace(oldOe, newOe);
  console.log('Successfully updated Oe in index.html with mb-8 sm:mb-12');
} else {
  console.log('WARNING: oldOe not matched exactly');
}

// Ensure the grid container in "O que é o seu consórcio patrimonial?" has generous space
const oldGrid1 = 'copy:"Sem financiamento e sem pressa artificial. Você constrói seu objetivo mês a mês, com sua estratégia e seu acompanhamento."})}),i("div",{className:"mt-11 grid gap-4 md:grid-cols-3"';
const newGrid1 = 'copy:"Sem financiamento e sem pressa artificial. Você constrói seu objetivo mês a mês, com sua estratégia e seu acompanhamento."})}),i("div",{className:"mt-12 sm:mt-16 grid gap-4 md:grid-cols-3"';

if (html.includes(oldGrid1)) {
  html = html.replace(oldGrid1, newGrid1);
  console.log('Updated grid spacing in O que é o seu consórcio patrimonial');
} else {
  console.log('oldGrid1 not found, checking alternatives');
}

// Ensure grid container in depois-da-contemplacao has generous space
const oldGrid2 = 'A Erlane ajuda você a decidir com calma, sem pressa."})}),h("div",{className:"mt-10 grid gap-4 md:grid-cols-2"';
const newGrid2 = 'A Erlane ajuda você a decidir com calma, sem pressa."})}),h("div",{className:"mt-12 sm:mt-16 grid gap-4 md:grid-cols-2"';

if (html.includes(oldGrid2)) {
  html = html.replace(oldGrid2, newGrid2);
  console.log('Updated grid spacing in depois-da-contemplacao');
} else {
  console.log('oldGrid2 not found, checking alternatives');
}

fs.writeFileSync(indexPath, html, 'utf8');

// 2. Update styles.css
let css = fs.readFileSync(stylesPath, 'utf8');

const spacingStyles = `
/* ==========================================================================
   ESPAÇAMENTO GENEROSO ENTRE A FRASE / CABEÇALHO E OS QUADROS (CARDS)
   ========================================================================== */
.max-w-3xl.mx-auto.text-center {
  margin-bottom: 2.75rem !important;
}

@media (min-width: 640px) {
  .max-w-3xl.mx-auto.text-center {
    margin-bottom: 3.75rem !important;
  }
}

/* Espaçamento em todos os blocos de quadros/cards */
#depois-da-contemplacao .grid,
section[class*="bg-[#5A1220]"] .grid,
#por-que-consorcio .grid,
#como-funciona .grid,
#vantagens .grid {
  margin-top: 2.75rem !important;
}

@media (min-width: 640px) {
  #depois-da-contemplacao .grid,
  section[class*="bg-[#5A1220]"] .grid,
  #por-que-consorcio .grid,
  #como-funciona .grid,
  #vantagens .grid {
    margin-top: 4rem !important;
  }
}
`;

if (!css.includes('ESPAÇAMENTO GENEROSO ENTRE A FRASE')) {
  css += '\n' + spacingStyles;
  fs.writeFileSync(stylesPath, css, 'utf8');
  console.log('Successfully updated styles.css with generous card spacing');
}

// 3. Sync to dist/
fs.writeFileSync(path.join(basePath, 'dist/index.html'), html, 'utf8');
fs.writeFileSync(path.join(basePath, 'dist/styles.css'), css, 'utf8');
console.log('Successfully synced dist/index.html and dist/styles.css');
