import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import CampaignModel from "@/models/CampaignModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class CampaignController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const language = req.language;

      const query = knex("campaigns")
        .whereNull("campaigns.deleted_at")
        .innerJoin("campaign_pivots", "campaigns.id", "campaign_pivots.campaign_id")
        .where("campaign_pivots.language_code", language)
        .where(function () {
          this.where("campaign_pivots.title", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("campaigns.status", search.toLowerCase() === "true");
          }
        })
        .select("campaigns.*", "campaign_pivots.title as title","campaign_pivots.description as description")
        .groupBy("campaigns.id", "campaign_pivots.title","campaign_pivots.description");
        
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("campaigns.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("CAMPAIGN.CAMPAIGN_FETCHED_SUCCESS"),
        data: data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAMPAIGN.CAMPAIGN_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const campaign = await new CampaignModel().oneToMany(id, "campaign_pivots", "campaign_id");
      
      return res.status(200).send({
        success: true,
        message: req.t("CAMPAIGN.CAMPAIGN_FETCHED_SUCCESS"),
        data: campaign,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAMPAIGN.CAMPAIGN_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { title, description, start_date, end_date, photo_url, service_type, status, highlight } = req.body as {
        title: string;
        description: string;
        start_date: Date;
        end_date: Date;
        photo_url: string;
        service_type: string;
        status?: boolean;
        highlight?: boolean;
      };

      const campaign = await new CampaignModel().create({
        start_date,
        end_date,
        photo_url,
        service_type,
        status,
        highlight,
      });
      const translateResult = await translateCreate({
        target: "campaign_pivots",
        target_id_key: "campaign_id",
        target_id: campaign.id,
        data: {
          title,
          description,
        },
        language_code: req.language,
      });
      campaign.campaign_pivots = translateResult;


      return res.status(200).send({
        success: true,
        message: req.t("CAMPAIGN.CAMPAIGN_CREATED_SUCCESS"),
        data: campaign,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAMPAIGN.CAMPAIGN_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { title, description, start_date, end_date, photo_url, service_type, status, highlight } = req.body as {
        title: string;
        description: string;
        start_date: Date;
        end_date: Date;
        photo_url: string;
        service_type: string;
        status?: boolean;
        highlight?: boolean;
      };

      const existingCampaign = await new CampaignModel().first({ id });

      if (!existingCampaign) {
        return res.status(404).send({
          success: false,
          message: req.t("CAMPAIGN.CAMPAIGN_NOT_FOUND"),
        });
      }

      let body: any = {
        start_date: start_date || existingCampaign.start_date,
        end_date: end_date || existingCampaign.end_date,
        photo_url: photo_url || existingCampaign.photo_url,
        service_type: service_type || existingCampaign.service_type,
        status,
        highlight,
      };

      await new CampaignModel().update(id, body);
      await translateUpdate({
        target: "campaign_pivots",
        target_id_key: "campaign_id",
        target_id: id,
        data: {
          title,
          description,
        },
      });
      const updatedCampaign = await new CampaignModel().oneToMany(id, "campaign_pivots", "campaign_id");

      return res.status(200).send({
        success: true,
        message: req.t("CAMPAIGN.CAMPAIGN_UPDATED_SUCCESS"),
        data: updatedCampaign,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAMPAIGN.CAMPAIGN_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingCampaign = await new CampaignModel().first({ id });

      if (!existingCampaign) {
        return res.status(404).send({
          success: false,
          message: req.t("CAMPAIGN.CAMPAIGN_NOT_FOUND"),
        });
      }

      await new CampaignModel().delete(id);
      await knex("campaign_pivots").where("campaign_id", id).whereNull("deleted_at").update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("CAMPAIGN.CAMPAIGN_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAMPAIGN.CAMPAIGN_DELETED_ERROR"),
      });
    }
  }
}
