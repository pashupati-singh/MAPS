export function validateIndianPhoneNumber(phoneNumber: string): string {
  const regex = /^\+91\d{10}$/;
  return regex.test(phoneNumber) ? "true" : "false";
}