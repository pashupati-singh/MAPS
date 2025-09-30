export const createResponse = (
  code: number,
  success: boolean,
  message: string,
  data: any = null
) => {
  return { code, success, message, data };
};
  