export type LoginField = "email" | "password";

export class LoginFieldError extends Error {
  readonly field: LoginField;

  constructor(field: LoginField, message: string) {
    super(message);
    this.name = "LoginFieldError";
    this.field = field;
  }
}

export function isLoginFieldError(err: unknown): err is LoginFieldError {
  return err instanceof LoginFieldError;
}
