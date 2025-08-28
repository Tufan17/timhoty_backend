import BaseModel from "@/models/BaseModel";

class CarPickupDeliveryModel extends BaseModel {
  constructor() {
    super("car_pickup_delivery");
  }
  static columns = [
    'id',
    'car_rental_id',
    'station_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CarPickupDeliveryModel;
