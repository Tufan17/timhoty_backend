import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CampaignModel extends BaseModel {
  constructor() {
    super("campaigns");
  }
  static columns = [
    'id',
    'start_date',
    'end_date',
    'photo_url',
    'service_type',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getDashboardCampaigns(language: string, limit: number = 4): Promise<any[]> {
    try {
      return await knex("campaigns")
        .whereNull("campaigns.deleted_at")
        .innerJoin("campaign_pivots", "campaigns.id", "campaign_pivots.campaign_id")
        .where("campaign_pivots.language_code", language)
        .whereNull("campaign_pivots.deleted_at")
        .select(
          "campaigns.id",
          "campaigns.start_date",
          "campaigns.end_date", 
          "campaigns.photo_url",
          "campaign_pivots.title",
          "campaign_pivots.description"
        )
        .orderBy("campaigns.created_at", "desc")
        .limit(limit);
    } catch (error) {
      console.error('Error fetching dashboard campaigns:', error);
      return [];
    }
  }
}

export default CampaignModel;
