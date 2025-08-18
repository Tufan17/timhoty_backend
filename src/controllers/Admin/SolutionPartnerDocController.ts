import { FastifyRequest, FastifyReply } from "fastify";
import SolutionPartnerDocModel from "@/models/SolutionPartnerDocModel";

export default class SolutionPartnerDocController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { solution_partner_id } = req.params as { solution_partner_id: string };
      const solution_partner_docs = await new SolutionPartnerDocModel().where(
        "solution_partner_id",
        solution_partner_id
      );

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_FETCHED_SUCCESS"),
        data: solution_partner_docs,
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
      const solution_partner_docs =
        await new SolutionPartnerDocModel().first({  id });
      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_FETCHED_SUCCESS"),
        data: solution_partner_docs,
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
        solution_partner_id,
        doc_url,
      } = req.body as {
        solution_partner_id: string;
        doc_url: string;
      };

      const solutionPartnerDoc = await new SolutionPartnerDocModel().create({
        solution_partner_id,
        doc_url,
      });

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_CREATED_SUCCESS"),
        data: solutionPartnerDoc,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_CREATED_ERROR"),
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

      const existingSolutionPartnerDoc = await new SolutionPartnerDocModel().first({ id });

      if (!existingSolutionPartnerDoc) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_NOT_FOUND"),
        });
      }

      let body: any = {
        doc_url: doc_url || existingSolutionPartnerDoc.doc_url,
      };

      const updatedSolutionPartnerDoc = await new SolutionPartnerDocModel().update(
        id,
        body
      );

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_UPDATED_SUCCESS"),
        data: updatedSolutionPartnerDoc[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSolutionPartnerDoc = await new SolutionPartnerDocModel().first({
        id,
      });

      if (!existingSolutionPartnerDoc) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_NOT_FOUND"),
        });
      }

      await new SolutionPartnerDocModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER_DOC.SOLUTION_PARTNER_DOC_DELETED_ERROR"),
      });
    }
  }
}
