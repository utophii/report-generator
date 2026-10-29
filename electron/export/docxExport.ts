import fs from 'fs';
import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell,
  TextRun, ImageRun, WidthType
} from 'docx';
import { Report, Field, TableValue, ImageValue, ChartValue } from '../../shared/types';
import { sectionHasContent } from '../../shared/reportContent';
import { ChartImages, chartImageBuffer, CHART_ASPECT } from './chartImages';

function headingLevel(level: number) {
  return [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][Math.min(level, 3) - 1];
}

function docxTable(t: TableValue): Table {
  const headerRow = new TableRow({
    children: t.columns.map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.label, bold: true })] })] }))
  });
  const rows = t.rows.map(row => new TableRow({
    children: t.columns.map(c => new TableCell({ children: [new Paragraph(String(row[c.key] ?? ''))] }))
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] });
}

function fieldToDocxNodes(f: Field, chartImages: ChartImages): (Paragraph | Table)[] {
  const nodes: (Paragraph | Table)[] = [];
  switch (f.type) {
    case 'text': case 'number': case 'date': case 'select':
      if (f.value !== null && f.value !== undefined && String(f.value).trim() !== '') {
        nodes.push(new Paragraph({ children: [new TextRun({ text: `${f.label}: `, bold: true }), new TextRun(String(f.value))] }));
      }
      break;
    case 'textarea': case 'richtext':
      if (f.value) {
        nodes.push(new Paragraph({ text: f.label, heading: HeadingLevel.HEADING_4 }));
        String(f.value).split(/\n+/).forEach(line => nodes.push(new Paragraph(line)));
      }
      break;
    case 'list': {
      const items = (f.value as string[]) || [];
      if (items.length) {
        nodes.push(new Paragraph({ text: f.label, heading: HeadingLevel.HEADING_4 }));
        items.forEach(i => nodes.push(new Paragraph({ text: i, bullet: { level: 0 } })));
      }
      break;
    }
    case 'table': {
      const t = f.value as TableValue;
      if (t?.rows?.length) {
        nodes.push(new Paragraph({ text: f.label, heading: HeadingLevel.HEADING_4 }));
        nodes.push(docxTable(t));
      }
      break;
    }
    case 'image': {
      const img = f.value as ImageValue | null;
      if (img?.path && fs.existsSync(img.path)) {
        nodes.push(new Paragraph({ children: [new ImageRun({ data: fs.readFileSync(img.path), transformation: { width: 400, height: 260 } })] }));
        if (img.caption) nodes.push(new Paragraph({ text: img.caption, alignment: 'center' as any }));
      }
      break;
    }
    case 'chart': {
      const c = f.value as ChartValue;
      const png = chartImageBuffer(chartImages, f.id);
      if (png) {
        if (c.title) nodes.push(new Paragraph({ text: c.title, heading: HeadingLevel.HEADING_4 }));
        nodes.push(new Paragraph({ children: [new ImageRun({ data: png, transformation: { width: 560, height: Math.round(560 / CHART_ASPECT) } })] }));
      }
      break;
    }
  }
  return nodes;
}

export async function exportReportToDocx(report: Report, filePath: string, chartImages: ChartImages): Promise<void> {
  const children: (Paragraph | Table)[] = [];
  children.push(new Paragraph({ text: report.title, heading: HeadingLevel.TITLE }));
  children.push(new Paragraph({ text: `${report.period}${report.author ? ' · ' + report.author : ''}` }));

  for (const s of [...report.sections].sort((a, b) => a.order - b.order)) {
    if (!s.required && !sectionHasContent(s, report.sections)) continue;
    children.push(new Paragraph({ text: s.title, heading: headingLevel(s.level) }));
    if (s.hint) children.push(new Paragraph({ text: s.hint, italics: true } as any));
    for (const f of [...s.fields].sort((a, b) => a.order - b.order)) {
      children.push(...fieldToDocxNodes(f, chartImages));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
}