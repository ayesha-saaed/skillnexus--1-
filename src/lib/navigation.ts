export type AppPage =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'analysis'
  | 'trends'
  | 'add-skill'
  | 'library'
  | 'admin'
  | 'support'
  | 'api-reference'
  | 'community';

export const FOOTER_PAGES: AppPage[] = ['support', 'api-reference', 'community'];

export function isFooterPage(page: string): boolean {
  return FOOTER_PAGES.includes(page as AppPage);
}

export function usesMainLayout(page: string, hasUser: boolean): boolean {
  if (!hasUser) return false;
  if (page === 'login' || page === 'register' || page === 'admin') return false;
  return true;
}
