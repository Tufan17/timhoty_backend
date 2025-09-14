import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourPackageOpportunityModel from "@/models/TourPackageOpportunityModel";
import { translateCreate, translateUpdate } from "@/helper/translate";  
import TourPackageModel from "@/models/TourPackageModel";

export default class TourPackageOpportunityController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        tour_package_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        tour_package_id?: string;
      };

      const language = (req as any).language;
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      // Base query with JOINs
      const base = knex("tour_package_opportunities")
        .whereNull("tour_package_opportunities.deleted_at")
        .innerJoin("tour_package_opportunity_pivots", "tour_package_opportunities.id", "tour_package_opportunity_pivots.tour_package_opportunity_id")
        .innerJoin("tour_packages", "tour_package_opportunities.tour_package_id", "tour_packages.id")
        .where("tour_package_opportunity_pivots.language_code", language)
        .whereNull("tour_package_opportunity_pivots.deleted_at")
        .whereNull("tour_packages.deleted_at")
        .modify((qb) => {
          // Filter by solution partner from authenticated user
          if (spFromUser) qb.where("tour_packages.solution_partner_id", spFromUser);

          if (tour_package_id) qb.where("tour_package_opportunities.tour_package_id", tour_package_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("tour_package_opportunity_pivots.name", "ilike", like)
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("tour_package_opportunities.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("tour_package_opportunities.id")
        .select(
          "tour_package_opportunities.*",
          "tour_package_opportunity_pivots.name",
          "tour_packages.location_id"
        )
        .orderBy("tour_package_opportunities.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_FETCHED_SUCCESS"),
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
          message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { tour_package_id } = req.query as { tour_package_id?: string };

      let query = knex("tour_package_opportunities")
        .whereNull("tour_package_opportunities.deleted_at")
        .select(
          "tour_package_opportunities.*", 
          "tour_package_opportunity_pivots.name",
        )
        .innerJoin("tour_package_opportunity_pivots", "tour_package_opportunities.id", "tour_package_opportunity_pivots.tour_package_opportunity_id")
        .where("tour_package_opportunity_pivots.language_code", language)
        .whereNull("tour_package_opportunity_pivots.deleted_at");

      if (tour_package_id) {
        query = query.where("tour_package_opportunities.tour_package_id", tour_package_id);
      }

      const tourPackageOpportunities = await query;
      
      return res.status(200).send({
        success: true,
            message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_FETCHED_SUCCESS"),
        data: tourPackageOpportunities,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;

      const TourPackageOpportunity = await knex("tour_package_opportunities")
        .whereNull("tour_package_opportunities.deleted_at")
        .where("tour_package_opportunities.id", id)
        .select(
          "tour_package_opportunities.*", 
          "tour_package_opportunity_pivots.name",
        )
        .innerJoin("tour_package_opportunity_pivots", "tour_package_opportunities.id", "tour_package_opportunity_pivots.tour_package_opportunity_id")
        .where("tour_package_opportunity_pivots.language_code", language)
        .whereNull("tour_package_opportunity_pivots.deleted_at")
        .first();

      if (!TourPackageOpportunity) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_FETCHED_SUCCESS"),
        data: TourPackageOpportunity,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { 
        tour_package_id,
        name,
      } = req.body as {
        tour_package_id: string;
        name: string;
      };
      const existTourPackage = await new TourPackageModel().findId(tour_package_id);
      if (!existTourPackage) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE.TOUR_PACKAGE_NOT_FOUND"),
        });
      }

      // Validate tour_package_id
      const existingTourPackageOpportunity = await new TourPackageOpportunityModel().existOpportunity({
        tour_package_id,
        name,
      });

      if (existingTourPackageOpportunity) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_ALREADY_EXISTS"),
        });
      } 

      // Create tour_package_opportunity
      const TourPackageOpportunity = await new TourPackageOpportunityModel().create({
        tour_package_id,
      });

      // Create translations
      const translateResult = await translateCreate({
          target: "tour_package_opportunity_pivots",
        target_id_key: "tour_package_opportunity_id",
        target_id: TourPackageOpportunity.id,
        language_code: (req as any).language,
        data: {
          name,
        },
      });

      TourPackageOpportunity.tour_package_opportunity_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_CREATED_SUCCESS"),
        data: TourPackageOpportunity,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { 
        tour_package_id,
        name,
      } = req.body as {
        tour_package_id?: string;
        name?: string;
      };

      const existingTourPackageOpportunity = await new TourPackageOpportunityModel().first({ id });

      if (!existingTourPackageOpportunity) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_NOT_FOUND"),
        });
      }

      // Validate tour_package_id if provided
      if (tour_package_id) {
          const existingTourPackage = await new TourPackageModel().first({
          "tour_packages.id": tour_package_id,
        });

        if (!existingTourPackage) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR_PACKAGE.TOUR_PACKAGE_NOT_FOUND"),
          });
        }
      }

      // Update tour_package_opportunity if tour_package_id is provided
      if (tour_package_id) {
        await new TourPackageOpportunityModel().update(id, {
          tour_package_id: tour_package_id !== undefined ? tour_package_id : existingTourPackageOpportunity.tour_package_id,
        });
      }
      
      // Update translations if provided
      if (name) {
        await translateUpdate({
          target: "tour_package_opportunity_pivots",
          target_id_key: "tour_package_opportunity_id",
          target_id: id,
          data: {
            ...(name && { name }),
          },
          language_code: (req as any).language,
        });
      }

      const updatedTourPackageOpportunity = await new TourPackageOpportunityModel().oneToMany(
        id,
        "tour_package_opportunity_pivots",
        "tour_package_opportunity_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_UPDATED_SUCCESS"),
        data: updatedTourPackageOpportunity,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingTourPackageOpportunity = await new TourPackageOpportunityModel().first({ id });

      if (!existingTourPackageOpportunity) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_NOT_FOUND"),
        });
      }

      await new TourPackageOpportunityModel().delete(id);
      await knex("tour_package_opportunity_pivots")
        .where("tour_package_opportunity_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
            message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
          message: req.t("TOUR_PACKAGE_OPPORTUNITY.TOUR_PACKAGE_OPPORTUNITY_DELETED_ERROR"),
      });
    }
  }
}
