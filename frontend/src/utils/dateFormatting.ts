const fmtDate = new Intl.DateTimeFormat('ro-RO', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const fmtDateTime = new Intl.DateTimeFormat('ro-RO', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(dateString: string): string {
  return fmtDate.format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return fmtDateTime.format(new Date(dateString));
}
