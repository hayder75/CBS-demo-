export const fmtETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n);

export const fmtNum = (n: number) =>
  new Intl.NumberFormat('en-ET', { maximumFractionDigits: 2 }).format(n);

export const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB') : '—';