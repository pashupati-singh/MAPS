export const createResponse = (
  code: number,
  success: boolean,
  message: string,
  data: any = {}
) => {
  return { code, success, message, ...data };
};
