import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import SolutionPartnerModel from "@/models/SolutionPartnerModel";
import PermissionModel from "@/models/PermissionModel";

export default class SolutionPartnerController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
      const query = knex("solution_partners")
        .whereNull("solution_partners.deleted_at")
        .where(function () {
          this.where("name", "ilike", `%${search}%`).orWhere(
            "phone",
            "ilike",
            `%${search}%`
          ).orWhere("address", "ilike", `%${search}%`).orWhere("tax_office", "ilike", `%${search}%`).orWhere("tax_number", "ilike", `%${search}%`).orWhere("bank_name", "ilike", `%${search}%`).orWhere("swift_number", "ilike", `%${search}%`).orWhere("account_owner", "ilike", `%${search}%`).orWhere("iban", "ilike", `%${search}%`);
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
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_FETCHED_SUCCESS"),
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
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const admin = await new SolutionPartnerModel().first({ id });
      const permissions = await new PermissionModel().getAdminPermissions(id);
      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_FETCHED_SUCCESS"),
        data: { admin, permissions },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { 
        name,
        phone,
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
        address: string;
        tax_office: string;
        tax_number: string;
        bank_name: string;
        swift_number: string;
        account_owner: string;
        iban: string;
        language_code: string;
        location_id: string;
      };

      const existingAdmin = await new SolutionPartnerModel().first({ name });

      if (existingAdmin) {
        return res.status(400).send({
          success: false,
          message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_ALREADY_EXISTS"),
        });
      }
      const solutionPartner = await new SolutionPartnerModel().create({
        name,
        phone,
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
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_CREATED_SUCCESS"),
        data: solutionPartner,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name, phone, address, tax_office, tax_number, bank_name, swift_number, account_owner, iban, language_code, location_id, status } = req.body as {
        name: string;
        phone: string;
        address: string;
        tax_office: string;
        tax_number: string;
        bank_name: string;
        swift_number: string;
        account_owner: string;
        iban: string;
        language_code: string;
        location_id: string;
        status: boolean;
      };

      const existingAdmin = await new SolutionPartnerModel().first({ id });

      if (!existingAdmin) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
        });
      }

      let body: any = {
        name: name || existingAdmin.name,
        phone: phone || existingAdmin.phone,
        address: address || existingAdmin.address,
        tax_office: tax_office || existingAdmin.tax_office,
        tax_number: tax_number || existingAdmin.tax_number,
        bank_name: bank_name || existingAdmin.bank_name,
        swift_number: swift_number || existingAdmin.swift_number,
        account_owner: account_owner || existingAdmin.account_owner,
        iban: iban || existingAdmin.iban,
        language_code: language_code.toLowerCase() || existingAdmin.language_code,
        location_id: location_id || existingAdmin.location_id,
        status
      };


      const updatedSolutionPartner = await new SolutionPartnerModel().update(id, body);

    

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_UPDATED_SUCCESS"),
        data: updatedSolutionPartner[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSolutionPartner = await new SolutionPartnerModel().first({ id });

      if (!existingSolutionPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
        });
      }

      await new SolutionPartnerModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_DELETED_ERROR"),
      });
    }
  }
}
