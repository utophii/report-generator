const RU_MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const EN_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const EN_MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const ROMAN = ['I', 'II', 'III', 'IV'];

const pad = (n: number) => String(n).padStart(2, '0');
const DAY_MS = 86_400_000;

function matchCase(sample: string, word: string): string {
  if (sample === sample.toUpperCase()) return word.toUpperCase();
  if (sample[0] === sample[0].toUpperCase()) return word[0].toUpperCase() + word.slice(1);
  return word;
}

function utc(y: number, m: number, d: number): Date | null {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function isoWeeksInYear(y: number): number {
  const jan1 = new Date(Date.UTC(y, 0, 1)).getUTCDay();
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return jan1 === 4 || (leap && jan1 === 3) ? 53 : 52;
}

function shiftRange(start: Date, end: Date): [Date, Date] | null {
  if (end < start) return null;
  const sy = start.getUTCFullYear(), sm = start.getUTCMonth() + 1;
  const ey = end.getUTCFullYear(), em = end.getUTCMonth() + 1;
  if (start.getUTCDate() === 1 && end.getUTCDate() === lastDayOfMonth(ey, em)) {
    const months = (ey - sy) * 12 + (em - sm) + 1;
    const ns = new Date(Date.UTC(sy, sm - 1 + months, 1));
    const ne = new Date(Date.UTC(ey, em + months, 0));
    return [ns, ne];
  }
  const len = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return [new Date(start.getTime() + len * DAY_MS), new Date(end.getTime() + len * DAY_MS)];
}

type Rule = { re: RegExp; next: (m: RegExpExecArray) => string | null };

const SEP = String.raw`(\s*(?:[–—-]|\.\.|по|to)\s*)`;

const RULES: Rule[] = [
  {
    re: new RegExp(String.raw`(\d{1,2})\.(\d{1,2})\.(\d{4})${SEP}(\d{1,2})\.(\d{1,2})\.(\d{4})`, 'i'),
    next: m => {
      const s = utc(+m[3], +m[2], +m[1]), e = utc(+m[7], +m[6], +m[5]);
      const r = s && e && shiftRange(s, e);
      if (!r) return null;
      const f = (d: Date) => `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
      return f(r[0]) + m[4] + f(r[1]);
    }
  },
  {
    re: new RegExp(String.raw`(\d{4})-(\d{2})-(\d{2})${SEP}(\d{4})-(\d{2})-(\d{2})`, 'i'),
    next: m => {
      const s = utc(+m[1], +m[2], +m[3]), e = utc(+m[5], +m[6], +m[7]);
      const r = s && e && shiftRange(s, e);
      if (!r) return null;
      const f = (d: Date) => d.toISOString().slice(0, 10);
      return f(r[0]) + m[4] + f(r[1]);
    }
  },
  {
    re: /\b(\d{4})-W(\d{1,2})\b/i,
    next: m => {
      let y = +m[1], w = +m[2] + 1;
      if (w > isoWeeksInYear(y)) { y++; w = 1; }
      return `${y}-W${pad(w)}`;
    }
  },
  {
    re: /\bQ([1-4])(\s*)(\d{4})\b/i,
    next: m => {
      const q = +m[1] === 4 ? 1 : +m[1] + 1;
      const y = +m[1] === 4 ? +m[3] + 1 : +m[3];
      return `${m[0][0]}${q}${m[2]}${y}`;
    }
  },
  {
    re: /\b(\d{4})(\s*-?\s*)Q([1-4])\b/i,
    next: m => {
      const q = +m[3] === 4 ? 1 : +m[3] + 1;
      const y = +m[3] === 4 ? +m[1] + 1 : +m[1];
      return `${y}${m[2]}${m[0][m[0].length - 2]}${q}`;
    }
  },
  {
    re: /(?<![\p{L}\d])([1-4]|IV|III|II|I)(\s*)(кв\.?|квартал[а]?)(\s*)(\d{4})/iu,
    next: m => {
      const roman = ROMAN.indexOf(m[1].toUpperCase());
      const q = roman >= 0 ? roman + 1 : +m[1];
      const nq = q === 4 ? 1 : q + 1;
      const y = q === 4 ? +m[5] + 1 : +m[5];
      return `${roman >= 0 ? ROMAN[nq - 1] : nq}${m[2]}${m[3]}${m[4]}${y}`;
    }
  },
  // H1 2026
  {
    re: /\bH([12])(\s*)(\d{4})\b/i,
    next: m => (+m[1] === 1 ? `${m[0][0]}2${m[2]}${m[3]}` : `${m[0][0]}1${m[2]}${+m[3] + 1}`)
  },
  {
    re: /(?<![\p{L}\d])([12]|II|I)(\s*)(полугодие)(\s*)(\d{4})/iu,
    next: m => {
      const roman = ROMAN.indexOf(m[1].toUpperCase());
      const h = roman >= 0 ? roman + 1 : +m[1];
      const nh = h === 2 ? 1 : 2;
      const y = h === 2 ? +m[5] + 1 : +m[5];
      return `${roman >= 0 ? ROMAN[nh - 1] : nh}${m[2]}${m[3]}${m[4]}${y}`;
    }
  },
  {
    re: new RegExp(String.raw`(?<![\p{L}])(${[...RU_MONTHS, ...EN_MONTHS, ...EN_MONTHS_SHORT].join('|')})\.?(\s*)(\d{4})(?!\d)`, 'iu'),
    next: m => {
      const word = m[1].toLowerCase();
      const list = RU_MONTHS.includes(word) ? RU_MONTHS : EN_MONTHS.includes(word) ? EN_MONTHS : EN_MONTHS_SHORT;
      const idx = list.indexOf(word);
      const y = idx === 11 ? +m[3] + 1 : +m[3];
      const rest = m[0].slice(m[1].length, m[0].length - m[3].length);
      return matchCase(m[1], list[(idx + 1) % 12]) + rest + y;
    }
  },
  {
    re: new RegExp(String.raw`(?<![\p{L}])(${[...RU_MONTHS, ...EN_MONTHS].join('|')})(?![\p{L}])`, 'iu'),
    next: m => {
      const word = m[1].toLowerCase();
      const list = RU_MONTHS.includes(word) ? RU_MONTHS : EN_MONTHS;
      return matchCase(m[1], list[(list.indexOf(word) + 1) % 12]);
    }
  },
  {
    re: /(?<![\p{L}])(неделя|нед\.|week|wk|W)(\s*)(\d{1,2})(?:(,?\s*)(\d{4}))?(?!\d)/iu,
    next: m => {
      let y = m[5] ? +m[5] : new Date().getFullYear();
      let w = +m[3] + 1;
      if (w > isoWeeksInYear(y)) { w = 1; y++; }
      return `${m[1]}${m[2]}${w}${m[5] ? `${m[4]}${y}` : ''}`;
    }
  },
  {
    re: /\b(\d{4})-(\d{2})\b(?!-\d)/,
    next: m => {
      const mo = +m[2];
      if (mo < 1 || mo > 12) return null;
      return mo === 12 ? `${+m[1] + 1}-01` : `${m[1]}-${pad(mo + 1)}`;
    }
  },
  {
    re: /(?<![\d.\/])(\d{1,2})([./])(\d{4})\b/,
    next: m => {
      const mo = +m[1];
      if (mo < 1 || mo > 12) return null;
      const nm = mo === 12 ? 1 : mo + 1;
      const y = mo === 12 ? +m[3] + 1 : +m[3];
      return `${m[1].length === 2 ? pad(nm) : nm}${m[2]}${y}`;
    }
  },
  {
    re: /^(\s*)(\d{4})(\s*(?:г\.?|год)?\s*)$/i,
    next: m => `${m[1]}${+m[2] + 1}${m[3]}`
  }
];

export function nextPeriod(period: string): string | null {
  if (!period?.trim()) return null;
  for (const rule of RULES) {
    const m = rule.re.exec(period);
    if (!m) continue;
    const replacement = rule.next(m);
    if (replacement === null) continue;
    return period.slice(0, m.index) + replacement + period.slice(m.index + m[0].length);
  }
  return null;
}
