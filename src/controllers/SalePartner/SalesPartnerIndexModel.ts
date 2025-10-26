import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import SalesPartnerModel from "@/models/SalesPartnerModel";
import SalesPartnerCommissionModel from "@/models/SalesPartnerCommissionModel";

export default class SalesPartnerIndexController {
  async getIndex(req: FastifyRequest, res: FastifyReply) {
    try {
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const index = await new SalesPartnerModel().first({ id: salesPartnerId });
      if (!index) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER_INDEX.INDEX_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_INDEX.INDEX_FETCHED_SUCCESS"),
        data: index,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_INDEX.INDEX_FETCHED_ERROR"),
      });
    }
  }

  async updateIndex(req: FastifyRequest, res: FastifyReply) {
    try {
      const salesPartnerUser = (req as any).user;
      const id = salesPartnerUser?.sales_partner_id;

      if (!id) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const body = req.body as any;

      // Check if index belongs to the sales partner
      const existingIndex = await new SalesPartnerModel().first({ id: id });
      if (!existingIndex) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER_INDEX.INDEX_NOT_FOUND"),
        });
      }

      const updatedIndex = await new SalesPartnerModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_INDEX.INDEX_UPDATED_SUCCESS"),
        data: updatedIndex[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_INDEX.INDEX_UPDATED_ERROR"),
      });
    }
  }

  async getCommissions(req: FastifyRequest, res: FastifyReply) {
    try {
      const salesPartnerUser = (req as any).user;
      const id = salesPartnerUser?.sales_partner_id;

      if (!id) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const commissions = await new SalesPartnerCommissionModel().getAll("", {
        sales_partner_id: id,
      });

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_INDEX.COMMISSIONS_FETCHED_SUCCESS"),
        data: commissions,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_INDEX.COMMISSIONS_FETCHED_ERROR"),
      });
    }
  }
}
