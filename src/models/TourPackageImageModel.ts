import BaseModel from "@/models/BaseModel";

class TourPackageImageModel extends BaseModel {
  constructor() {
    super("tour_package_images");
  }
  
  static columns = [
    'id',
    'tour_package_id',
    'image_url',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getByTourPackageId(tourPackageId: string): Promise<any[]> {
    return this.where('tour_package_id', tourPackageId);
  }

  async deleteByTourPackageId(tourPackageId: string): Promise<number> {
    const images = await this.where('tour_package_id', tourPackageId);
    let deletedCount = 0;
    
    for (const image of images) {
      await this.delete(image.id);
      deletedCount++;
    }
    
    return deletedCount;
  }
   
}

export default TourPackageImageModel;
