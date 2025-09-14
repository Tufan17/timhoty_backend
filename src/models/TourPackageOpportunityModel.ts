import knex from "@/db/knex";
import BaseModel from "@/models/BaseModel";

class TourPackageOpportunityModel extends BaseModel {
  constructor() {
    super("tour_package_opportunities");
  }
  static columns = [
    'id',
    'tour_package_id',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
    async existOpportunity(data: { tour_package_id: string; name: string }) {
    const { tour_package_id, name } = data;
    const opportunity = await knex("tour_package_opportunities")
      .whereNull("tour_package_opportunities.deleted_at")
      .leftJoin("tour_package_opportunity_pivots", "tour_package_opportunities.id", "tour_package_opportunity_pivots.tour_package_opportunity_id")
      .where("tour_package_id", tour_package_id)
      .where("tour_package_opportunity_pivots.name", name)
      .first();
    return !!opportunity;
  }
}

export default TourPackageOpportunityModel;
