import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import SalesPartnerModel from "@/models/SalesPartnerModel";
import PermissionModel from "@/models/PermissionModel";

export default class SalesPartnerController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
      const query = knex("sales_partners")
        .whereNull("sales_partners.deleted_at")
        .where(function () {
          this.where("name", "ilike", `%${search}%`)
            .orWhere("phone", "ilike", `%${search}%`)
            .orWhere("whatsapp_no", "ilike", `%${search}%`)
            .orWhere("telegram_no", "ilike", `%${search}%`)
            .orWhere("address", "ilike", `%${search}%`)
            .orWhere("tax_office", "ilike", `%${search}%`)
            .orWhere("tax_number", "ilike", `%${search}%`)
            .orWhere("bank_name", "ilike", `%${search}%`)
            .orWhere("swift_number", "ilike", `%${search}%`)
            .orWhere("account_owner", "ilike", `%${search}%`)
            .orWhere("iban", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("admin_verified", search.toLowerCase() === "true");
          }
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("status", search.toLowerCase() === "true");
          }
        });
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER.SALES_PARTNER_FETCHED_SUCCESS"),
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
        message: req.t("SALES_PARTNER.SALES_PARTNER_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const salesPartner = await new SalesPartnerModel().first({ id });
      
      if (!salesPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER.SALES_PARTNER_FETCHED_SUCCESS"),
        data: salesPartner,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER.SALES_PARTNER_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { 
        name,
        phone,
        whatsapp_no,
        telegram_no,
        address,
        tax_office,
        tax_number,
        bank_name,
        swift_number,
        account_owner,
        iban,
        language_code,
        location_id,
       } = req.body as {
        name: string;
        phone: string;
        whatsapp_no?: string;
        telegram_no?: string;
        address?: string;
        tax_office?: string;
        tax_number?: string;
        bank_name?: string;
        swift_number?: string;
        account_owner?: string;
        iban?: string;
        language_code: string;
        location_id: string;
      };

      const existingSalesPartner = await new SalesPartnerModel().first({ name });

      if (existingSalesPartner) {
        return res.status(400).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_ALREADY_EXISTS"),
        });
      }

      const salesPartner = await new SalesPartnerModel().create({
        name,
        phone,
        whatsapp_no,
        telegram_no,
        address,
        tax_office,
        tax_number,
        bank_name,
        swift_number,
        account_owner,
        iban,
        language_code: language_code.toLowerCase(),
        location_id,
        status: true,
      });

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER.SALES_PARTNER_CREATED_SUCCESS"),
        data: salesPartner,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER.SALES_PARTNER_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { 
        name, 
        phone, 
        whatsapp_no,
        telegram_no,
        address, 
        tax_office, 
        tax_number, 
        bank_name, 
        swift_number, 
        account_owner, 
        iban, 
        language_code, 
        location_id, 
        status,
        admin_verified,
        application_status_id
      } = req.body as {
        name?: string;
        phone?: string;
        whatsapp_no?: string;
        telegram_no?: string;
        address?: string;
        tax_office?: string;
        tax_number?: string;
        bank_name?: string;
        swift_number?: string;
        account_owner?: string;
        iban?: string;
        language_code?: string;
        location_id?: string;
        status?: boolean;
        admin_verified?: boolean;
        application_status_id?: string;
      };

      const existingSalesPartner = await new SalesPartnerModel().first({ id });

      if (!existingSalesPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      let body: any = {
        name: name || existingSalesPartner.name,
        phone: phone || existingSalesPartner.phone,
        whatsapp_no: whatsapp_no !== undefined ? whatsapp_no : existingSalesPartner.whatsapp_no,
        telegram_no: telegram_no !== undefined ? telegram_no : existingSalesPartner.telegram_no,
        address: address !== undefined ? address : existingSalesPartner.address,
        tax_office: tax_office !== undefined ? tax_office : existingSalesPartner.tax_office,
        tax_number: tax_number !== undefined ? tax_number : existingSalesPartner.tax_number,
        bank_name: bank_name !== undefined ? bank_name : existingSalesPartner.bank_name,
        swift_number: swift_number !== undefined ? swift_number : existingSalesPartner.swift_number,
        account_owner: account_owner !== undefined ? account_owner : existingSalesPartner.account_owner,
        iban: iban !== undefined ? iban : existingSalesPartner.iban,
        language_code: language_code ? language_code.toLowerCase() : existingSalesPartner.language_code,
        location_id: location_id || existingSalesPartner.location_id,
        status: status !== undefined ? status : existingSalesPartner.status,
        admin_verified: admin_verified !== undefined ? admin_verified : existingSalesPartner.admin_verified,
        application_status_id: application_status_id !== undefined ? application_status_id : existingSalesPartner.application_status_id,
      };

      const updatedSalesPartner = await new SalesPartnerModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER.SALES_PARTNER_UPDATED_SUCCESS"),
        data: updatedSalesPartner[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER.SALES_PARTNER_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSalesPartner = await new SalesPartnerModel().first({ id });

      if (!existingSalesPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      await new SalesPartnerModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER.SALES_PARTNER_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER.SALES_PARTNER_DELETED_ERROR"),
      });
    }
  }
}
