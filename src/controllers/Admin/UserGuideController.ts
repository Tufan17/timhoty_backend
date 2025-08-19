import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import UserGuideModel from "@/models/UserGuideModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class UserGuideController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const language = req.language;

      const query = knex("user_guides")
        .whereNull("user_guides.deleted_at")
        .innerJoin("user_guide_pivots", "user_guides.id", "user_guide_pivots.user_guide_id")
        .where("user_guide_pivots.language_code", language)
        .where(function () {
          this.where("user_guide_pivots.title", "ilike", `%${search}%`);
        })
        .select("user_guides.*", "user_guide_pivots.title as title","user_guide_pivots.description as description")
        .groupBy("user_guides.id", "user_guide_pivots.title","user_guide_pivots.description");
        
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("user_guides.order", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_SUCCESS"),
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
        message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const userGuide = await new UserGuideModel().oneToMany(id, "user_guide_pivots", "user_guide_id");
      
      return res.status(200).send({
        success: true,
        message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_SUCCESS"),
        data: userGuide,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { title, description, order } = req.body as {
        title: string;
        description: string;
        order: string;
      };

      const userGuide = await new UserGuideModel().create({
        order,
      });
      const translateResult = await translateCreate({
        target: "user_guide_pivots",
        target_id_key: "user_guide_id",
        target_id: userGuide.id,
        data: {
          title,
          description,
        },
        language_code: req.language,
      });
      userGuide.user_guide_pivots = translateResult;


      return res.status(200).send({
        success: true,
        message: req.t("USER_GUIDE.USER_GUIDE_CREATED_SUCCESS"),
        data: userGuide,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("USER_GUIDE.USER_GUIDE_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { title, description, order } = req.body as {
        title: string;
        description: string;
        order: string;
      };

      const existingUserGuide = await new UserGuideModel().first({ id });

      if (!existingUserGuide) {
        return res.status(404).send({
          success: false,
          message: req.t("USER_GUIDE.USER_GUIDE_NOT_FOUND"),
        });
      }

      let body: any = {
        order: order || existingUserGuide.order,
      };

      await new UserGuideModel().update(id, body);
      await translateUpdate({
        target: "user_guide_pivots",
        target_id_key: "user_guide_id",
        target_id: id,
        data: {
          title,
          description,
        },
        language_code: req.language,
      });
      const updatedUserGuide = await new UserGuideModel().oneToMany(id, "user_guide_pivots", "user_guide_id");

      return res.status(200).send({
        success: true,
        message: req.t("USER_GUIDE.USER_GUIDE_UPDATED_SUCCESS"),
        data: updatedUserGuide,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("USER_GUIDE.USER_GUIDE_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingUserGuide = await new UserGuideModel().first({ id });

      if (!existingUserGuide) {
        return res.status(404).send({
          success: false,
          message: req.t("USER_GUIDE.USER_GUIDE_NOT_FOUND"),
        });
      }

      await new UserGuideModel().delete(id);
      await knex("user_guide_pivots").where("user_guide_id", id).whereNull("deleted_at").update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("USER_GUIDE.USER_GUIDE_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("USER_GUIDE.USER_GUIDE_DELETED_ERROR"),
      });
    }
  }
}
