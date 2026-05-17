export type AdminTab = 'overview' | 'roles' | 'domains' | 'skills' | 'resources' | 'users';

/** Optional behavior when switching tabs from Overview navigation. */
export type AdminTabNavigateOptions = {
  /** Users tab: open the User Details panel (first user, or `userId` if set). */
  openUserDetails?: boolean;
  userId?: string;
};

export type OpenAdminTabFn = (tab: AdminTab, options?: AdminTabNavigateOptions) => void;
