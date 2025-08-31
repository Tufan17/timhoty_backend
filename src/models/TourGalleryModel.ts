import BaseModel from "@/models/BaseModel";

class TourGalleryModel extends BaseModel {
  constructor() {
    super("tour_galleries");
  }
  
  static columns = [
    'id',
    'tour_id',
    'image_url',
    'image_type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getByTourId(tourId: string): Promise<any[]> {
    return this.where('tour_id', tourId);
  }

  async deleteByTourId(tourId: string): Promise<number> {
    const images = await this.where('tour_id', tourId);
    let deletedCount = 0;
    
    for (const image of images) {
      await this.delete(image.id);
      deletedCount++;
    }
    
    return deletedCount;
  }
}

export default TourGalleryModel;
