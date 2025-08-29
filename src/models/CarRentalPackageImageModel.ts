import BaseModel from "@/models/BaseModel";

class CarRentalPackageImageModel extends BaseModel {
  constructor() {
    super("car_rental_package_images");
  }
  
  static columns = [
    'id',
    'car_rental_package_id',
    'image_url',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getByCarRentalPackageId(carRentalPackageId: string): Promise<any[]> {
    return this.where('car_rental_package_id', carRentalPackageId);
  }

  async deleteByCarRentalPackageId(carRentalPackageId: string): Promise<number> {
    const images = await this.where('car_rental_package_id', carRentalPackageId);
    let deletedCount = 0;
    
    for (const image of images) {
      await this.delete(image.id);
      deletedCount++;
    }
    
    return deletedCount;
  }
   
}

export default CarRentalPackageImageModel;
