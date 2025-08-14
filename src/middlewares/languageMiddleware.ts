export const languageMiddleware = async (req: any, res: any) => {
  const language = req.headers["accept-language"] || "en";
  req.language = language;
};
