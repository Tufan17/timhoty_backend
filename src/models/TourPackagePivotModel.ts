import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourPackagePivotModel extends BaseModel {
  constructor() {
    super("tour_package_pivots");
  }
  static columns = [
    'id',
    'tour_package_id',
    'language_code',
    'name',
    'description',
    'refund_policy',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
  async deleteByTourPackageId(tourPackageId: string) {
    await knex("tour_package_pivots")
      .where("tour_package_id", tourPackageId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getPivotsByTourPackageId(tourPackageId: string) {
    return await knex("tour_package_pivots")
      .where("tour_package_id", tourPackageId)
      .whereNull("deleted_at")
      .orderBy("language_code", "asc");
  }

  async getPivotsByLanguage(languageCode: string) {
    return await knex("tour_package_pivots")
      .where("language_code", languageCode)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getPivotsWithTourPackage(tourPackageId: string, languageCode: string) {
    return await knex("tour_package_pivots")
      .select("tour_package_pivots.*", "tour_packages.*")
      .join("tour_packages", "tour_package_pivots.tour_package_id", "tour_packages.id")
      .where("tour_package_pivots.tour_package_id", tourPackageId)
      .where("tour_package_pivots.language_code", languageCode)
      .whereNull("tour_package_pivots.deleted_at")
      .whereNull("tour_packages.deleted_at")
      .first();
  }
}

export default TourPackagePivotModel;
