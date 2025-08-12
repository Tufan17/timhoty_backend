import BaseModel from "../BaseModel";
import connection from "../../db/connection";
import { UUID } from "crypto";

export default class DealerModel extends BaseModel {
  constructor() {
    super("dealers");
  }
  static columns = [
    "id",
    "name",
    "city_id",
    "district_id",
    "address",
    "phone",
    "status",
    "verify",
    "tax_office",
    "tax_number",
    "bank_account_iban",
    "bank_account_name",
    "type",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async getDealerWithRelations(id: UUID) {
    const dealer = await connection("dealers")
      .select(
        "dealers.id",
        "dealers.name",
        "cities.id as city_id",
        "cities.name as city_name",
        "districts.id as district_id",
        "districts.name as district_name",
        "dealers.address",
        "dealers.phone",
        "dealers.status",
        "dealers.verify",
        "dealers.tax_office",
        "dealers.tax_number",
        "dealers.bank_account_iban",
        "dealers.bank_account_name",
        "dealers.type",
        "dealers.created_at",
        "dealers.updated_at",
        "dealers.deleted_at",
      )
      .leftJoin("cities", "dealers.city_id", "cities.id")
      .leftJoin("districts", "dealers.district_id", "districts.id")
      .where("dealers.id", id)
      .first();

    if (!dealer) {
      return null;
    }

    return {
      id: dealer.id,
      name: dealer.name,
      address: dealer.address,
      phone: dealer.phone,
      status: dealer.status,
      verify: dealer.verify,
      tax_office: dealer.tax_office,
      tax_number: dealer.tax_number,
      bank_account_iban: dealer.bank_account_iban,
      bank_account_name: dealer.bank_account_name,
      type: dealer.type,
      city_id: dealer.city_id,
      district_id: dealer.district_id,
      created_at: dealer.created_at,
      updated_at: dealer.updated_at,
      deleted_at: dealer.deleted_at,
      city: {
        id: dealer.city_id,
        name: dealer.city_name,
      },
      district: {
        id: dealer.district_id,
        name: dealer.district_name,
      },
    };
  }
}
