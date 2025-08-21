import knex from "@/db/knex";
import LanguageModel from "@/models/LanguageModel";
import translateText from "@/utils/googleTranslate";

interface TranslateProps {
  target: string;
  target_id: string;
  target_id_key: string;
  data: Record<string, any>;
  language_code?: string;
}

export const translateCreate = async ({ target, target_id, target_id_key, data, language_code }: TranslateProps) => {
 try{
    const languageModel = new LanguageModel();
    const languages = await languageModel.getAll("code", { deleted_at: null });

    if(languages.length==0){
      return false;
    }


    let newDatas:any[]=[];
    for (const language of languages) {
      const translatedData: Record<string, any> = {
        [target_id_key]: target_id,
        language_code: language.code,
      };
      for (const key in data) {
        if(language_code!=language.code){
        const translatedText = await translateText({
          text: data[key],
          targetLanguage: language.code,
          sourceLanguage: language_code ,
        });
        translatedData[key] = translatedText.translatedText;
        }else{
          translatedData[key] = data[key];
        }
      }
      let newData=await knex(target).insert(translatedData).returning('*'); 
      newDatas.push(newData[0]);
    }
    return newDatas;
 }catch(error){
    console.log(error);
    return false;
 }
};


export const translateUpdate = async ({ target, target_id, target_id_key, data, language_code }: TranslateProps) => {
  try{
    const languageModel = new LanguageModel();
    const languages = await languageModel.getAll("code", { deleted_at: null });
    for (const language of languages) {
      const translatedData: Record<string, any> = {
        [target_id_key]: target_id,
        language_code: language.code,
      };
      for (const key in data) {
        if(language_code!=language.code){
        const translatedText = await translateText({
          text: data[key],
          targetLanguage: language.code,
          sourceLanguage: language_code,
        });

        translatedData[key] = translatedText.translatedText;
        }else{
          translatedData[key] = data[key];
        }
      }
      await knex(target).where(target_id_key, target_id).where("language_code", language.code).update(translatedData);
    }
    return true;
  }catch(error){
    console.log(error);
    return false;
  }
};

