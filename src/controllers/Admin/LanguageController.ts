

import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import LanguageModel from "@/models/LanguageModel";

export default class LanguageController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
      const query = knex("languages")
        
        .whereNull("languages.deleted_at")
        .where(function () {
          this.where("name", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("is_active", search.toLowerCase() === "true");
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
        message: req.t("LANGUAGE.LANGUAGE_FETCHED_SUCCESS"),
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
        message: req.t("LANGUAGE.LANGUAGE_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = await new LanguageModel().first({ id });
      return res.status(200).send({
        success: true,
        message: req.t("LANGUAGE.LANGUAGE_FETCHED_SUCCESS"),
        data: language,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("LANGUAGE.LANGUAGE_FETCHED_ERROR"),
      });
    }
  }

  async findAllActive(req: FastifyRequest, res: FastifyReply) {
    try {
      const languages = await new LanguageModel().getAll();
      return res.status(200).send({
        success: true,
        message: req.t("LANGUAGE.LANGUAGE_FETCHED_SUCCESS"),
        data: languages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("LANGUAGE.LANGUAGE_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, code } = req.body as {
        name: string;
        code: string;
      };

      const existingLanguage = await new LanguageModel().first({ code });

      if (existingLanguage) {
        return res.status(400).send({
          success: false,
          message: req.t("LANGUAGE.LANGUAGE_ALREADY_EXISTS"),
        });
      }
      await new LanguageModel().create({
        code:code.toLowerCase(),
        name:name,
      });

      const language = await new LanguageModel().first({ code });

      return res.status(200).send({
        success: true,
        message: req.t("LANGUAGE.LANGUAGE_CREATED_SUCCESS"),
        data: language,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("LANGUAGE.LANGUAGE_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name, code } = req.body as {
        name: string;
        code: string;
      };

      const existingLanguage = await new LanguageModel().first({ id });

      if (!existingLanguage) {
        return res.status(404).send({
          success: false,
          message: req.t("LANGUAGE.LANGUAGE_NOT_FOUND"),
        });
      }

      let body: any = {
        name: name || existingLanguage.name,
        code: code.toLowerCase() || existingLanguage.code,
      };

    await new LanguageModel().update(id, body);

      const updatedLanguage = await new LanguageModel().first({ id });
    

      return res.status(200).send({
        success: true,
        message: req.t("LANGUAGE.LANGUAGE_UPDATED_SUCCESS"),
        data: updatedLanguage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("LANGUAGE.LANGUAGE_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingLanguage = await new LanguageModel().first({ id });

      if (!existingLanguage) {
        return res.status(404).send({
          success: false,
          message: req.t("LANGUAGE.LANGUAGE_NOT_FOUND"),
        });
      }

      await new LanguageModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("LANGUAGE.LANGUAGE_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("LANGUAGE.LANGUAGE_DELETED_ERROR"),
      });
    }
  }
}
