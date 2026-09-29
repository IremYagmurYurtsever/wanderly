import type { AuthFormProps } from '../../components/auth';

export type SignUpScreenProps = AuthFormProps & {
  name: string;
  agreed: boolean;
  setName: (value: string) => void;
  setAgreed: (value: boolean) => void;
};
