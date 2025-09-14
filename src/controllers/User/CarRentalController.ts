import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class car_rentalController {
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
        baby,
        adult,
        child,
      } = req.query as any;

      const countQuery = knex("car_rentals")
        .innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
        // .where("car_rentals.status", true)
        // .where("car_rentals.admin_approval", true)

        .whereNull("car_rentals.deleted_at")
        .where("car_rental_pivots.language_code", language)
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("car_rentals.location_id", location_id);
          }
          if (guest_rating) {
            queryBuilder.where("car_rentals.average_rating", ">=", guest_rating);
          }
        })
        .groupBy("car_rentals.id")
        .countDistinct("car_rentals.id as total");

      let car_rentals = await knex("car_rentals")
        .whereNull("car_rentals.deleted_at")
        // .where("car_rentals.status", true)
        // .where("car_rentals.admin_approval", true)
        .innerJoin("car_rental_pivots", function () {
          this.on("car_rentals.id", "car_rental_pivots.car_rental_id").andOn(
            "car_rental_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .innerJoin("cities", "car_rentals.location_id", "cities.id")
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
            queryBuilder.where("car_rentals.location_id", location_id);
          }
          
        })
        .limit(limit)
        .offset((page - 1) * limit)
        .select(
          "car_rentals.id",
          "car_rental_pivots.title",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name",
          "city_pivots.city_id as location_id",
          "country_pivots.country_id as country_id",
          "car_rentals.average_rating",
          "car_rentals.comment_count",
          "car_rentals.refund_days"
        );

      // Get all car_rental packages for all car_rentals in one query
      const car_rentalIds = car_rentals.map((car_rental: any) => car_rental.id);

      // Get all car_rental packages for all car_rentals in one query
      const allcar_rentalPackages = await knex("car_rental_packages")
        .whereIn("car_rental_packages.car_rental_id", car_rentalIds)
        .innerJoin(
          "car_rental_package_pivots",
          "car_rental_packages.id",
          "car_rental_package_pivots.car_rental_package_id"
        )
        .where("car_rental_package_pivots.language_code", language)
        .whereNull("car_rental_packages.deleted_at")
        .select(
          "car_rental_packages.id",
          "car_rental_packages.car_rental_id",
          "car_rental_package_pivots.name",
          "return_acceptance_period",
          "discount",
          "total_tax_amount",
          "constant_price"
        );

      // Group car_rental packages by car_rental_id
      const car_rentalPackagesBycar_rentalId = allcar_rentalPackages.reduce(
        (acc: Record<string, any[]>, pkg: any) => {
          if (!acc[pkg.car_rental_id]) {
            acc[pkg.car_rental_id] = [];
          }
          acc[pkg.car_rental_id].push(pkg);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Assign car_rental packages to car_rentals
      car_rentals.forEach((car_rental: any) => {
        car_rental.car_rental_packages = car_rentalPackagesBycar_rentalId[car_rental.id] || [];
      });

      // Get all car_rental package prices in one query
      const allcar_rentalPackageIds = allcar_rentalPackages.map((pkg: any) => pkg.id);
      const allcar_rentalPackagePrices = await knex("car_rental_package_prices")
        .whereIn("car_rental_package_prices.car_rental_package_id", allcar_rentalPackageIds)
        .innerJoin(
          "currencies",
          "car_rental_package_prices.currency_id",
          "currencies.id"
        )
        .innerJoin(
          "currency_pivots",
          "currencies.id",
          "currency_pivots.currency_id"
        )
        .where("currency_pivots.language_code", language)
        .whereNull("car_rental_package_prices.deleted_at")
        .select(
          "car_rental_package_prices.id",
          "car_rental_package_prices.car_rental_package_id",
          "car_rental_package_prices.main_price",
          "car_rental_package_prices.child_price",
          "car_rental_package_prices.currency_id",
          "currency_pivots.name",
          "currencies.code",
          "currencies.symbol"
        );

      // Group prices by car_rental_package_id (only keep the first price for each package)
      const pricesByPackageId = allcar_rentalPackagePrices.reduce(
        (acc: Record<string, any>, price: any) => {
          if (!acc[price.car_rental_package_id]) {
            acc[price.car_rental_package_id] = price;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Assign prices to car_rental packages
      car_rentals.forEach((car_rental: any) => {
        if (car_rental.car_rental_packages) {
          // Assign prices to car_rental packages
          car_rental.car_rental_packages.forEach((car_rentalPackage: any) => {
            car_rentalPackage.car_rental_package_price =
              pricesByPackageId[car_rentalPackage.id] || null;
          });

          // Find the car_rental package with the lowest main_price
          const cheapestPackage = car_rental.car_rental_packages.reduce(
            (lowest: any, current: any) => {
              const lowestPrice =
                lowest?.car_rental_package_price?.main_price ?? Infinity;
              const currentPrice =
                current?.car_rental_package_price?.main_price ?? Infinity;

              return currentPrice < lowestPrice ? current : lowest;
            },
            null
          );

          // Keep only the cheapest package
          car_rental.car_rental_packages = cheapestPackage ? cheapestPackage : null;

          let totalPrice = 0;
          // Note: baby_price column doesn't exist in car_rental_package_prices table
          
          if (car_rental.car_rental_packages && car_rental.car_rental_packages.car_rental_package_price) {
            if (adult && car_rental.car_rental_packages.car_rental_package_price.main_price) {
              totalPrice +=
                car_rental.car_rental_packages.car_rental_package_price.main_price * adult;
            }
            if (child && car_rental.car_rental_packages.car_rental_package_price.child_price) {
              totalPrice +=
                car_rental.car_rental_packages.car_rental_package_price.child_price * child;
            }
            if (
              !adult &&
              !child &&
              car_rental.car_rental_packages.car_rental_package_price.main_price
            ) {
              totalPrice += car_rental.car_rental_packages.car_rental_package_price.main_price * 1;
            }
          }
          car_rental.total_price = totalPrice;
        }
      });

      if(isAvailable) {
        car_rentals = car_rentals.filter((car_rental: any) => 
          car_rental.car_rental_packages && 
          car_rental.car_rental_packages.car_rental_package_price && 
          car_rental.car_rental_packages.car_rental_package_price.main_price > 0
        );
      }

      if(min_price) {
        car_rentals = car_rentals.filter((car_rental: any) => (car_rental.total_price || 0) >= min_price);
      }
      if(max_price) {
        car_rentals = car_rentals.filter((car_rental: any) => (car_rental.total_price || 0) <= max_price);
      }
      
      if(arrangement === "price_increasing") {
        car_rentals.sort((a: any, b: any) => (a.total_price || 0) - (b.total_price || 0));
      } else if(arrangement === "price_decreasing") {
        car_rentals.sort((a: any, b: any) => (b.total_price || 0) - (a.total_price || 0));
      } else if(arrangement === "star_increasing") {
        car_rentals.sort((a: any, b: any) => 0);
      } else if(arrangement === "star_decreasing") {
        car_rentals.sort((a: any, b: any) => 0);
      } else if(arrangement === "rating_increasing") {
        car_rentals.sort((a: any, b: any) => a.average_rating - b.average_rating);
      } else if(arrangement === "rating_decreasing") {
        car_rentals.sort((a: any, b: any) => b.average_rating - a.average_rating);
      }
    


      const total = await countQuery.first();
      const totalPages = Math.ceil(total?.total ?? 0 / Number(limit));
      return res.status(200).send({
        success: true,
        message: "car_rentals fetched successfully",
        data: car_rentals,
        total: total?.total,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error("car_rentals error:", error);
      return res.status(500).send({
        success: false,
        message: "car_rentals fetch failed",
      });
    }
  }
}
