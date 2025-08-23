import BaseModel from "@/models/BaseModel";
import HotelRoomModel from "./HotelRoomModel";
import HotelRoomPackagePriceModel from "./HotelRoomPackagePriceModel";

class HotelRoomPackageModel extends BaseModel {
    query() {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super("hotel_room_packages");
      }
      static columns = [
        'id',
        'hotel_room_id',
        'discount',
        'total_tax_amount',
        'constant_price',
        'created_at',
        'updated_at',
        'deleted_at',
      ];

      relations = [
        {
          model: HotelRoomModel,
          foreignKey: 'hotel_room_id',
          localKey: 'id',
        },
        {
          model: HotelRoomPackagePriceModel,
          foreignKey: 'hotel_room_package_id',
          localKey: 'id',
        },
      ];
}

export default HotelRoomPackageModel;