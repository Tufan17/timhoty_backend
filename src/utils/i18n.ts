import path from "path";
import fs from "fs";

const i18n = (language: string) => {
  const languageFilePath = path.join(
    __dirname,
    "..",
    "locales",
    `${language}.json`
  );

  let selectedLanguage:Record<string, any> = {};

  try {
    const data = fs.readFileSync(languageFilePath, "utf8");
    selectedLanguage = JSON.parse(data);
  } catch (error) {
    console.error(
      `Could not load language file for "${language}". Falling back to English.`
    );
    const defaultLanguagePath = path.join(
      __dirname,
      "..",
      "locales",
      "en.json"
    );
    const data = fs.readFileSync(defaultLanguagePath, "utf8");
    selectedLanguage = JSON.parse(data);
  }

  return (key: string) => {

    const keys = key.split(".");

    if(keys.length > 1){
      return selectedLanguage[keys[0]]?.[keys[1]] || key;
    }
    return selectedLanguage[keys[0]] || key;


  };
};

export default i18n;