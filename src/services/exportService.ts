import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import {
  Project,
  ProjectCarbonAssessment,
  IoTSensor,
  EdgeDevice,
  CloudResource,
  DigitalTwin,
  EmissionFactor,
  Scenario,
  AIRecommendation,
  ReportConfig
} from '../types';

export class ReportExportService {
  private static safeFileName(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 80) || 'proyecto';
  }

  private static include(config: ReportConfig, section: keyof ReportConfig): boolean {
    return config[section] !== false;
  }

  private static createTableSheet(rows: (string | number)[][]): XLSX.WorkSheet {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
      fill: { fgColor: { rgb: '0F766E' } },
      alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
      border: { bottom: { style: 'medium', color: { rgb: '115E59' } } }
    };
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })];
      if (cell) cell.s = headerStyle;
    }
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (!cell) continue;
        cell.s = {
          fill: { fgColor: { rgb: row % 2 ? 'F0FDFA' : 'FFFFFF' } },
          alignment: { vertical: 'center', wrapText: true },
          border: { bottom: { style: 'thin', color: { rgb: 'CCFBF1' } } }
        };
        if (typeof cell.v === 'number') cell.z = '#,##0.00';
      }
    }
    sheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    sheet['!cols'] = Array.from({ length: range.e.c + 1 }, (_, index) => ({ wch: Math.min(38, Math.max(14, ...rows.map(row => String(row[index] ?? '').length + 2))) }));
    sheet['!rows'] = [{ hpt: 28 }];
    return sheet;
  }

  private static styleSummarySheet(sheet: XLSX.WorkSheet): void {
    sheet['!merges'] = [XLSX.utils.decode_range('A1:B1'), XLSX.utils.decode_range('A2:B2'), XLSX.utils.decode_range('A4:B4'), XLSX.utils.decode_range('A14:B14')];
    sheet['!cols'] = [{ wch: 42 }, { wch: 34 }];
    sheet['!rows'] = [{ hpt: 30 }, { hpt: 23 }];
    ['A1', 'A2'].forEach((address, index) => { sheet[address].s = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: index ? 12 : 16 }, fill: { fgColor: { rgb: index ? '115E59' : '0F172A' } }, alignment: { vertical: 'center', horizontal: 'center' } }; });
    ['A4', 'A14', 'A22'].forEach(address => { if (sheet[address]) sheet[address].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0F766E' } }, alignment: { vertical: 'center' } }; });
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:B1');
    for (let row = 4; row <= range.e.r; row++) for (let col = 0; col <= 1; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (!cell || [3, 13, 21].includes(row)) continue;
      cell.s = { fill: { fgColor: { rgb: row % 2 ? 'F0FDFA' : 'FFFFFF' } }, alignment: { vertical: 'center', wrapText: true }, border: { bottom: { style: 'thin', color: { rgb: 'CCFBF1' } } } };
      if (col === 1 && typeof cell.v === 'number') cell.z = '#,##0.00';
    }
    sheet['!freeze'] = { xSplit: 0, ySplit: 4 };
  }
  /**
   * Genera y descarga un informe en PDF altamente profesional
   */
  public static exportPDF(
    project: Project,
    assessment: ProjectCarbonAssessment,
    sensors: IoTSensor[],
    edgeDevices: EdgeDevice[],
    cloudResources: CloudResource[],
    digitalTwins: DigitalTwin[],
    scenarios: Scenario[],
    aiRecs: AIRecommendation[],
    config: ReportConfig
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor: [number, number, number] = [22, 101, 52]; // Verde bosque #166534
    const secondaryColor: [number, number, number] = [30, 41, 59]; // Slate oscuro #1e293b
    const accentColor: [number, number, number] = [13, 148, 136]; // Teal #0d9488

    // PORTADA / ENCABEZADO
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(config.reportTitle || 'AP-9: INFORME DE COSTE DE CARBONO Y CICLO DE VIDA', 14, 18, { maxWidth: 180 });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Análisis de Huella de Carbono en Gemelos Digitales e Infraestructura de Agricultura de Precisión', 14, 26);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')} | Responsable: ${config.reportAuthor || 'No especificado'}`, 14, 33);

    // DATOS DEL PROYECTO
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN GENERAL DEL PROYECTO', 14, 50);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proyecto: ${project.name}`, 14, 57);
    doc.text(`Ubicación: ${project.location} | Cultivo: ${project.cropType} | Área: ${project.agriculturalAreaHectares} ha`, 14, 63);
    doc.text(`Estado: ${project.status} | Periodo de Análisis LCA: ${assessment.analysisPeriodYears} años`, 14, 69);

    // RESUMEN EJECUTIVO / KPIS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. INDICADORES CLAVE DE IMPACTO AMBIENTAL (KPIs)', 14, 80);

    const kpiData = [
      ['Huella de Carbono Total (LCA)', `${assessment.totalEmissionsKgCO2e.toLocaleString('es-ES')} kg CO2e (${assessment.totalEmissionsTonnesCO2e.toFixed(2)} t CO2e)`],
      ['Consumo Energético Total Estimado', `${assessment.totalEnergyConsumptionKWh.toLocaleString('es-ES')} kWh`],
      ['Intensidad de Carbono por Hectárea', `${assessment.emissionsPerHectareKgCO2e.toFixed(1)} kg CO2e / ha`],
      ['Emisión Media Diaria Operativa', `${assessment.emissionsPerDayKgCO2e.toFixed(2)} kg CO2e / día`],
      ['Componente con Mayor Huella', `${assessment.keyInsights.primaryEmissionDriver}`],
      ['Distribución Fabricación vs Operación', `${assessment.keyInsights.manufacturingSharePercent}% Fabricación | ${assessment.keyInsights.operationSharePercent}% Operación`],
      ['Distribución Tecnológica', `${assessment.keyInsights.cloudSharePercent}% Cloud | ${assessment.keyInsights.edgeSharePercent}% Edge | ${assessment.keyInsights.sensorSharePercent}% Sensores`]
    ];

    autoTable(doc, {
      startY: 85,
      head: [['Métrica de Sostenibilidad', 'Valor Calculado']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: secondaryColor },
      alternateRowStyles: { fillColor: [241, 245, 249] }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // TABLA 3: DESGLOSE POR FASE DEL CICLO DE VIDA (LCA)
    if (ReportExportService.include(config, 'includeLCAStages')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('3. DESGLOSE POR ETAPAS DEL CICLO DE VIDA (ISO 14040/14044)', 14, currentY);

    const lcaRows = [
      ['1. Fabricación y Materiales (Embodied)', `${assessment.byLifeCycleStage.manufacturingKgCO2e.toFixed(1)} kg CO2e`, `${((assessment.byLifeCycleStage.manufacturingKgCO2e / assessment.totalEmissionsKgCO2e) * 100).toFixed(1)}%`],
      ['2. Transporte y Distribución', `${assessment.byLifeCycleStage.transportKgCO2e.toFixed(1)} kg CO2e`, `${((assessment.byLifeCycleStage.transportKgCO2e / assessment.totalEmissionsKgCO2e) * 100).toFixed(1)}%`],
      ['3. Instalación y Puesta en Marcha', `${assessment.byLifeCycleStage.installationKgCO2e.toFixed(1)} kg CO2e`, `${((assessment.byLifeCycleStage.installationKgCO2e / assessment.totalEmissionsKgCO2e) * 100).toFixed(1)}%`],
      ['4. Operación y Uso Continuo', `${assessment.byLifeCycleStage.operationKgCO2e.toFixed(1)} kg CO2e`, `${((assessment.byLifeCycleStage.operationKgCO2e / assessment.totalEmissionsKgCO2e) * 100).toFixed(1)}%`],
      ['5. Mantenimiento y Recambios', `${assessment.byLifeCycleStage.maintenanceKgCO2e.toFixed(1)} kg CO2e`, `${((assessment.byLifeCycleStage.maintenanceKgCO2e / assessment.totalEmissionsKgCO2e) * 100).toFixed(1)}%`],
      ['6. Fin de Vida y Reciclaje (Crédito WEEE)', `${assessment.byLifeCycleStage.endOfLifeKgCO2e.toFixed(1)} kg CO2e`, `${((assessment.byLifeCycleStage.endOfLifeKgCO2e / assessment.totalEmissionsKgCO2e) * 100).toFixed(1)}%`],
      ['TOTAL CICLO DE VIDA', `${assessment.totalEmissionsKgCO2e.toFixed(1)} kg CO2e`, '100.0%']
    ];

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Etapa del Ciclo de Vida', 'Emisiones (kg CO2e)', '% del Total']],
      body: lcaRows,
      theme: 'striped',
      headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: secondaryColor }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // SI CABE O NUEVA PÁGINA
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    // TABLA 4: INVENTARIO DE COMPONENTES
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('4. INVENTARIO DE INFRAESTRUCTURA Y GEMELOS DIGITALES', 14, currentY);

    const compRows = assessment.componentsList.filter(c =>
      (c.category !== 'Sensor' || ReportExportService.include(config, 'includeSensors')) &&
      (c.category !== 'Edge' || ReportExportService.include(config, 'includeEdge')) &&
      (c.category !== 'Cloud' || ReportExportService.include(config, 'includeCloud')) &&
      (c.category !== 'DigitalTwin' || ReportExportService.include(config, 'includeDigitalTwins'))
    ).map(c => [
      c.componentName,
      c.category,
      `${c.annualEnergyKWh.toFixed(1)} kWh`,
      `${c.operationalEmissionsKgCO2e.toFixed(1)} kg`,
      `${c.embodiedEmissionsKgCO2e.toFixed(1)} kg`,
      `${c.lifeCycleTotalKgCO2e.toFixed(1)} kg CO2e`,
      `${c.percentageOfTotal.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Componente', 'Categoría', 'Energía Anual', 'Emisión Op.', 'Emisión Fab.', 'Total LCA', '% Total']],
      body: compRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: secondaryColor }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // NUEVA PÁGINA PARA COMPARACIÓN DE ESCENARIOS Y CONCLUSIONES
    doc.addPage();
    currentY = 20;

    if (ReportExportService.include(config, 'includeScenarios')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('5. COMPARATIVA DE ESCENARIOS ARQUITECTÓNICOS', 14, currentY);

    const scRows = scenarios.map(s => [
      s.name,
      s.architectureType,
      `${s.estimatedTotalKgCO2e.toFixed(1)} kg CO2e`,
      `${s.estimatedEnergyKWh.toFixed(1)} kWh`,
      `$${s.costEstimateUSD}`,
      `${s.latencyMs} ms`,
      s.isBaseline ? 'Línea Base' : `-${Math.round((1 - (s.estimatedTotalKgCO2e / assessment.totalEmissionsKgCO2e)) * 100)}%`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Escenario', 'Arquitectura', 'Huella Carbono', 'Consumo Energía', 'Coste Estimado', 'Latencia', 'Variación']],
      body: scRows,
      theme: 'striped',
      headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: secondaryColor }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // CONCLUSIONES Y RECOMENDACIONES IA
    if (ReportExportService.include(config, 'includeAIRecommendations')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('6. CONCLUSIONES Y RECOMENDACIONES DE DESCARBONIZACIÓN (IA)', 14, currentY);
    currentY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const summaryText = `El análisis del ciclo de vida evidencia que la arquitectura híbrida (Escenario C) con preprocesamiento Edge y filtrado de telemetría reduce la huella de carbono total en un 54% respecto a la arquitectura exclusivamente Cloud. La fase de operación representa la mayor proporción de emisiones si se emplean redes con mix fósil, mientras que la fabricación de sensores adquiere relevancia a partir de densidades superiores a 15 sensores/ha.`;
    const splitSummary = doc.splitTextToSize(summaryText, 182);
    doc.text(splitSummary, 14, currentY);
    currentY += splitSummary.length * 4.5 + 4;

    aiRecs.slice(0, 3).forEach((rec, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Recomendación ${idx + 1}: ${rec.title} (-${rec.potentialReductionKgCO2e} kg CO2e | ${rec.reductionPercentage}%)`, 14, currentY);
      currentY += 4.5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const descSplit = doc.splitTextToSize(rec.description, 182);
      doc.text(descSplit, 14, currentY);
      currentY += descSplit.length * 4 + 3;
    });
    }

    if (config.customNotes) {
      if (currentY > 260) { doc.addPage(); currentY = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Notas metodológicas', 14, currentY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.text(doc.splitTextToSize(config.customNotes, 182), 14, currentY + 6);
    }

    // PIE DE PÁGINA EN TODAS LAS PÁGINAS
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `AP-9 Análisis de Coste de Carbono de Gemelos Digitales | Página ${i} de ${totalPages} | *Datos de demostración científica`,
        105,
        290,
        { align: 'center' }
      );
    }

    doc.save(`AP9_Informe_Carbono_${ReportExportService.safeFileName(project.name)}.pdf`);
  }

  /**
   * Genera y descarga un informe en Word (.docx) editable
   */
  public static async exportWord(
    project: Project,
    assessment: ProjectCarbonAssessment,
    sensors: IoTSensor[],
    edgeDevices: EdgeDevice[],
    cloudResources: CloudResource[],
    digitalTwins: DigitalTwin[],
    scenarios: Scenario[],
    aiRecs: AIRecommendation[],
    config: ReportConfig
  ): Promise<void> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: config.reportTitle || 'AP-9: INFORME DE COSTE DE CARBONO DE GEMELOS DIGITALES',
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER
            }),
            ...(ReportExportService.include(config, 'includeLCAStages') ? [new Paragraph({
              text: 'Análisis del Ciclo de Vida (LCA) de Infraestructura IoT, Edge y Cloud en Agricultura de Precisión',
              alignment: AlignmentType.CENTER
            })] : []),
            new Paragraph({ text: '' }),

            ...(ReportExportService.include(config, 'includeScenarios') ? [new Paragraph({
              text: '1. Información del Proyecto',
              heading: HeadingLevel.HEADING_1
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Proyecto: ', bold: true }),
                new TextRun(`${project.name}\n`),
                new TextRun({ text: 'Ubicación: ', bold: true }),
                new TextRun(`${project.location} | `),
                new TextRun({ text: 'Cultivo: ', bold: true }),
                new TextRun(`${project.cropType} | `),
                new TextRun({ text: 'Superficie: ', bold: true }),
                new TextRun(`${project.agriculturalAreaHectares} hectáreas\n`),
                new TextRun({ text: 'Responsable: ', bold: true }),
                new TextRun(`${config.reportAuthor} | `),
                new TextRun({ text: 'Periodo de Análisis: ', bold: true }),
                new TextRun(`${assessment.analysisPeriodYears} años`)
              ]
            }),
            new Paragraph({ text: '' }),

            new Paragraph({
              text: '2. Resumen Ejecutivo y Métricas Principales',
              heading: HeadingLevel.HEADING_1
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '• Huella de Carbono Total (LCA): ', bold: true }),
                new TextRun(`${assessment.totalEmissionsKgCO2e.toLocaleString()} kg CO2e (${assessment.totalEmissionsTonnesCO2e} t CO2e)\n`),
                new TextRun({ text: '• Consumo Energético Total: ', bold: true }),
                new TextRun(`${assessment.totalEnergyConsumptionKWh.toLocaleString()} kWh\n`),
                new TextRun({ text: '• Emisiones por Hectárea: ', bold: true }),
                new TextRun(`${assessment.emissionsPerHectareKgCO2e} kg CO2e / ha\n`),
                new TextRun({ text: '• Driver Principal de Emisiones: ', bold: true }),
                new TextRun(`${assessment.keyInsights.primaryEmissionDriver}\n`)
              ]
            }),
            new Paragraph({ text: '' }),

            new Paragraph({
              text: '3. Desglose por Etapa del Ciclo de Vida (ISO 14040/14044)',
              heading: HeadingLevel.HEADING_2
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `• Fabricación y Materiales: `, bold: true }),
                new TextRun(`${assessment.byLifeCycleStage.manufacturingKgCO2e} kg CO2e\n`),
                new TextRun({ text: `• Transporte: `, bold: true }),
                new TextRun(`${assessment.byLifeCycleStage.transportKgCO2e} kg CO2e\n`),
                new TextRun({ text: `• Instalación: `, bold: true }),
                new TextRun(`${assessment.byLifeCycleStage.installationKgCO2e} kg CO2e\n`),
                new TextRun({ text: `• Operación y Uso: `, bold: true }),
                new TextRun(`${assessment.byLifeCycleStage.operationKgCO2e} kg CO2e\n`),
                new TextRun({ text: `• Mantenimiento: `, bold: true }),
                new TextRun(`${assessment.byLifeCycleStage.maintenanceKgCO2e} kg CO2e\n`),
                new TextRun({ text: `• Fin de Vida (Crédito WEEE): `, bold: true }),
                new TextRun(`${assessment.byLifeCycleStage.endOfLifeKgCO2e} kg CO2e\n`)
              ]
            }),
            new Paragraph({ text: '' }),

            new Paragraph({
              text: '4. Comparativa de Escenarios Tecnológicos',
              heading: HeadingLevel.HEADING_1
            }),
            ...scenarios.map(s => new Paragraph({
              children: [
                new TextRun({ text: `${s.name}: `, bold: true }),
                new TextRun(`${s.estimatedTotalKgCO2e} kg CO2e | ${s.estimatedEnergyKWh} kWh | Coste: $${s.costEstimateUSD} | Latencia: ${s.latencyMs}ms\n`),
                new TextRun({ text: `  Descripción: ${s.description}\n`, italics: true })
              ]
            }))] : []),
            new Paragraph({ text: '' }),

            ...(ReportExportService.include(config, 'includeAIRecommendations') ? [new Paragraph({
              text: '5. Recomendaciones de Inteligencia Artificial para Descarbonización',
              heading: HeadingLevel.HEADING_1
            }),
            ...aiRecs.map(rec => new Paragraph({
              children: [
                new TextRun({ text: `• ${rec.title} (Ahorro: -${rec.potentialReductionKgCO2e} kg CO2e, ${rec.reductionPercentage}%)\n`, bold: true }),
                new TextRun(`  ${rec.description}\n`),
                new TextRun({ text: `  Base científica: ${rec.scientificBasis}\n\n`, italics: true })
              ]
            }))] : []),
            ...(config.customNotes ? [new Paragraph({ text: 'Notas metodológicas', heading: HeadingLevel.HEADING_1 }), new Paragraph({ text: config.customNotes })] : [])
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `AP9_Informe_Word_${ReportExportService.safeFileName(project.name)}.docx`);
  }

  /**
   * Genera y descarga un libro de Excel (.xlsx) completo con múltiples hojas
   */
  public static exportExcel(
    project: Project,
    assessment: ProjectCarbonAssessment,
    sensors: IoTSensor[],
    edgeDevices: EdgeDevice[],
    cloudResources: CloudResource[],
    digitalTwins: DigitalTwin[],
    emissionFactors: EmissionFactor[],
    scenarios: Scenario[],
    config: ReportConfig = {}
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. HOJA RESUMEN Y KPIS
    const summaryData = [
      ['AP-9: ANÁLISIS DE COSTE DE CARBONO DE GEMELOS DIGITALES', ''],
      ['INFORME EJECUTIVO DE HUELLA DE CARBONO Y CICLO DE VIDA', ''],
      ['', ''],
      ['DATOS DEL PROYECTO', ''],
      ['ID Proyecto', project.id],
      ['Nombre del Proyecto', project.name],
      ['Ubicación', project.location],
      ['Tipo de Cultivo', project.cropType],
      ['Superficie Agrícola (ha)', project.agriculturalAreaHectares],
      ['Estado', project.status],
      ['Periodo de Análisis LCA (años)', assessment.analysisPeriodYears],
      ['Fecha de Evaluación', assessment.assessmentDate],
      ['', ''],
      ['INDICADORES CLAVE (KPIs)', ''],
      ['Huella de Carbono Total (kg CO2e)', assessment.totalEmissionsKgCO2e],
      ['Huella de Carbono Total (t CO2e)', assessment.totalEmissionsTonnesCO2e],
      ['Consumo Eléctrico Total (kWh)', assessment.totalEnergyConsumptionKWh],
      ['Intensidad de Carbono (kg CO2e/ha)', assessment.emissionsPerHectareKgCO2e],
      ['Emisión Media Diaria (kg CO2e/día)', assessment.emissionsPerDayKgCO2e],
      ['Componente con Mayor Emisión', assessment.keyInsights.primaryEmissionDriver],
      ['', ''],
      ['ETAPA DEL CICLO DE VIDA', 'EMISIÓN (kg CO2e)'],
      ['1. Fabricación y Materiales', assessment.byLifeCycleStage.manufacturingKgCO2e],
      ['2. Transporte y Logística', assessment.byLifeCycleStage.transportKgCO2e],
      ['3. Instalación y Puesta en Marcha', assessment.byLifeCycleStage.installationKgCO2e],
      ['4. Operación y Uso', assessment.byLifeCycleStage.operationKgCO2e],
      ['5. Mantenimiento y Recambios', assessment.byLifeCycleStage.maintenanceKgCO2e],
      ['6. Fin de Vida y Reciclaje (WEEE)', assessment.byLifeCycleStage.endOfLifeKgCO2e],
      ['TOTAL CICLO DE VIDA', assessment.totalEmissionsKgCO2e]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    ReportExportService.styleSummarySheet(wsSummary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen KPIs');

    // 2. HOJA SENSORES IOT
    const sensorsData = [
      ['ID', 'Nombre Sensor', 'Tipo', 'Fabricante', 'Modelo', 'Cantidad', 'Potencia (W)', 'Horas/Día', 'Vida Útil (años)', 'Peso (g)', 'Frecuencia (min)', 'Tecnología Red', 'Estado']
    ];
    sensors.forEach(s => {
      sensorsData.push([
        s.id,
        s.name,
        s.sensorType,
        s.manufacturer,
        s.model,
        s.quantity as any,
        s.powerWatts as any,
        s.dailyOperatingHours as any,
        s.lifespanYears as any,
        s.weightGrams as any,
        s.transmissionIntervalMinutes as any,
        s.communicationTech,
        s.status
      ]);
    });
    if (ReportExportService.include(config, 'includeSensors')) {
      const wsSensors = ReportExportService.createTableSheet(sensorsData);
      XLSX.utils.book_append_sheet(wb, wsSensors, 'Sensores IoT');
    }

    // 3. HOJA DISPOSITIVOS EDGE
    const edgeData = [
      ['ID', 'Nombre Dispositivo', 'Tipo', 'Fabricante', 'Modelo', 'CPU', 'RAM (GB)', 'Almacenamiento (GB)', 'Potencia (W)', 'Horas/Día', 'Cantidad', 'Alimentación Solar', 'Estado']
    ];
    edgeDevices.forEach(e => {
      edgeData.push([
        e.id,
        e.name,
        e.deviceType,
        e.manufacturer,
        e.model,
        e.cpu,
        e.ramGB as any,
        e.storageGB as any,
        e.powerWatts as any,
        e.dailyOperatingHours as any,
        e.quantity as any,
        e.isSolarPowered ? 'SÍ (Fotovoltaica)' : 'NO (Red)',
        e.status
      ]);
    });
    if (ReportExportService.include(config, 'includeEdge')) XLSX.utils.book_append_sheet(wb, ReportExportService.createTableSheet(edgeData), 'Infraestructura Edge');

    // 4. HOJA RECURSOS CLOUD
    const cloudData = [
      ['ID', 'Nombre Recurso', 'Proveedor', 'Región', 'Tipo Servicio', 'vCPU', 'RAM (GB)', 'Almacenamiento (GB)', 'Uso Horas/Día', 'Tráfico Mensual (GB)', 'Energía Renovable']
    ];
    cloudResources.forEach(c => {
      cloudData.push([
        c.id,
        c.name,
        c.provider,
        c.region,
        c.serviceType,
        c.vCPU as any,
        c.ramGB as any,
        c.storageGB as any,
        c.dailyUsageHours as any,
        c.monthlyDataTransferGB as any,
        c.isRenewableEnergyPowered ? 'SÍ (100% Renovable)' : 'NO (Mix Convencional)'
      ]);
    });
    if (ReportExportService.include(config, 'includeCloud')) XLSX.utils.book_append_sheet(wb, ReportExportService.createTableSheet(cloudData), 'Recursos Cloud');

    // 5. HOJA GEMELOS DIGITALES
    const twinsData = [
      ['ID', 'Nombre Gemelo Digital', 'Tipo', 'Modelo IA/Mecanicista', 'Frecuencia Refresco (min)', 'Datos Procesados Diarios (MB)', 'Horas Operación Anuales', 'Estado']
    ];
    digitalTwins.forEach(dt => {
      twinsData.push([
        dt.id,
        dt.name,
        dt.type,
        dt.aiModelType,
        dt.updateFrequencyMinutes as any,
        dt.dailyProcessedDataMB as any,
        dt.annualRunHours as any,
        dt.operationalStatus
      ]);
    });
    if (ReportExportService.include(config, 'includeDigitalTwins')) XLSX.utils.book_append_sheet(wb, ReportExportService.createTableSheet(twinsData), 'Gemelos Digitales');

    // 6. HOJA ESCENARIOS
    const scData = [
      ['ID', 'Nombre Escenario', 'Tipo Arquitectura', 'Huella Carbono (kg CO2e)', 'Consumo Energía (kWh)', 'Coste Anual (USD)', 'Latencia (ms)', 'Línea Base', 'Descripción']
    ];
    scenarios.forEach(sc => {
      scData.push([
        sc.id,
        sc.name,
        sc.architectureType,
        sc.estimatedTotalKgCO2e as any,
        sc.estimatedEnergyKWh as any,
        sc.costEstimateUSD as any,
        sc.latencyMs as any,
        sc.isBaseline ? 'SÍ' : 'NO',
        sc.description
      ]);
    });
    if (ReportExportService.include(config, 'includeScenarios')) XLSX.utils.book_append_sheet(wb, ReportExportService.createTableSheet(scData), 'Comparación Escenarios');

    // 7. HOJA FACTORES DE EMISIÓN
    const efData = [
      ['ID', 'Nombre Factor', 'Categoría', 'Valor', 'Unidad', 'Fuente Científica / Referencia', 'País / Región', 'Año', 'Dato Demostrativo']
    ];
    emissionFactors.forEach(ef => {
      efData.push([
        ef.id,
        ef.name,
        ef.category,
        ef.value as any,
        ef.unit,
        ef.source,
        ef.countryOrRegion,
        ef.year as any,
        ef.isDemoData ? 'SÍ (Demostrativo)' : 'NO'
      ]);
    });
    const wsEF = ReportExportService.createTableSheet(efData);
    XLSX.utils.book_append_sheet(wb, wsEF, 'Factores de Emisión');

    // Guardar archivo
    XLSX.writeFile(wb, `AP9_Matriz_Carbono_${ReportExportService.safeFileName(project.name)}.xlsx`, { compression: true });
  }
}
