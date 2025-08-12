import CampaignModel from "../../models/Admin/CampaignModel";
import { MultipartFile } from "@fastify/multipart";
import { saveUploadedFile } from "../../utils/fileUpload";
import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import LogModel from "@/models/Admin/LogModel";

export default class CampaignController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const baseQuery = knex("campaigns")
        .join(
          "insurance_types",
          "campaigns.insurance_type_id",
          "insurance_types.id"
        )
        .join("admins", "campaigns.created_by", "admins.id")
        .whereNull("campaigns.deleted_at")
        .andWhere(function () {
          this.where("campaigns.title", "ilike", `%${search}%`)
            .orWhere("campaigns.description", "ilike", `%${search}%`)
            .orWhere("insurance_types.name", "ilike", `%${search}%`)
            .orWhere("admins.name_surname", "ilike", `%${search}%`);

          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("blogs.status", search.toLowerCase() === "true");
          }
        });

      const countResult = await baseQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const rawData = await baseQuery
        .clone()
        .select(
          "campaigns.*",
          "insurance_types.id as insurance_type_id",
          "insurance_types.name as insurance_type_name",
          "admins.id as admin_id",
          "admins.name_surname as admin_name"
        )
        .orderBy("campaigns.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const data = rawData.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        start_date: row.start_date,
        end_date: row.end_date,
        imageUrl: row.imageUrl,
        insurance_type: {
          id: row.insurance_type_id,
          name: row.insurance_type_name,
        },
        admin: {
          id: row.admin_id,
          name: row.admin_name,
        },
      }));

      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Campaigns fetch failed",
      });
    }
  }
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const campaign = await new CampaignModel().findId(id);
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
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Campaign fetch failed",
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const parts = req.parts();

      const fields: Record<string, string> = {};
      let image: MultipartFile | null = null;

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "imageUrl") {
            fields[part.fieldname] = await saveUploadedFile(part, "blogs");
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }
      const campaign = {
        title: fields.title,
        description: fields.description,
        imageUrl: fields.imageUrl,
        insurance_type_id: fields.insurance_type_id,
        start_date: fields.start_date,
        end_date: fields.end_date,
      };

      for (const key in campaign) {
        if (!campaign[key as keyof typeof campaign]) {
          return res.status(400).send({
            success: false,
            message: `${key} is required`,
          });
        }
      }

      const body = {
        title: fields.title,
        description: fields.description,
        imageUrl: fields.imageUrl,
        insurance_type_id: fields.insurance_type_id,
        status: true,
        created_by: user.id,
        updated_by: user.id,
        start_date: fields.start_date,
        end_date: fields.end_date,
      };

      await new CampaignModel().create(body);

      const newCampaign: any = await new CampaignModel().first({
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        insurance_type_id: body.insurance_type_id,
      });
      await new LogModel().createLog(
        req.user,
        "create",
        "campaigns",
        newCampaign
      );
      return res.status(200).send({
        success: true,
        message: "Campaign created successfully",
        data: body,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Campaign creation failed",
      });
    }
  }
  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const { id } = req.params as { id: string };

      const campaign = await new CampaignModel().findId(id);
      if (!campaign) {
        return res.status(404).send({
          success: false,
          message: "Campaign not found",
        });
      }

      const parts = req.parts();
      const fields: Record<string, any> = {};
      let hasFileField = false;

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "imageUrl") {
            hasFileField = true;
            if (part.filename) {
              fields[part.fieldname] = await saveUploadedFile(part, "blogs");
            }
          }
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      const body: Record<string, any> = {
        updated_by: user.id,
      };

      if (fields.title !== undefined) body.title = fields.title;
      if (fields.description !== undefined)
        body.description = fields.description;
      if (fields.insurance_type_id !== undefined)
        body.insurance_type_id = fields.insurance_type_id;
      if (fields.start_date !== undefined) body.start_date = fields.start_date;
      if (fields.end_date !== undefined) body.end_date = fields.end_date;

      if (hasFileField && fields.imageUrl) {
        body.imageUrl = fields.imageUrl;
      }

      if (fields.status !== undefined) {
        body.status = fields.status === "true" || fields.status === true;
      }

      await new CampaignModel().update(id, body);
      await new LogModel().createLog(req.user, "update", "campaigns", campaign);

      const updatedCampaign = await new CampaignModel().findId(id);

      return res.status(200).send({
        success: true,
        message: "Campaign updated successfully",
        data: updatedCampaign,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Campaign update failed",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const campaign = await new CampaignModel().delete(id);
      await new LogModel().createLog(req.user, "delete", "campaigns", campaign);
      return res.status(200).send({
        success: true,
        message: "Campaign deleted successfully",
        data: campaign,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Campaign deletion failed",
      });
    }
  }
  async findAllActive(req: FastifyRequest, res: FastifyReply) {
    try {
      const baseQuery = knex("campaigns")
        .join(
          "insurance_types",
          "campaigns.insurance_type_id",
          "insurance_types.id"
        )
        .whereNull("campaigns.deleted_at")
        .andWhere("campaigns.status", true)
        .andWhere("campaigns.start_date", "<=", knex.raw("CURRENT_DATE"))
        .andWhere("campaigns.end_date", ">=", knex.raw("CURRENT_DATE"))
        .orderBy("campaigns.created_at", "asc")
        .select("campaigns.*", "insurance_types.name as insurance_type_name");

      const insuranceTypes = (await baseQuery).reduce((acc: any[], item: any) => {
        if (!acc.some((type) => type.id === item.insurance_type_id)) {
          acc.push({
            id: item.insurance_type_id,
            name: item.insurance_type_name,
          });
        }
        return acc;
      }, []);

      const campaigns = await baseQuery;
      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data: campaigns,
        insuranceTypes,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Campaigns fetch failed",
      });
    }
  }

  async findAllActiveFive(req: FastifyRequest, res: FastifyReply) {
    try {
      const baseQuery = knex("campaigns")
        .join(
          "insurance_types",
          "campaigns.insurance_type_id",
          "insurance_types.id"
        )
        .whereNull("campaigns.deleted_at")
        .andWhere("campaigns.status", true)
        .andWhere("campaigns.start_date", "<=", knex.raw("CURRENT_DATE"))
        .andWhere("campaigns.end_date", ">=", knex.raw("CURRENT_DATE"))
        .orderBy("campaigns.created_at", "asc")
        .limit(5)
        .select("campaigns.*", "insurance_types.name as insurance_type_name");

      const campaigns = await baseQuery;
      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data: campaigns,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Campaigns fetch failed",
      });
    }
  }
  async findAllEndEight(req: FastifyRequest, res: FastifyReply) {
    try {
      const campaigns = await knex("campaigns")
        .whereNull("campaigns.deleted_at")
        .andWhere("campaigns.status", true)
        .andWhere("campaigns.end_date", ">=", knex.raw("CURRENT_DATE"))
        .orderBy("campaigns.created_at", "asc")
        .select("title", "id")
        .limit(8);
      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data: campaigns,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Campaigns fetch failed",
      });
    }
  }


  async findLandingAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        insurance_type_ids = "",
      } = req.query as { page: number; limit: number; search: string; insurance_type_ids: string };

      const baseQuery = knex("campaigns")
        .join(
          "insurance_types",
          "campaigns.insurance_type_id",
          "insurance_types.id"
        )
        .join("admins", "campaigns.created_by", "admins.id")
        .whereNull("campaigns.deleted_at")
        .andWhere("campaigns.status", true)
        .andWhere("campaigns.start_date", "<=", knex.raw("CURRENT_DATE"))
        .andWhere("campaigns.end_date", ">=", knex.raw("CURRENT_DATE"))
        .andWhere(function () {
          this.where("campaigns.title", "ilike", `%${search}%`)
            .orWhere("campaigns.description", "ilike", `%${search}%`)
            .orWhere("insurance_types.name", "ilike", `%${search}%`)
            .orWhere("admins.name_surname", "ilike", `%${search}%`);

          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("campaigns.status", search.toLowerCase() === "true");
          }
        });

      // Add insurance_type_ids filter as a separate AND condition
      if (insurance_type_ids && insurance_type_ids.trim() !== "") {
        const typeIds = insurance_type_ids.split(",").map(id => id.trim()).filter(id => id !== "");
        if (typeIds.length > 0) {
          baseQuery.whereIn("campaigns.insurance_type_id", typeIds);
        }
      }

      const countResult = await baseQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const rawData = await baseQuery
        .clone()
        .select(
          "campaigns.*",
          "insurance_types.id as insurance_type_id",
          "insurance_types.name as insurance_type_name",
          "admins.id as admin_id",
          "admins.name_surname as admin_name"
        )
        .orderBy("campaigns.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const data = rawData.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        start_date: row.start_date,
        end_date: row.end_date,
        imageUrl: row.imageUrl,
        insurance_type: {
          id: row.insurance_type_id,
          name: row.insurance_type_name,
        },
        admin: {
          id: row.admin_id,
          name: row.admin_name,
        },
      }));
      
      // Get unique insurance type IDs from active campaigns
      const insuranceTypeIdsResult = await knex("campaigns")
        .select("insurance_type_id")
        .whereNull("deleted_at")
        .andWhere("status", true)
        .andWhere("start_date", "<=", knex.raw("CURRENT_DATE"))
        .andWhere("end_date", ">=", knex.raw("CURRENT_DATE"))
        .distinct();
      
      const insuranceTypeIds = insuranceTypeIdsResult.map(row => row.insurance_type_id);
      
      const insurance_types = await knex("insurance_types")
        .whereIn("id", insuranceTypeIds)
        .whereNull("deleted_at")
        .select("id", "name");

      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        insurance_types,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Campaigns fetch failed",
      });
    }
  }
}
