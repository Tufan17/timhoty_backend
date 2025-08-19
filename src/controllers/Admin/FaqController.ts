import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import FaqModel from "@/models/FaqModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class FaqController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const language = req.language;

      const query = knex("faqs")
        .whereNull("faqs.deleted_at")
        .innerJoin("faq_pivots", "faqs.id", "faq_pivots.faq_id")
        .where("faq_pivots.language_code", language)
        .where(function () {
          this.where("faq_pivots.title", "ilike", `%${search}%`);
          this.orWhere("faqs.service_type", "ilike", `%${search}%`);
        })
        .select("faqs.*", "faq_pivots.title as title","faq_pivots.description as description")
        .groupBy("faqs.id", "faq_pivots.title","faq_pivots.description");
        
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("faqs.order", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("FAQ.FAQ_FETCHED_SUCCESS"),
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
        message: req.t("FAQ.FAQ_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const faq = await new FaqModel().oneToMany(id, "faq_pivots", "faq_id");
      
      return res.status(200).send({
        success: true,
        message: req.t("FAQ.FAQ_FETCHED_SUCCESS"),
        data: faq,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("FAQ.FAQ_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { title, description, order, service_type } = req.body as {
        title: string;
        description: string;
        order: string;
        service_type: string;
      };

      const faq = await new FaqModel().create({
        order,
        service_type: service_type || "hotel",
      });
      const translateResult = await translateCreate({
        target: "faq_pivots",
        target_id_key: "faq_id",
        target_id: faq.id,
        data: {
          title,
          description,
        },
        language_code: req.language,
      });
      faq.faq_pivots = translateResult;


      return res.status(200).send({
        success: true,
        message: req.t("FAQ.FAQ_CREATED_SUCCESS"),
        data: faq,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("FAQ.FAQ_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { title, description, order, service_type } = req.body as {
        title: string;
        description: string;
        order: string;
        service_type: string;
      };

      const existingFaq = await new FaqModel().first({ id });

      if (!existingFaq) {
        return res.status(404).send({
          success: false,
          message: req.t("FAQ.FAQ_NOT_FOUND"),
        });
      }

      let body: any = {
        order: order || existingFaq.order,
        service_type: service_type || existingFaq.service_type,
      };

      await new FaqModel().update(id, body);
      await translateUpdate({
        target: "faq_pivots",
        target_id_key: "faq_id",
        target_id: id,
        data: {
          title,
          description,
        },
        language_code: req.language,
      });
      const updatedFaq = await new FaqModel().oneToMany(id, "faq_pivots", "faq_id");

      return res.status(200).send({
        success: true,
        message: req.t("FAQ.FAQ_UPDATED_SUCCESS"),
        data: updatedFaq,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("FAQ.FAQ_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingFaq = await new FaqModel().first({ id });

      if (!existingFaq) {
        return res.status(404).send({
          success: false,
          message: req.t("FAQ.FAQ_NOT_FOUND"),
        });
      }

      await new FaqModel().delete(id);
      await knex("faq_pivots").where("faq_id", id).whereNull("deleted_at").update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("FAQ.FAQ_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("FAQ.FAQ_DELETED_ERROR"),
      });
    }
  }
}
