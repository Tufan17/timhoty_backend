import BaseModel from "@/models/BaseModel";

class HotelRoomFeatureModel extends BaseModel {
    constructor() {
        super("hotel_room_features");
    }
    static columns = [
        'id',
        'hotel_room_id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];
}

export default HotelRoomFeatureModel;
