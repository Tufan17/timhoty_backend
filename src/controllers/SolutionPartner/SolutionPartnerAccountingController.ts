import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class SolutionPartnerAccountingController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 12,
        search = "",
        status = true,
        reservation_type,
        start_date,
        end_date,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        status?: boolean;
        reservation_type?: "hotel" | "tour" | "activity" | "car_rental" | "visa";
        start_date?: string;
        end_date?: string;
      };


      const language = (req as any).language || "en";
      const solutionPartnerUser = (req as any).user;
      const solutionPartnerId = solutionPartnerUser?.solution_partner_id;

      if (!solutionPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      // Varsayılan olarak bu ayın başlangıcı ve sonu
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const dateFrom = start_date ? new Date(start_date) : startOfMonth;
      const dateTo = end_date ? new Date(end_date) : endOfMonth;

      // Tüm rezervasyonları birleştir
      const unionQueries = [];

      // Hotel Reservations
      if (!reservation_type || reservation_type === "hotel") {
        const hotelQuery = knex("hotel_reservations")

          .whereNull("hotel_reservations.deleted_at")
          .where("hotel_reservations.status", status)
          .where("hotel_reservations.created_at", ">=", dateFrom)
          .where("hotel_reservations.created_at", "<=", dateTo)
          .innerJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
          .whereNull("hotels.deleted_at")
          .where("hotels.solution_partner_id", solutionPartnerId)
          .innerJoin("hotel_pivots", function() {
            this.on("hotels.id", "=", "hotel_pivots.hotel_id")
              .andOn("hotel_pivots.language_code", "=", knex.raw("?", [language]));
          })
          .whereNull("hotel_pivots.deleted_at")
          .leftJoin("users", "hotel_reservations.created_by", "users.id")
          .modify((qb) => {
            if (search) {
              const like = `%${search}%`;
              qb.andWhere((w) => {
                w.where("hotel_pivots.name", "ilike", like)
                  .orWhere("hotel_reservations.progress_id", "ilike", like)
                  .orWhere("users.name_surname", "ilike", like)
                  .orWhere("users.email", "ilike", like);
              });
            }
          })
          .select(
            "hotel_reservations.id",
            "hotel_reservations.created_at",
            "hotel_reservations.price",
            "hotel_reservations.currency_code",
            "hotel_reservations.status",
            "hotel_reservations.progress_id",
            "hotel_pivots.name as service_name",
            "users.name_surname as user_name",
            "users.email as user_email",
            knex.raw("'hotel' as reservation_type"),
            knex.raw("CASE WHEN hotel_reservations.status THEN 'Paid' ELSE 'Pending' END as payment_status")
          );
        unionQueries.push(hotelQuery);
      }

      // Tour Reservations
      if (!reservation_type || reservation_type === "tour") {
        const tourQuery = knex("tour_reservations")
          .whereNull("tour_reservations.deleted_at")
          .where("tour_reservations.status", status)
          .where("tour_reservations.created_at", ">=", dateFrom)
          .where("tour_reservations.created_at", "<=", dateTo)
          .innerJoin("tours", "tour_reservations.tour_id", "tours.id")
          .where("tours.solution_partner_id", solutionPartnerId)
          .whereNull("tours.deleted_at")
          .innerJoin("tour_pivots", function() {
            this.on("tours.id", "=", "tour_pivots.tour_id")
              .andOn("tour_pivots.language_code", "=", knex.raw("?", [language]));
          })
          .whereNull("tour_pivots.deleted_at")
          .leftJoin("users", "tour_reservations.created_by", "users.id")
          .modify((qb) => {
            if (search) {
              const like = `%${search}%`;
              qb.andWhere((w) => {
                w.where("tour_pivots.title", "ilike", like)
                  .orWhere("tour_reservations.progress_id", "ilike", like)
                  .orWhere("users.name_surname", "ilike", like)
                  .orWhere("users.email", "ilike", like);
              });
            }
          })
          .select(
            "tour_reservations.id",
            "tour_reservations.created_at",
            "tour_reservations.price",
            "tour_reservations.currency_code",
            "tour_reservations.status",
            "tour_reservations.progress_id",
            "tour_pivots.title as service_name",
            "users.name_surname as user_name",
            "users.email as user_email",
            knex.raw("'tour' as reservation_type"),
            knex.raw("CASE WHEN tour_reservations.status THEN 'Paid' ELSE 'Pending' END as payment_status")
          );
        unionQueries.push(tourQuery);
      }

      // Activity Reservations
      if (!reservation_type || reservation_type === "activity") {
        const activityQuery = knex("activity_reservations")
          .whereNull("activity_reservations.deleted_at")
          .where("activity_reservations.status", status)
          .where("activity_reservations.created_at", ">=", dateFrom)
          .where("activity_reservations.created_at", "<=", dateTo)
          .innerJoin("activities", "activity_reservations.activity_id", "activities.id")
          .where("activities.solution_partner_id", solutionPartnerId)
          .whereNull("activities.deleted_at")
          .innerJoin("activity_pivots", function() {
            this.on("activities.id", "=", "activity_pivots.activity_id")
              .andOn("activity_pivots.language_code", "=", knex.raw("?", [language]));
          })
          .whereNull("activity_pivots.deleted_at")
          .leftJoin("users", "activity_reservations.created_by", "users.id")
          .modify((qb) => {
            if (search) {
              const like = `%${search}%`;
              qb.andWhere((w) => {
                w.where("activity_pivots.title", "ilike", like)
                  .orWhere("activity_reservations.progress_id", "ilike", like)
                  .orWhere("users.name_surname", "ilike", like)
                  .orWhere("users.email", "ilike", like);
              });
            }
          })
          .select(
            "activity_reservations.id",
            "activity_reservations.created_at",
            "activity_reservations.price",
            "activity_reservations.currency_code",
            "activity_reservations.status",
            "activity_reservations.progress_id",
            "activity_pivots.title as service_name",
            "users.name_surname as user_name",
            "users.email as user_email",
            knex.raw("'activity' as reservation_type"),
            knex.raw("CASE WHEN activity_reservations.status THEN 'Paid' ELSE 'Pending' END as payment_status")
          );
        unionQueries.push(activityQuery);
      }

      // Car Rental Reservations
      if (!reservation_type || reservation_type === "car_rental") {
        const carRentalQuery = knex("car_rental_reservations")
          .whereNull("car_rental_reservations.deleted_at")
          .where("car_rental_reservations.status", status)
          .where("car_rental_reservations.created_at", ">=", dateFrom)
          .where("car_rental_reservations.created_at", "<=", dateTo)
          .innerJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
          .where("car_rentals.solution_partner_id", solutionPartnerId)
          .whereNull("car_rentals.deleted_at")
          .innerJoin("car_rental_pivots", function() {
            this.on("car_rentals.id", "=", "car_rental_pivots.car_rental_id")
              .andOn("car_rental_pivots.language_code", "=", knex.raw("?", [language]));
          })
          .whereNull("car_rental_pivots.deleted_at")
          .leftJoin("users", "car_rental_reservations.created_by", "users.id")
          .modify((qb) => {
            if (search) {
              const like = `%${search}%`;
              qb.andWhere((w) => {
                w.where("car_rental_pivots.title", "ilike", like)
                  .orWhere("car_rental_reservations.progress_id", "ilike", like)
                  .orWhere("users.name_surname", "ilike", like)
                  .orWhere("users.email", "ilike", like);
              });
            }
          })
          .select(
            "car_rental_reservations.id",
            "car_rental_reservations.created_at",
            "car_rental_reservations.price",
            "car_rental_reservations.currency_code",
            "car_rental_reservations.status",
            "car_rental_reservations.progress_id",
            "car_rental_pivots.title as service_name",
            "users.name_surname as user_name",
            "users.email as user_email",
            knex.raw("'car_rental' as reservation_type"),
            knex.raw("CASE WHEN car_rental_reservations.status THEN 'Paid' ELSE 'Pending' END as payment_status")
          );
        unionQueries.push(carRentalQuery);
      }

      // Visa Reservations
      if (!reservation_type || reservation_type === "visa") {
        const visaQuery = knex("visa_reservations")
          .whereNull("visa_reservations.deleted_at")
          .where("visa_reservations.status", status)
          .where("visa_reservations.created_at", ">=", dateFrom)
          .where("visa_reservations.created_at", "<=", dateTo)
          .innerJoin("visas", "visa_reservations.visa_id", "visas.id")
          .where("visas.solution_partner_id", solutionPartnerId)
          .whereNull("visas.deleted_at")
          .innerJoin("visa_pivots", function() {
            this.on("visas.id", "=", "visa_pivots.visa_id")
              .andOn("visa_pivots.language_code", "=", knex.raw("?", [language]));
          })
          .whereNull("visa_pivots.deleted_at")
          .leftJoin("users", "visa_reservations.created_by", "users.id")
          .modify((qb) => {
            if (search) {
              const like = `%${search}%`;
              qb.andWhere((w) => {
                w.where("visa_pivots.title", "ilike", like)
                  .orWhere("visa_reservations.progress_id", "ilike", like)
                  .orWhere("users.name_surname", "ilike", like)
                  .orWhere("users.email", "ilike", like);
              });
            }
          })
          .select(
            "visa_reservations.id",
            "visa_reservations.created_at",
            "visa_reservations.price",
            "visa_reservations.currency_code",
            "visa_reservations.status",
            "visa_reservations.progress_id",
            "visa_pivots.title as service_name",
            "users.name_surname as user_name",
            "users.email as user_email",
            knex.raw("'visa' as reservation_type"),
            knex.raw("CASE WHEN visa_reservations.status THEN 'Paid' ELSE 'Pending' END as payment_status")
          );
        unionQueries.push(visaQuery);
      }

      if (unionQueries.length === 0) {
        return res.status(200).send({
          success: true,
          message: "Reservations fetched successfully",
          data: [],
          statistics: {
            totalRevenue: 0,
            paidCount: 0,
            pendingCount: 0,
            totalCount: 0,
          },
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          limit: Number(limit),
        });
      }

      // Execute all queries separately
      const allQueries = unionQueries.map(async (query) => await query);
      const allResults = await Promise.all(allQueries);

      // Flatten results
      let allData: any[] = [];
      allResults.forEach(result => {
        allData = [...allData, ...(Array.isArray(result) ? result : [result])];
      });

      // Sort by created_at desc
      allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate statistics
      const totalRevenue = allData.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const paidCount = allData.filter(item => item.status === true).length;
      const pendingCount = allData.filter(item => item.status === false).length;
      const total = allData.length;

      // Paginate
      const totalPages = Math.ceil(total / Number(limit));
      const offset = (Number(page) - 1) * Number(limit);
      const data = allData.slice(offset, offset + Number(limit));

      return res.status(200).send({
        success: true,
        message: "Reservations fetched successfully",
        data: data,
        statistics: {
          totalRevenue,
          paidCount,
          pendingCount,
          totalCount: total,
        },
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      console.error("Get accounting data error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }
}

