import { FastifyRequest, FastifyReply } from "fastify";
import SalesPartnerDocModel from "@/models/SalesPartnerDocModel";
import SalesPartnerModel from "@/models/SalesPartnerModel";

export default class SalesPartnerDocController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { sales_partner_id } = req.params as { sales_partner_id: string };
      const sales_partner_docs = await new SalesPartnerDocModel().where(
        "sales_partner_id",
        sales_partner_id
      );

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_FETCHED_SUCCESS"),
        data: sales_partner_docs,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const sales_partner_doc = await new SalesPartnerDocModel().first({ id });
      
      if (!sales_partner_doc) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_FETCHED_SUCCESS"),
        data: sales_partner_doc,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        sales_partner_id,
        doc_url,
      } = req.body as {
        sales_partner_id: string;
        doc_url: string;
      };

      // Check if sales partner exists
      const salesPartner = await new SalesPartnerModel().first({ id: sales_partner_id });
      if (!salesPartner) {
        return res.status(400).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      const salesPartnerDoc = await new SalesPartnerDocModel().create({
        sales_partner_id,
        doc_url,
      });

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_CREATED_SUCCESS"),
        data: salesPartnerDoc,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const {
        doc_url,
      } = req.body as {
        doc_url: string;
      };

      const existingSalesPartnerDoc = await new SalesPartnerDocModel().first({ id });

      if (!existingSalesPartnerDoc) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_NOT_FOUND"),
        });
      }

      let body: any = {
        doc_url: doc_url || existingSalesPartnerDoc.doc_url,
      };

      const updatedSalesPartnerDoc = await new SalesPartnerDocModel().update(
        id,
        body
      );

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_UPDATED_SUCCESS"),
        data: updatedSalesPartnerDoc[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSalesPartnerDoc = await new SalesPartnerDocModel().first({
        id,
      });

      if (!existingSalesPartnerDoc) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_NOT_FOUND"),
        });
      }

      await new SalesPartnerDocModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SALES_PARTNER_DOC.SALES_PARTNER_DOC_DELETED_ERROR"),
      });
    }
  }
}
