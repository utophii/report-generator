import { Chart as ChartJS, registerables, Plugin } from 'chart.js';
import { ChartValue, Report } from '@shared/types';
import { buildChartData, chartOptions, CHART_EXPORT_HEIGHT, CHART_EXPORT_WIDTH } from '@shared/chartData';

ChartJS.register(...registerables);

const whiteBackground: Plugin = {
  id: 'whiteBackground',
  beforeDraw: chart => {
    const { ctx, width, height } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
};

export function renderChartPng(value: ChartValue, report: Report): string | null {
  const data = buildChartData(value, report.sections);
  if (!data) return null;
  const canvas = document.createElement('canvas');
  canvas.width = CHART_EXPORT_WIDTH;
  canvas.height = CHART_EXPORT_HEIGHT;
  const base = chartOptions(value);
  const chart = new ChartJS(canvas, {
    type: value.chartType,
    data: data as any,
    options: {
      ...base,
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      font: { size: 18 },
      plugins: { ...base.plugins, title: { ...base.plugins.title, font: { size: 24 } } }
    } as any,
    plugins: [whiteBackground]
  });
  try {
    return chart.toBase64Image('image/png', 1);
  } finally {
    chart.destroy();
  }
}

export function renderReportCharts(report: Report): Record<string, string> {
  const images: Record<string, string> = {};
  for (const s of report.sections) {
    for (const f of s.fields) {
      if (f.type !== 'chart') continue;
      const png = renderChartPng(f.value as ChartValue, report);
      if (png) images[f.id] = png;
    }
  }
  return images;
}
