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
            .orWhere(
              "sales_partner_commissions.commission_type",
              "ilike",
              `%${search}%`
            )
            .orWhere(
              "sales_partner_commissions.commission_currency",
              "ilike",
              `%${search}%`
            )
            .orWhere("sales_partners.name", "ilike", `%${search}%`);

          // Handle numeric search for commission_value
          const numericSearch = parseFloat(search);
          if (!isNaN(numericSearch)) {
            this.orWhere(
              "sales_partner_commissions.commission_value",
              numericSearch
            );
          }
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere(
              "sales_partner_commissions.status",
              search.toLowerCase() === "true"
            );
          }
          if (sales_partner_id) {
            this.where(
              "sales_partner_commissions.sales_partner_id",
              sales_partner_id
            );
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
      const language = req.headers["accept-language"] as string || "en";
      
      const salesPartnerCommissions =
        await new SalesPartnerCommissionModel().getAll("", {
          sales_partner_id: id,
        });

      // Her komisyon için service adını getir
      const commissionsWithServiceName = await Promise.all(
        salesPartnerCommissions.map(async (commission: any) => {
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
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_SUCCESS"
        ),
        data: commissionsWithServiceName,
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
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = req.headers["accept-language"] as string || "en";
      
      const sales_partner_commission =
        await new SalesPartnerCommissionModel().first({ id });

      if (!sales_partner_commission) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_NOT_FOUND"
          ),
        });
      }

      // Service adını getir
      let serviceName = req.t("GENERAL");
      if (sales_partner_commission.service_id && sales_partner_commission.service_type) {
        try {
          if (sales_partner_commission.service_type === "hotel") {
            const hotel = await knex("hotels")
              .leftJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
              .where("hotels.id", sales_partner_commission.service_id)
              .where("hotel_pivots.language_code", language)
              .whereNull("hotels.deleted_at")
              .select("hotel_pivots.name as name")
              .first();
            serviceName = hotel?.name || req.t("GENERAL");
          } else if (sales_partner_commission.service_type === "rental") {
            const carRental = await knex("car_rentals")
              .leftJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
              .where("car_rentals.id", sales_partner_commission.service_id)
              .where("car_rental_pivots.language_code", language)
              .whereNull("car_rentals.deleted_at")
              .select("car_rental_pivots.title as name")
              .first();
            serviceName = carRental?.name || req.t("GENERAL");
          } else if (sales_partner_commission.service_type === "activity") {
            const activity = await knex("activities")
              .leftJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
              .where("activities.id", sales_partner_commission.service_id)
              .where("activity_pivots.language_code", language)
              .whereNull("activities.deleted_at")
              .select("activity_pivots.title as name")
              .first();
            serviceName = activity?.name || req.t("GENERAL");
          } else if (sales_partner_commission.service_type === "tour") {
            const tour = await knex("tours")
              .leftJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
              .where("tours.id", sales_partner_commission.service_id)
              .where("tour_pivots.language_code", language)
              .whereNull("tours.deleted_at")
              .select("tour_pivots.title as name")
              .first();
            serviceName = tour?.name || req.t("GENERAL");
          }
        } catch (error) {
          console.log(`Error fetching service name for ${sales_partner_commission.service_type}:`, error);
        }
      }

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_FETCHED_SUCCESS"
        ),
        data: {
          ...sales_partner_commission,
          service_name: serviceName,
        },
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
        service_id,
      } = req.body as {
        sales_partner_id: string;
        service_type: string;
        commission_type: string;
        commission_value: number;
        commission_currency: string;
        service_id: string;
      };

      const existingSalesPartnerCommission =
        await new SalesPartnerCommissionModel().first({
          sales_partner_id,
          service_type,
        });

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

      const salesPartnerCommission =
        await new SalesPartnerCommissionModel().create({
          sales_partner_id,
          service_type,
          commission_type,
          commission_value,
          commission_currency,
          service_id,
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
        service_id,
      } = req.body as {
        service_type: string;
        commission_type: string;
        commission_value: number;
        commission_currency: string;
        service_id: string;
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

      if (
        service_type &&
        service_type !== existingSalesPartnerCommission.service_type
      ) {
        // check if service_type is already taken for this sales partner
        const existingSalesPartnerCommissionByServiceType =
          await new SalesPartnerCommissionModel().first({
            sales_partner_id: existingSalesPartnerCommission.sales_partner_id,
            service_type,
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
        service_type:
          service_type || existingSalesPartnerCommission.service_type,
        commission_type:
          commission_type || existingSalesPartnerCommission.commission_type,
        commission_value:
          commission_value || existingSalesPartnerCommission.commission_value,
        commission_currency:
          commission_currency ||
          existingSalesPartnerCommission.commission_currency,
        service_id: service_id || existingSalesPartnerCommission.service_id,
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

  async service(req: FastifyRequest, res: FastifyReply) {
    try {
      const { type } = req.params as { type: string };
      const language = req.headers["accept-language"] as string;
      let serviceAll: any[] = [];
      if (type === "hotel") {
        serviceAll = await knex("hotels")
          .leftJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
          .where("hotel_pivots.language_code", language)
          .whereNull("hotels.deleted_at")
          .select("hotels.id", "hotel_pivots.name as name");
      }
      if (type === "car_rental") {
        serviceAll = await knex("car_rentals")
          .leftJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
          .where("car_rental_pivots.language_code", language)
          .whereNull("car_rentals.deleted_at")
          .select("car_rentals.id", "car_rental_pivots.title as name");
      }
      if (type === "activity") {
        serviceAll = await knex("activities")
          .leftJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
          .where("activity_pivots.language_code", language)
          .whereNull("activities.deleted_at")
          .select("activities.id", "activity_pivots.title as name");
      }
      if (type === "tour") {
        serviceAll = await knex("tours")
          .leftJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
          .where("tour_pivots.language_code", language)
          .whereNull("tours.deleted_at")
          .select("tours.id", "tour_pivots.title as name");
      }
      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_SERVICE_FETCHED_SUCCESS"
        ),
        data: serviceAll,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_COMMISSION.SALES_PARTNER_COMMISSION_SERVICE_ERROR"
        ),
      });
    }
  }
}
