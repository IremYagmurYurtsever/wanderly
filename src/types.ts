export type Screen =
  | 'welcome'
  | 'signin'
  | 'signup'
  | 'forgot-password'
  | 'home'
  | 'trips'
  | 'explore'
  | 'journal'
  | 'profile';

export type Notice = {
  title: string;
  body: string;
};
