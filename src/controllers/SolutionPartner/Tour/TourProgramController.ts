import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourProgramModel from "@/models/TourProgramModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import TourModel from "@/models/TourModel";

export default class TourProgramController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        tour_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        tour_id?: string;
      };

      const language = (req as any).language;
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      // Base query with JOINs
      const base = knex("tour_programs")
        .whereNull("tour_programs.deleted_at")
        .innerJoin(
          "tour_program_pivots",
          "tour_programs.id",
          "tour_program_pivots.tour_program_id"
        )
        .innerJoin("tours", "tour_programs.tour_id", "tours.id")
        .where("tour_program_pivots.language_code", language)
        .whereNull("tour_program_pivots.deleted_at")
        .whereNull("tours.deleted_at")
        .modify((qb) => {
          // Filter by solution partner from authenticated user
          if (spFromUser) qb.where("tours.solution_partner_id", spFromUser);

          if (tour_id) qb.where("tour_programs.tour_id", tour_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("tour_program_pivots.name", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("tour_programs.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("tour_programs.id")
        .select(
          "tour_programs.*",
          "tour_program_pivots.name",
          "tours.location_id"
        )
        .orderBy("tour_programs.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_FETCHED_SUCCESS"),
        data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { tour_id } = req.query as { tour_id?: string };

      let query = knex("tour_programs")
        .whereNull("tour_programs.deleted_at")
        .select("tour_programs.*", "tour_program_pivots.name")
        .innerJoin(
          "tour_program_pivots",
          "tour_programs.id",
          "tour_program_pivots.tour_program_id"
        )
        .where("tour_program_pivots.language_code", language)
        .whereNull("tour_program_pivots.deleted_at");

      if (tour_id) {
        query = query.where("tour_programs.tour_id", tour_id);
      }

      const tourPrograms = await query;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_FETCHED_SUCCESS"),
        data: tourPrograms,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;

      const tourProgram = await knex("tour_programs")
        .whereNull("tour_programs.deleted_at")
        .where("tour_programs.id", id)
        .select("tour_programs.*", "tour_program_pivots.name")
        .innerJoin(
          "tour_program_pivots",
          "tour_programs.id",
          "tour_program_pivots.tour_program_id"
        )
        .where("tour_program_pivots.language_code", language)
        .whereNull("tour_program_pivots.deleted_at")
        .first();

      if (!tourProgram) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_FETCHED_SUCCESS"),
        data: tourProgram,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        tour_id,
        title,
        content,
        order,
        status = true,
      } = req.body as {
        tour_id: string;
        title: string;
        content: string;
        order: string;
        status?: boolean;
      };

      const existTour = await new TourModel().findId(tour_id);
      if (!existTour) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR.TOUR_NOT_FOUND"),
        });
      }

      // Create tour feature
      const tourProgram = await new TourProgramModel().create({
        tour_id,
        status,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "tour_program_pivots",
        target_id_key: "tour_program_id",
        target_id: tourProgram.id,
        language_code: (req as any).language,
        data: {
          title,
          content,
        },
      });

      tourProgram.tour_program_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_CREATED_SUCCESS"),
        data: tourProgram,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { tour_id, title, content, status } = req.body as {
        tour_id?: string;
        title?: string;
        content?: string;
        status?: boolean;
      };

      const existingTourProgram = await new TourProgramModel().first({ id });

      if (!existingTourProgram) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_NOT_FOUND"),
        });
      }

      // Validate tour_id if provided
      if (tour_id) {
        const existingTour = await new TourModel().first({
          "tours.id": tour_id,
        });

        if (!existingTour) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR.TOUR_NOT_FOUND"),
          });
        }
      }

      // Update tour feature if tour_id or status is provided
      if (tour_id || status !== undefined) {
        await new TourProgramModel().update(id, {
          ...(tour_id && { tour_id }),
          ...(status !== undefined && { status }),
        });
      }

      // Update translations if name is provided
      if (title) {
        await translateUpdate({
          target: "tour_program_pivots",
          target_id_key: "tour_program_id",
          target_id: id,
          data: {
            title,
            content,
          },
          language_code: (req as any).language,
        });
      }

      const updatedTourProgram = await new TourProgramModel().oneToMany(
        id,
        "tour_program_pivots",
        "tour_program_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_UPDATED_SUCCESS"),
        data: updatedTourProgram,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingTourProgram = await new TourProgramModel().first({ id });

      if (!existingTourProgram) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_NOT_FOUND"),
        });
      }

      await new TourProgramModel().delete(id);
      await knex("tour_program_pivots")
        .where("tour_program_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PROGRAM.TOUR_PROGRAM_DELETED_ERROR"),
      });
    }
  }
}
