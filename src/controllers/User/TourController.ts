import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class TourController {
  async index(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;

      const {
        location_id,
        page = 1,
        limit = 5,
        guest_rating,
        arrangement,
        isAvailable,
        min_price,
        max_price,
        period,
        departure_point_id,
      } = req.query as any;

      const countQuery = knex("tours")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        // .where("tours.status", true)
        // .where("tours.admin_approval", true)

        .whereNull("tours.deleted_at")
        .where("tour_pivots.language_code", language)
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("tours.location_id", location_id);
          }
          if (guest_rating) {
            queryBuilder.where("tours.average_rating", ">=", guest_rating);
          }
        })
        .groupBy("tours.id")
        .countDistinct("tours.id as total");

      let tours = await knex("tours")
        .whereNull("tours.deleted_at")
        // .where("tours.status", true)
        // .where("tours.admin_approval", true)
        .innerJoin("tour_pivots", function () {
          this.on("tours.id", "tour_pivots.tour_id").andOn(
            "tour_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .innerJoin("cities", "tours.location_id", "cities.id")
        .innerJoin("country_pivots", function () {
          this.on("cities.country_id", "country_pivots.country_id").andOn(
            "country_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .innerJoin("city_pivots", function () {
          this.on("cities.id", "city_pivots.city_id").andOn(
            "city_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("tours.location_id", location_id);
          }
          if (guest_rating) {
            queryBuilder.where("tours.average_rating", ">=", guest_rating);
          }
        })
        .leftJoin(
          // Join only the first image per tour using lateral join
          knex.raw(
            `LATERAL (
              SELECT image_url
              FROM tour_galleries
              WHERE tour_galleries.tour_id = tours.id
              AND tour_galleries.deleted_at IS NULL
              ORDER BY tour_galleries.created_at ASC
              LIMIT 1
            ) AS tour_gallery ON true`
          )
        )
        .limit(limit)
        .offset((page - 1) * limit)
        .select(
          "tours.id",
          "tour_pivots.title",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name",
          "city_pivots.city_id as location_id",
          "country_pivots.country_id as country_id",
          "tours.average_rating",
          "tours.comment_count",
          "tours.refund_days",
          "tours.night_count",
          "tours.day_count",
          "tours.user_count",
          "tour_gallery.image_url"
        );

      // Get all tour departure points for all tours in one query
      const tourIds = tours.map((tour: any) => tour.id);
      const allTourDeparturePoints = await knex("tour_departure_points")
        .whereIn("tour_departure_points.tour_id", tourIds)
        .innerJoin("cities", "tour_departure_points.location_id", "cities.id")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("city_pivots.language_code", language)
        .whereNull("city_pivots.deleted_at")
        .innerJoin(
          "country_pivots",
          "cities.country_id",
          "country_pivots.country_id"
        )
        .where("country_pivots.language_code", language)
        .whereNull("country_pivots.deleted_at")
        .whereNull("tour_departure_points.deleted_at")
       
        .modify(function (queryBuilder) {
          if (departure_point_id) {
            queryBuilder.where(
              "tour_departure_points.location_id",
              departure_point_id
            );
          }
        })
        .select(
          "tour_departure_points.id",
          "tour_departure_points.location_id",
          "tour_departure_points.tour_id",
          "country_pivots.country_id as country_id",
          "city_pivots.name as city_name",
          "country_pivots.name as country_name"
        );

      // Group departure points by tour_id
      const departurePointsByTourId = allTourDeparturePoints.reduce(
        (acc: Record<string, any[]>, point: any) => {
          if (!acc[point.tour_id]) {
            acc[point.tour_id] = [];
          }
          acc[point.tour_id].push(point);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Assign departure points to tours
      tours.forEach((tour: any) => {
        tour.tour_departure_points = departurePointsByTourId[tour.id] || [];
      });

      // Get all tour packages for all tours in one query
      const allTourPackages = await knex("tour_packages")
        .whereIn("tour_packages.tour_id", tourIds)
        .innerJoin(
          "tour_package_pivots",
          "tour_packages.id",
          "tour_package_pivots.tour_package_id"
        )
        .where("tour_package_pivots.language_code", language)
        .whereNull("tour_packages.deleted_at")
        .select(
          "tour_packages.id",
          "tour_packages.tour_id",
          "tour_package_pivots.name",
          "return_acceptance_period",
          "discount",
          "total_tax_amount",
          "constant_price",
          "date"
        );

      // Group tour packages by tour_id
      const tourPackagesByTourId = allTourPackages.reduce(
        (acc: Record<string, any[]>, pkg: any) => {
          if (!acc[pkg.tour_id]) {
            acc[pkg.tour_id] = [];
          }
          acc[pkg.tour_id].push(pkg);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Assign tour packages to tours
      tours.forEach((tour: any) => {
        tour.tour_packages = tourPackagesByTourId[tour.id] || [];
      });

      // Get all tour package prices in one query
      const allTourPackageIds = allTourPackages.map((pkg: any) => pkg.id);
      const allTourPackagePrices = await knex("tour_package_prices")
        .whereIn("tour_package_prices.tour_package_id", allTourPackageIds)
        .innerJoin(
          "currencies",
          "tour_package_prices.currency_id",
          "currencies.id"
        )
        .innerJoin(
          "currency_pivots",
          "currencies.id",
          "currency_pivots.currency_id"
        )
        .modify(function (queryBuilder) {
          if (period) {
            queryBuilder.where("tour_package_prices.period", period);
          }
        })
        .where("currency_pivots.language_code", language)
        .whereNull("tour_package_prices.deleted_at")
        .select(
          "tour_package_prices.id",
          "tour_package_prices.tour_package_id",
          "tour_package_prices.main_price",
          "tour_package_prices.child_price",
          "tour_package_prices.baby_price",
          "tour_package_prices.currency_id",
          "currency_pivots.name",
          "currencies.code",
          "currencies.symbol",
          "tour_package_prices.period"
        );

      // Group prices by tour_package_id (only keep the first price for each package)
      const pricesByPackageId = allTourPackagePrices.reduce(
        (acc: Record<string, any>, price: any) => {
          if (!acc[price.tour_package_id]) {
            acc[price.tour_package_id] = price;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Assign prices to tour packages
      tours.forEach((tour: any) => {
        if (tour.tour_packages) {
          // Assign prices to tour packages
          tour.tour_packages.forEach((tourPackage: any) => {
            tourPackage.tour_package_price =
              pricesByPackageId[tourPackage.id] || null;
          });

          // Find the tour package with the lowest main_price
          const cheapestPackage = tour.tour_packages.reduce(
            (lowest: any, current: any) => {
              const lowestPrice =
                lowest?.tour_package_price?.main_price ?? Infinity;
              const currentPrice =
                current?.tour_package_price?.main_price ?? Infinity;

              return currentPrice < lowestPrice ? current : lowest;
            },
            null
          );

          // Keep only the cheapest package
          tour.tour_packages = cheapestPackage ? cheapestPackage : null;

          let totalPrice = tour?.tour_packages?.tour_package_price?.main_price * 1;
          tour.total_price = totalPrice;
        }
      });

      if(isAvailable) {
        tours = tours.filter((tour: any) => tour.tour_packages.tour_package_price.main_price > 0);
      }

      if(min_price) {
        tours = tours.filter((tour: any) => tour.total_price >= min_price);
      }
      if(max_price) {
        tours = tours.filter((tour: any) => tour.total_price <= max_price);
      }
      
      if(arrangement === "price_increasing") {
        tours.sort((a: any, b: any) => a.total_price - b.total_price);
      } else if(arrangement === "price_decreasing") {
        tours.sort((a: any, b: any) => b.total_price - a.total_price);
      } else if(arrangement === "star_increasing") {
        tours.sort((a: any, b: any) => a.star_rating - b.star_rating);
      } else if(arrangement === "star_decreasing") {
        tours.sort((a: any, b: any) => b.star_rating - a.star_rating);
      } else if(arrangement === "rating_increasing") {
        tours.sort((a: any, b: any) => a.average_rating - b.average_rating);
      } else if(arrangement === "rating_decreasing") {
        tours.sort((a: any, b: any) => b.average_rating - a.average_rating);
      }
    


      const total = await countQuery.first();
      const totalPages = Math.ceil(total?.total ?? 0 / Number(limit));
      return res.status(200).send({
        success: true,
        message: "Tours fetched successfully",
        data: tours,
        total: total?.total,
        totalPages: totalPages,
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
