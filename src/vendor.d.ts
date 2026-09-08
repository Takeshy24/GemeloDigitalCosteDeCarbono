// Fallback temporal para instalaciones que no exponen las declaraciones de jsPDF.
declare module 'jspdf' {
  const jsPDF: any;
  export default jsPDF;
}

declare module 'xlsx-js-style' {
  export * from 'xlsx';
}
