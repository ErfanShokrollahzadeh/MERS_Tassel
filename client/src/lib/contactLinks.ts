/** Opens a new Gmail compose window instead of delegating to the OS mail application. */
export function gmailComposeUrl(email: string, subject?: string): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: email.trim() });
  if (subject) params.set('su', subject);
  return `https://mail.google.com/mail/?${params.toString()}`;
}
