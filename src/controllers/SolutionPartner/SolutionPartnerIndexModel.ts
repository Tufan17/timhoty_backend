import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import SolutionPartnerModel from "@/models/SolutionPartnerModel";
import SolutionPartnerCommissionModel from "@/models/SolutionPartnerCommissionModel";

export default class SolutionPartnerIndexController {
  async getIndex(req: FastifyRequest, res: FastifyReply) {
    try {
      const solutionPartnerUser = (req as any).user;
      const solutionPartnerId = solutionPartnerUser?.solution_partner_id;

      if (!solutionPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const index = await new SolutionPartnerModel().first({ id: solutionPartnerId });
      if (!index) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER_INDEX.INDEX_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER_INDEX.INDEX_FETCHED_SUCCESS"),
        data: index,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER_INDEX.INDEX_FETCHED_ERROR"),
      });
    }
  }

  async updateIndex(req: FastifyRequest, res: FastifyReply) {
    try {
      const solutionPartnerUser = (req as any).user;
      const id = solutionPartnerUser?.solution_partner_id;

      if (!id) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const body = req.body as any;

      // Check if index belongs to the solution partner
      const existingIndex = await new SolutionPartnerModel().first({ id: id });
      if (!existingIndex) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER_INDEX.INDEX_NOT_FOUND"),
        });
      }

      const updatedIndex = await new SolutionPartnerModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER_INDEX.INDEX_UPDATED_SUCCESS"),
        data: updatedIndex[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER_INDEX.INDEX_UPDATED_ERROR"),
      });
    }
  }

  async getCommissions(req: FastifyRequest, res: FastifyReply) {
    try {
      const solutionPartnerUser = (req as any).user;
      const id = solutionPartnerUser?.solution_partner_id;

      if (!id) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const language = (req as any).language || "en";

      const commissions = await new SolutionPartnerCommissionModel().getAll("", {
        solution_partner_id: id,
      });

      // Her komisyon için service adını getir
      const commissionsWithServiceName = await Promise.all(
        commissions.map(async (commission: any) => {
          let serviceName = req.t("GENERAL");

          if (commission.service_id && commission.service_type) {
            try {
              if (commission.service_type === "hotel") {
                const hotel = await knex("hotels")
                  .leftJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
                  .where("hotels.id", commission.service_id)
                  .where("hotel_pivots.language_code", language)
                  .whereNull("hotels.deleted_at")
                  .select("hotel_pivots.name as name")
                  .first();
                serviceName = hotel?.name || req.t("GENERAL");
              } else if (commission.service_type === "rental") {
                const carRental = await knex("car_rentals")
                  .leftJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
                  .where("car_rentals.id", commission.service_id)
                  .where("car_rental_pivots.language_code", language)
                  .whereNull("car_rentals.deleted_at")
                  .select("car_rental_pivots.title as name")
                  .first();
                serviceName = carRental?.name || req.t("GENERAL");
              } else if (commission.service_type === "activity") {
                const activity = await knex("activities")
                  .leftJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
                  .where("activities.id", commission.service_id)
                  .where("activity_pivots.language_code", language)
                  .whereNull("activities.deleted_at")
                  .select("activity_pivots.title as name")
                  .first();
                serviceName = activity?.name || req.t("GENERAL");
              } else if (commission.service_type === "tour") {
                const tour = await knex("tours")
                  .leftJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
                  .where("tours.id", commission.service_id)
                  .where("tour_pivots.language_code", language)
                  .whereNull("tours.deleted_at")
                  .select("tour_pivots.title as name")
                  .first();
                serviceName = tour?.name || req.t("GENERAL");
              } else if (commission.service_type === "visa") {
                const visa = await knex("visas")
                  .leftJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
                  .where("visas.id", commission.service_id)
                  .where("visa_pivots.language_code", language)
                  .whereNull("visas.deleted_at")
                  .select("visa_pivots.title as name")
                  .first();
                serviceName = visa?.name || req.t("GENERAL");
              }
            } catch (error) {
              console.log(`Error fetching service name for ${commission.service_type}:`, error);
            }
          }

          return {
            ...commission,
            service_name: serviceName,
          };
        })
      );

      return res.status(200).send({
        success: true,
        message: req.t("SOLUTION_PARTNER_INDEX.COMMISSIONS_FETCHED_SUCCESS"),
        data: commissionsWithServiceName,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("SOLUTION_PARTNER_INDEX.COMMISSIONS_FETCHED_ERROR"),
      });
    }
  }
}
