import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class TourController {
  async index(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const query = req.query as any;
      const {page = 1, limit = 9} = query;
      const date = query.date || new Date().toISOString().split('T')[0]; // Default bugünün tarihi
      
      const tours = await knex("tours")
        .whereNull("tours.deleted_at")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .innerJoin("cities", "tours.location_id", "cities.id")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .innerJoin("countries", "cities.country_id", "countries.id")
        .innerJoin("country_pivots", "countries.id", "country_pivots.country_id")
        .where("tour_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("country_pivots.deleted_at")
        .select(
          "tours.*", 
          "tour_pivots.title",
          "city_pivots.name as city_name",
          "country_pivots.name as country_name"
        )
        .orderBy("tours.created_at", "desc")
        .offset((page - 1) * limit)
        .limit(limit);

      const [{ count: total }] = await knex("tours")
        .whereNull("tours.deleted_at")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .innerJoin("cities", "tours.location_id", "cities.id")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .innerJoin("countries", "cities.country_id", "countries.id")
        .innerJoin("country_pivots", "countries.id", "country_pivots.country_id")
        .where("tour_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("country_pivots.deleted_at")
        .count("tours.id as count");

      const totalPages = Math.ceil(Number(total) / limit);

      // Her tur için paket fiyatını ve departure points'leri getir
      const toursWithPrices = await Promise.all(
        tours.map(async (tour) => {
          // İlk paketi bul
          const firstPackage = await knex("tour_packages")
            .where("tour_id", tour.id)
            .whereNull("deleted_at")
            .orderBy("id", "asc")
            .first();

          let packagePrice = null;

          if (firstPackage) {
            if (firstPackage.constant_price) {
              // Sabit fiyat - ilk fiyatı al
              const price = await knex("tour_package_prices")
                .where("tour_package_id", firstPackage.id)
                .whereNull("deleted_at")
                .select("main_price", "child_price", "baby_price")
                .first();
              
              packagePrice = price;
            } else {
              // Tarihe göre fiyat - belirtilen tarihe uygun fiyatı bul
              const price = await knex("tour_package_prices")
                .where("tour_package_id", firstPackage.id)
                .whereNull("deleted_at")
                .where("start_date", "<=", date)
                .where(function() {
                  this.whereNull("end_date").orWhere("end_date", ">=", date);
                })
                .select("main_price", "child_price", "baby_price")
                .first();
              
              packagePrice = price;
            }
          }
          // Departure points'leri getir
          const departurePoints = await knex("tour_departure_points")
            .where("tour_id", tour.id)
            .whereNull("tour_departure_points.deleted_at")
            .innerJoin("cities", "tour_departure_points.location_id", "cities.id")
            .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
            .where("city_pivots.language_code", language)
            .whereNull("city_pivots.deleted_at")
            .select("city_pivots.name")
            .orderBy("city_pivots.name", "asc");

          // Şehir isimlerini virgülle ayırarak birleştir
          const departurePointsText = departurePoints.map(point => point.name).join(", ");

          // İlk galeri resmini getir
          const firstGallery = await knex("tour_galleries")
            .where("tour_id", tour.id)
            .whereNull("deleted_at")
            .select("image_url")
            .orderBy("id", "asc")
            .first();

          return {
            ...tour,
            package_price: packagePrice,
            departure_points: departurePointsText || null,
            photo: firstGallery?.image_url || null
          };
        })
      );
              
      return res.status(200).send({
        success: true,
        message: "Tours fetched successfully",
        data: toursWithPrices,
        total: Number(total),
        totalPages,
        currentPage: page,
        limit,
      });

    } catch (error) {
      console.error("Tours error:", error);
      return res.status(500).send({
        success: false,
        message: "Tours fetch failed",
      });
    }
  }
}
