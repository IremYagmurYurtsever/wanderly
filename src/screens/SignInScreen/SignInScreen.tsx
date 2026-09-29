import { AuthForm, type AuthFormProps } from '../../components/auth';

export function SignInScreen(props: AuthFormProps) {
  return <AuthForm {...props} screen="signin" />;
}
