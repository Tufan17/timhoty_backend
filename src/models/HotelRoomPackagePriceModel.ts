import BaseModel from "@/models/BaseModel";
import HotelRoomPackageModel from "./HotelRoomPackageModel";
import CurrencyModel from "./CurrencyModel";

class HotelRoomPackagePriceModel extends BaseModel {
    constructor() {
        super("hotel_room_package_prices");
      }
      static columns = [
        'id',
        'hotel_room_package_id',
        "main_price",
        "child_price",
        "currency_id",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
        "deleted_at",
      ];

      relations = [
        {
          model: HotelRoomPackageModel,
          foreignKey: 'hotel_room_package_id',
          localKey: 'id',
        },
        {
          model: CurrencyModel,
          foreignKey: 'currency_id',
          localKey: 'id',
        },
      ];
}

export default HotelRoomPackagePriceModel;