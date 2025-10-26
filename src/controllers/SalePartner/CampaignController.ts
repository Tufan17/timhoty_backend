import { FastifyRequest, FastifyReply } from "fastify";
import CampaignModel from "@/models/CampaignModel";

export default class CampaignController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "", service_type } = req.query as {
        page: number;
        limit: number;
        search: string;
        service_type?: string;
      };

      const language = (req as any).language || "en";

      const campaignModel = new CampaignModel();
      const campaignData = await campaignModel.getCampaignsPaginated(
        language,
        page,
        limit,
        service_type || ""
      );

      // Apply search filter if provided
      let campaigns = campaignData.campaigns;
      if (search) {
        campaigns = campaigns.filter(
          (campaign: any) =>
            campaign.title?.toLowerCase().includes(search.toLowerCase()) ||
            campaign.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data: campaigns,
        total: search ? campaigns.length : campaignData.total,
        totalPages: search ? Math.ceil(campaigns.length / limit) : campaignData.totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      console.error("Get campaigns error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  async getById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language || "en";

      const campaignModel = new CampaignModel();
      const campaign = await campaignModel.getCampaignById(language, id);

      if (!campaign) {
        return res.status(404).send({
          success: false,
          message: "Campaign not found",
        });
      }

      return res.status(200).send({
        success: true,
        message: "Campaign fetched successfully",
        data: campaign,
      });
    } catch (error: any) {
      console.error("Get campaign error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }
}

