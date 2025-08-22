import BaseModel from "@/models/BaseModel";

class HotelRoomOpportunityModel extends BaseModel {
    constructor() {
        super("hotel_room_opportunities");
      }
      static columns = [
        'id',
        'hotel_room_id',
        'created_at',
        'updated_at',
        'deleted_at',
      ];
}

export default HotelRoomOpportunityModel;