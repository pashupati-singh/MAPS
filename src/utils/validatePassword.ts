export function validatePassword(password: string): string | null {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!password) {
    return "Password is required";
  }

  if (!regex.test(password)) {
    return "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.";
  }

  return null;
}
