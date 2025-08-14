import i18n from "../utils/i18n";

export const languageMiddleware = async (req: any, res: any) => {
  const language = req.headers["accept-language"] || "en";
  req.t = i18n(language);
  req.language = language;
};