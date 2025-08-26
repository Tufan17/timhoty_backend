import BaseModel from "@/models/BaseModel";

class VisaPackageImageModel extends BaseModel {
  constructor() {
    super("visa_package_images");
  }
  static columns = [
    'id',
    'visa_package_id',
    'image_url',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getByVisaPackageId(visaPackageId: string): Promise<any[]> {
    return this.where('visa_package_id', visaPackageId);
  }

  async deleteByVisaPackageId(visaPackageId: string): Promise<number> {
    const images = await this.where('visa_package_id', visaPackageId);
    let deletedCount = 0;
    
    for (const image of images) {
      await this.delete(image.id);
      deletedCount++;
    }
    
    return deletedCount;
  }
   
}

export default VisaPackageImageModel;
