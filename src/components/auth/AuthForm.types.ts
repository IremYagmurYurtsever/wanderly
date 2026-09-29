import type { ReactNode } from 'react';
import type { Screen, Notice } from '../../types';

export type AuthFormProps = {
  email: string;
  password: string;
  error: string;
  message: string;
  busy: boolean;
  onForgot: () => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setNotice: (notice: Notice) => void;
  go: (screen: Screen) => void;
  submit: () => void;
};

export type AuthFormLayoutProps = AuthFormProps & {
  screen: 'signin' | 'signup';
  beforeFields?: ReactNode;
  afterFields?: ReactNode;
};
