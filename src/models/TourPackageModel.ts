import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourPackageModel extends BaseModel {
  constructor() {
    super("tour_packages");
  }
  static columns = [
    'id',
    'tour_id',
    'return_acceptance_period',
    'discount',
    'total_tax_amount',
    'constant_price',
    'date',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
  async deleteByTourId(tourId: string) {
    await knex("tour_packages")
      .where("tour_id", tourId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getPackagesByTourId(tourId: string) {
    return await knex("tour_packages")
      .select("tour_packages.*", "tours.*")
      .join("tours", "tour_packages.tour_id", "tours.id")
      .where("tour_packages.tour_id", tourId)
      .whereNull("tour_packages.deleted_at")
      .whereNull("tours.deleted_at")
      .orderBy("tour_packages.date", "asc");
  }

  async getPackagesByDateRange(startDate: string, endDate: string) {
    return await knex("tour_packages")
      .select("tour_packages.*", "tours.*")
      .join("tours", "tour_packages.tour_id", "tours.id")
      .whereBetween("tour_packages.date", [startDate, endDate])
      .whereNull("tour_packages.deleted_at")
      .whereNull("tours.deleted_at")
      .orderBy("tour_packages.date", "asc");
  }

  async getPackagesWithDiscount() {
    return await knex("tour_packages")
      .select("tour_packages.*", "tours.*")
      .join("tours", "tour_packages.tour_id", "tours.id")
      .where("tour_packages.discount", ">", 0)
      .whereNull("tour_packages.deleted_at")
      .whereNull("tours.deleted_at")
      .orderBy("tour_packages.discount", "desc");
  }

  async getConstantPricePackages() {
    return await knex("tour_packages")
      .select("tour_packages.*", "tours.*")
      .join("tours", "tour_packages.tour_id", "tours.id")
      .where("tour_packages.constant_price", true)
      .whereNull("tour_packages.deleted_at")
      .whereNull("tours.deleted_at")
      .orderBy("tour_packages.created_at", "desc");
  }
}

export default TourPackageModel;
