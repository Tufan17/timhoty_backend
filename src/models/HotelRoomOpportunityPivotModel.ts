import BaseModel from "@/models/BaseModel";

class HotelRoomOpportunityPivotModel extends BaseModel {
    constructor() {
        super("hotel_room_opportunity_pivots");
      }
      static columns = [
        'id',
        'hotel_room_opportunity_id',
        'name',
        'language_code',
        'created_at',
        'updated_at',
        'deleted_at',
      ];
}

export default HotelRoomOpportunityPivotModel;