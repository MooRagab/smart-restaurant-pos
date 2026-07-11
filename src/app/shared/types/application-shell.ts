export type Branch = Readonly<{
  id: string;
  name: string;
  location: string;
}>;

export type CurrentUser = Readonly<{
  id: string;
  displayName: string;
  initials: string;
  role: 'Cashier' | 'Branch Manager' | 'Kitchen Staff' | 'Customer Support';
}>;

export type NavigationItem = Readonly<{
  label: string;
  shortLabel: string;
  path: string;
  icon: 'orders' | 'products' | 'kitchen' | 'queue';
}>;

export type ApplicationShell = Readonly<{
  branches: readonly Branch[];
  currentUser: CurrentUser;
  navigation: readonly NavigationItem[];
}>;
