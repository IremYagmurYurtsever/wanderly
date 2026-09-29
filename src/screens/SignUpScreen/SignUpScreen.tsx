import { AuthForm } from '../../components/auth';
import { Field } from '../../components/Field';
import { TermsAgreement } from './components/TermsAgreement';
import type { SignUpScreenProps } from './SignUpScreen.types';

export function SignUpScreen({ name, setName, agreed, setAgreed, ...props }: SignUpScreenProps) {
  return (
    <AuthForm
      {...props}
      screen="signup"
      beforeFields={
        <Field
          editable={!props.busy}
          label="AD SOYAD"
          value={name}
          onChange={setName}
          placeholder="Deniz Yılmaz"
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
        />
      }
      afterFields={
        <TermsAgreement agreed={agreed} setAgreed={setAgreed} setNotice={props.setNotice} />
      }
    />
  );
}
