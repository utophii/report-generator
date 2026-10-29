import { CHART_EXPORT_HEIGHT, CHART_EXPORT_WIDTH } from '../../shared/chartData';

export type ChartImages = Record<string, string>;

export const CHART_ASPECT = CHART_EXPORT_WIDTH / CHART_EXPORT_HEIGHT;

const PNG_DATA_URL = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/;

export function chartImageDataUrl(images: ChartImages, fieldId: string): string | null {
  const url = images[fieldId];
  return url && PNG_DATA_URL.test(url) ? url : null;
}

export function chartImageBuffer(images: ChartImages, fieldId: string): Buffer | null {
  const match = PNG_DATA_URL.exec(images[fieldId] ?? '');
  return match ? Buffer.from(match[1], 'base64') : null;
}
