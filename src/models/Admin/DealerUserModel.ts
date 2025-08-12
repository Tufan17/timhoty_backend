import BaseModel from "../BaseModel";
import connection from "../../db/connection";

export default class DealerUserModel extends BaseModel {
  constructor() {
    super("dealer_users");
  }

  static columns = [
    "id",
    "type", //manager,user
    "name_surname",
    "tc_no",
    "gsm",
    "email",
    "password",
    "status",
    "verify",
    "dealer_id",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  // Method to fetch the dealer associated with the user
  async dealer() {
    const dealerData = await connection
      .table("dealer_users")
      .join("dealers", "dealers.id", "dealer_users.dealer_id")
      .join("cities", "cities.id", "dealers.city_id")
      .join("districts", "districts.id", "dealers.district_id")
      .orderBy("dealer_users.created_at", "desc")
      .select(
        "dealer_users.id as user_id",
        "dealer_users.email",
        "dealer_users.name_surname",
        "dealer_users.tc_no",
        "dealer_users.gsm",
        "dealer_users.type",
        "dealer_users.otp_code",
        "dealer_users.status",
        "dealer_users.otp_code_expires_at",
        "dealer_users.verify as user_verify",
        "dealers.id as dealer_id",
        "dealers.name as dealer_name",
        "dealers.address",
        "dealers.phone",
        "dealers.status as dealer_status",
        "cities.name as city_name",
        "districts.name as district_name"
      );

    const dealerUsers = dealerData.map((user: any) => ({
      id: user.user_id,
      email: user.email,
      name_surname: user.name_surname,
      tc_no: user.tc_no,
      gsm: user.gsm,
      type: user.type,
      verify: user.user_verify,
      status: user.status,
      dealer: {
        id: user.dealer_id,
        name: user.dealer_name,
        city_name: user.city_name,
        district_name: user.district_name,
        address: user.address,
        phone: user.phone,
        status: user.dealer_status,
      },
    }));

    return dealerUsers;
  }

  
}
