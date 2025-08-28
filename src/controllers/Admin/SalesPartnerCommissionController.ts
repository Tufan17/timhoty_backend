import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import SalesPartnerModel from "@/models/SalesPartnerModel";
import SalesPartnerCommissionModel from "@/models/SalesPartnerCommissionModel";

export default class SalesPartnerCommissionController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sales_partner_id = "",
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        sales_partner_id: string;
      };
      const query = knex("sales_partner_commissions")
        .whereNull("sales_partner_commissions.deleted_at")
        .leftJoin(
          "sales_partners",
          "sales_partners.id",
          "sales_partner_commissions.sales_partner_id"
        )
        .where(function () {
          this.where(
            "sales_partner_commissions.service_type",
            "ilike",
            `%${search}%`
          )
            .orWhere("sales_partner_commissions.commission_type", "ilike", `%${search}%`)
            .orWhere("sales_partner_commissions.commission_currency", "ilike", `%${search}%`)
            .orWhere("sales_partners.name", "ilike", `%${search}%`);
          
          // Handle numeric search for commission_value
          const numericSearch = parseFloat(search);
          if (!isNaN(numericSearch)) {
            this.orWhere("sales_partner_commissions.commission_value", numericSearch);
          }
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("sales_partner_commissions.status", search.toLowerCase() === "true");
          }
          if (sales_partner_id) {
            this.where("sales_partner_commissions.sales_partner_id", sales_partner_id);
          }
        })
        .select(
          "sales_partner_commissions.*",
          "sales_partners.name as sales_partner_name"
        )
        .groupBy("sales_partner_commissions.id", "sales_partners.name");
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
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_SUCCESS"
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
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_ERROR"
        ),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const salesPartnerCommissions = await new SalesPartnerCommissionModel().getAll("",{
        sales_partner_id: id,
      });

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_SUCCESS"),
        data: salesPartnerCommissions,
      });
    }catch(error){
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_ERROR"),
      });
    }
  }
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const sales_partner_commission = await new SalesPartnerCommissionModel().first(
        { id }
      );
      
      if (!sales_partner_commission) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_NOT_FOUND"
          ),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_SUCCESS"
        ),
        data: sales_partner_commission,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
            "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_ERROR"
        ),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        sales_partner_id,
        service_type,
        commission_type,
        commission_value,
        commission_currency,
      } = req.body as {
        sales_partner_id: string;
        service_type: string;
        commission_type: string;
        commission_value: number;
        commission_currency: string;
      };

      const existingSalesPartnerCommission =
        await new SalesPartnerCommissionModel().first({ sales_partner_id, service_type });

      if (existingSalesPartnerCommission) {
        return res.status(400).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_ALREADY_EXISTS"
          ),
        });
      }

      const existingSalesPartner = await new SalesPartnerModel().first({
        id: sales_partner_id,
      });

      if (!existingSalesPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      const salesPartnerCommission = await new SalesPartnerCommissionModel().create({
        sales_partner_id,
        service_type,
        commission_type,
        commission_value,
        commission_currency,
      });

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_CREATED_SUCCESS"
        ),
        data: salesPartnerCommission,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_CREATED_ERROR"
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

      const existingSalesPartnerCommission =
        await new SalesPartnerCommissionModel().first({ id });

      if (!existingSalesPartnerCommission) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_NOT_FOUND"
          ),
        });
      }

      const existingSalesPartner = await new SalesPartnerModel().first({
        id: existingSalesPartnerCommission.sales_partner_id,
      });

      if (!existingSalesPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      if (service_type && service_type !== existingSalesPartnerCommission.service_type) {
        // check if service_type is already taken for this sales partner
        const existingSalesPartnerCommissionByServiceType =
          await new SalesPartnerCommissionModel().first({ 
            sales_partner_id: existingSalesPartnerCommission.sales_partner_id,
            service_type 
          });

        if (existingSalesPartnerCommissionByServiceType) {
          return res.status(400).send({
            success: false,
            message: req.t(
              "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_ALREADY_EXISTS"
            ),
          });
        }
      }

      let body: any = {
        service_type: service_type || existingSalesPartnerCommission.service_type,
        commission_type: commission_type || existingSalesPartnerCommission.commission_type,
        commission_value: commission_value || existingSalesPartnerCommission.commission_value,
        commission_currency: commission_currency || existingSalesPartnerCommission.commission_currency,
      };

      const updatedSalesPartnerCommission =
        await new SalesPartnerCommissionModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_UPDATED_SUCCESS"
        ),
        data: updatedSalesPartnerCommission[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_UPDATED_ERROR"
        ),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSalesPartnerCommission =
        await new SalesPartnerCommissionModel().first({
          id,
        });

      if (!existingSalesPartnerCommission) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_NOT_FOUND"
          ),
        });
      }

      await new SalesPartnerCommissionModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_DELETED_SUCCESS"
        ),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_DELETED_ERROR"
        ),
      });
    }
  }
}
