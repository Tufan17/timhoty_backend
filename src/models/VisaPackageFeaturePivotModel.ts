import BaseModel from "@/models/BaseModel";

class VisaPackageFeaturePivotModel extends BaseModel {
  constructor() {
    super("visa_package_feature_pivots");
  }
  
  static columns = [
    'id',
    'visa_package_feature_id',
    'language_code',
    'name',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getByVisaPackageFeatureId(visaPackageFeatureId: string): Promise<any[]> {
    return this.where('visa_package_feature_id', visaPackageFeatureId);
  }

  async getByLanguageAndFeatureId(languageCode: string, visaPackageFeatureId: string): Promise<any | undefined> {
    return this.first({
      language_code: languageCode,
      visa_package_feature_id: visaPackageFeatureId
    });
  }

  async deleteByVisaPackageFeatureId(visaPackageFeatureId: string): Promise<number> {
    const pivots = await this.where('visa_package_feature_id', visaPackageFeatureId);
    let deletedCount = 0;
    
    for (const pivot of pivots) {
      await this.delete(pivot.id);
      deletedCount++;
    }
    
    return deletedCount;
  }

  async getByLanguage(languageCode: string): Promise<any[]> {
    return this.where('language_code', languageCode);
  }
}

export default VisaPackageFeaturePivotModel;
