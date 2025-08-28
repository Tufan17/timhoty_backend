import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel";
import SolutionPartnerModel from "@/models/SolutionPartnerModel";
import SolutionPartnerCommissionModel from "@/models/SolutionPartnerCommissionModel";

export default class SolutionPartnerCommissionController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        solution_partner_id = "",
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        solution_partner_id: string;
      };
      const query = knex("solution_partner_commissions")
        .whereNull("solution_partner_commissions.deleted_at")
        .leftJoin(
          "solution_partners",
          "solution_partners.id",
          "solution_partner_commissions.solution_partner_id"
        )
        .where(function () {
          this.where(
            "solution_partner_commissions.service_type",
            "ilike",
            `%${search}%`
          )
            .orWhere("solution_partner_commissions.commission_type", "ilike", `%${search}%`)
            .orWhere("solution_partner_commissions.commission_currency", "ilike", `%${search}%`)
            .orWhere("solution_partners.name", "ilike", `%${search}%`);
          
          // Handle numeric search for commission_value
          const numericSearch = parseFloat(search);
          if (!isNaN(numericSearch)) {
            this.orWhere("solution_partner_commissions.commission_value", numericSearch);
          }
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("solution_partner_commissions.status", search.toLowerCase() === "true");
          }
          if (solution_partner_id) {
            this.where("solution_partner_commissions.solution_partner_id", solution_partner_id);
          }
        })
        .select(
          "solution_partner_commissions.*",
          "solution_partners.name as solution_partner_name"
        )
        .groupBy("solution_partner_commissions.id", "solution_partners.name");
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
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_FETCHED_SUCCESS"
        ),
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
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_FETCHED_ERROR"
        ),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const solutionPartnerCommissions = await new SolutionPartnerCommissionModel().getAll("",{
        solution_partner_id: id,
      });

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_FETCHED_SUCCESS"),
        data: solutionPartnerCommissions,
      });
    }catch(error){
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const solution_partner_commissions = await new SolutionPartnerCommissionModel().first(
        { id }
      );
      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_FETCHED_SUCCESS"
        ),
        data: solution_partner_commissions,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
            "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_FETCHED_ERROR"
        ),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        solution_partner_id,
        service_type,
        commission_type,
        commission_value,
        commission_currency,
      } = req.body as {
        solution_partner_id: string;
        service_type: string;
        commission_type: string;
        commission_value: number;
        commission_currency: string;
      };

      const existingSolutionPartnerCommission =
        await new SolutionPartnerCommissionModel().first({ solution_partner_id, service_type });

      if (existingSolutionPartnerCommission) {
        return res.status(400).send({
          success: false,
          message: req.t(
            "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_ALREADY_EXISTS"
          ),
        });
      }

      const existingSolutionPartner = await new SolutionPartnerModel().first({
        id: solution_partner_id,
      });

      if (!existingSolutionPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
        });
      }

      const solutionPartnerCommission = await new SolutionPartnerCommissionModel().create({
        solution_partner_id,
        service_type,
        commission_type,
        commission_value,
        commission_currency,
      });

      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_CREATED_SUCCESS"
        ),
        data: solutionPartnerCommission,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_CREATED_ERROR"
        ),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const {
        service_type,
        commission_type,
        commission_value,
        commission_currency,
      } = req.body as {
        service_type: string;
        commission_type: string;
        commission_value: number;
        commission_currency: string;
      };

      const existingSolutionPartnerCommission =
        await new SolutionPartnerCommissionModel().first({ id });

      if (!existingSolutionPartnerCommission) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_NOT_FOUND"
          ),
        });
      }

      const existingSolutionPartner = await new SolutionPartnerModel().first({
        id: existingSolutionPartnerCommission.solution_partner_id,
      });

      if (!existingSolutionPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
        });
      }

      if (service_type && service_type !== existingSolutionPartnerCommission.service_type) {
        // check if service_type is already taken
        const existingSolutionPartnerCommissionByServiceType =
          await new SolutionPartnerCommissionModel().first({ service_type });

        if (existingSolutionPartnerCommissionByServiceType) {
          return res.status(400).send({
            success: false,
            message: req.t(
              "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_ALREADY_EXISTS"
            ),
          });
        }
      }

      let body: any = {
        service_type: service_type || existingSolutionPartnerCommission.service_type,
        commission_type: commission_type || existingSolutionPartnerCommission.commission_type,
        commission_value: commission_value || existingSolutionPartnerCommission.commission_value,
        commission_currency: commission_currency || existingSolutionPartnerCommission.commission_currency,
      };

      const updatedSolutionPartnerCommission =
        await new SolutionPartnerCommissionModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_UPDATED_SUCCESS"
        ),
        data: updatedSolutionPartnerCommission[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_UPDATED_ERROR"
        ),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSolutionPartnerCommission =
        await new SolutionPartnerCommissionModel().first({
          id,
        });

      if (!existingSolutionPartnerCommission) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_NOT_FOUND"
          ),
        });
      }

      await new SolutionPartnerCommissionModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_DELETED_SUCCESS"
        ),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SOLUTION_PARTNER_COMMISSION.SOLUTION_PARTNER_COMMISSION_DELETED_ERROR"
        ),
      });
    }
  }
}
