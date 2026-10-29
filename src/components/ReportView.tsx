import React, { useEffect, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { Report, Section, Field, TableValue, ImageValue, ChartValue } from '@shared/types';
import { THEMES } from '@shared/themes';
import { buildChartData, chartOptions } from '@shared/chartData';
import { sectionHasContent } from '@shared/reportContent';
import { api } from '../api/bridge';
import '../charts/renderChart';

function FieldPreview({ f, sections }: { f: Field; sections: Section[] }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  useEffect(() => {
    const path = f.type === 'image' ? (f.value as ImageValue)?.path : null;
    if (path) api.images.getDataUrl(path).then(setImgSrc); else setImgSrc(null);
  }, [f]);

  switch (f.type) {
    case 'text': case 'number': case 'date': case 'select':
      return f.value !== null && f.value !== undefined && String(f.value) !== '' ? <p><strong>{f.label}:</strong> {String(f.value)}</p> : null;
    case 'textarea': case 'richtext':
      return f.value ? <><h4>{f.label}</h4><p style={{ whiteSpace: 'pre-wrap' }}>{String(f.value)}</p></> : null;
    case 'list': {
      const items = (f.value as string[]) || [];
      return items.length ? <><h4>{f.label}</h4><ul>{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul></> : null;
    }
    case 'table': {
      const tval = f.value as TableValue;
      if (!tval?.rows?.length) return null;
      return (
        <>
          <h4>{f.label}</h4>
          <table className="preview-table">
            <thead><tr>{tval.columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>{tval.rows.map((r, ri) => <tr key={ri}>{tval.columns.map(c => <td key={c.key}>{String(r[c.key] ?? '')}</td>)}</tr>)}</tbody>
          </table>
        </>
      );
    }
    case 'image':
      return imgSrc ? <figure><img src={imgSrc} style={{ maxWidth: '100%' }} /><figcaption>{(f.value as ImageValue)?.caption}</figcaption></figure> : null;
    case 'chart': {
      const c = f.value as ChartValue;
      const data = buildChartData(c, sections);
      if (!data) return null;
      return <figure className="preview-chart"><Chart type={c.chartType} data={data as any} options={{ ...chartOptions(c), animation: false }} /></figure>;
    }
    default: return null;
  }
}

export default function ReportView({ report }: { report: Report }) {
  const theme = THEMES[report.theme];
  const sorted = [...report.sections].sort((a, b) => a.order - b.order);
  const toc = sorted.filter(s => s.showInToc && (s.required || sectionHasContent(s, report.sections)));

  return (
    <div className="report-view" style={{ fontFamily: theme.fontFamily, color: theme.textColor }}>
      <div className="preview-cover" style={{ background: theme.coverBackground }}>
        <h1 style={{ color: theme.headingColor }}>{report.title}</h1>
        <div style={{ color: theme.accentColor }}>{report.period} {report.author && `· ${report.author}`}</div>
      </div>
      <div className="preview-toc">
        <h3>{report.language === 'ru' ? 'Содержание' : 'Contents'}</h3>
        <ol>{toc.map(s => <li key={s.id}>{s.title}</li>)}</ol>
      </div>
      {sorted.map(s => {
        if (!s.required && !sectionHasContent(s, report.sections)) return null;
        const Tag = (`h${Math.min(4, s.level + 1)}` as unknown) as any;
        return (
          <section key={s.id} className="preview-section">
            <Tag style={{ color: theme.headingColor }}>{s.title}</Tag>
            {s.hint && <p className="preview-hint">{s.hint}</p>}
            {[...s.fields].sort((a, b) => a.order - b.order).map(f => <FieldPreview key={f.id} f={f} sections={report.sections} />)}
          </section>
        );
      })}
    </div>
  );
}