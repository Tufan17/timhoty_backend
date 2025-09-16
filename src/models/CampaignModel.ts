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

  async getCampaignsPaginated(language: string, page: number = 1, limit: number = 4,service_type: string = ""): Promise<{campaigns: any[], total: number, totalPages: number,service_type?: string}> {
    try {
      const campaigns = await knex("campaigns")
        .whereNull("campaigns.deleted_at")
        .innerJoin("campaign_pivots", "campaigns.id", "campaign_pivots.campaign_id")
        .where("campaign_pivots.language_code", language)
        .whereNull("campaign_pivots.deleted_at")
        .select("campaigns.*", "campaign_pivots.title", "campaign_pivots.description")
        .where(function () {
          if (service_type) {
            this.where("campaigns.service_type", service_type);
          }
        })
        .orderBy("campaigns.created_at", "desc")
        .limit(limit)
        .offset((page - 1) * limit);

      const [{ count: total }] = await knex("campaigns")
        .whereNull("campaigns.deleted_at")
        .innerJoin("campaign_pivots", "campaigns.id", "campaign_pivots.campaign_id")
        .where("campaign_pivots.language_code", language)
        .whereNull("campaign_pivots.deleted_at")
        .where(function () {
          if (service_type) {
            this.where("campaigns.service_type", service_type);
          }
        })
        .count("campaigns.id as count");

      const totalPages = Math.ceil(Number(total) / limit);

      return { campaigns, total: Number(total), totalPages };
    } catch (error) {
      console.error('Error fetching paginated campaigns:', error);
      return { campaigns: [], total: 0, totalPages: 0 };
    }
  }


  async getCampaignById(language: string, id: string): Promise<any> {
    return await knex("campaigns")
      .where("campaigns.id", id)
      .whereNull("campaigns.deleted_at")
      .innerJoin("campaign_pivots", "campaigns.id", "campaign_pivots.campaign_id")
      .where("campaign_pivots.language_code", language)
      .whereNull("campaign_pivots.deleted_at")
      .select("campaigns.*", "campaign_pivots.title", "campaign_pivots.description")
      .first();
  }
}

export default CampaignModel;
