import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class VisaController {
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

      const countQuery = knex("visas")
        .innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
        // .where("visas.status", true)
        // .where("visas.admin_approval", true)

        .whereNull("visas.deleted_at")
        .where("visa_pivots.language_code", language)
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("visas.location_id", location_id);
          }
          if (guest_rating) {
            queryBuilder.where("visas.average_rating", ">=", guest_rating);
          }
        })
        .groupBy("visas.id")
        .countDistinct("visas.id as total");

      let visas = await knex("visas")
        .whereNull("visas.deleted_at")
        // .where("visas.status", true)
        // .where("visas.admin_approval", true)
        .innerJoin("visa_pivots", function () {
          this.on("visas.id", "visa_pivots.visa_id").andOn(
            "visa_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .innerJoin("cities", "visas.location_id", "cities.id")
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
            queryBuilder.where("visas.location_id", location_id);
          }
          
        })
        .limit(limit)
        .offset((page - 1) * limit)
        .select(
          "visas.id",
          "visa_pivots.title",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name",
          "city_pivots.city_id as location_id",
          "country_pivots.country_id as country_id",
          "visas.average_rating",
          "visas.comment_count",
          "visas.refund_days"
        );

      // Get all visa packages for all visas in one query
      const visaIds = visas.map((visa: any) => visa.id);

      // Get all visa packages for all visas in one query
      const allvisaPackages = await knex("visa_packages")
        .whereIn("visa_packages.visa_id", visaIds)
        .innerJoin(
          "visa_package_pivots",
          "visa_packages.id",
          "visa_package_pivots.visa_package_id"
        )
        .where("visa_package_pivots.language_code", language)
        .whereNull("visa_packages.deleted_at")
        .select(
          "visa_packages.id",
          "visa_packages.visa_id",
          "visa_package_pivots.name",
          "return_acceptance_period",
          "discount",
          "total_tax_amount",
          "constant_price"
        );

      // Group visa packages by visa_id
      const visaPackagesByvisaId = allvisaPackages.reduce(
        (acc: Record<string, any[]>, pkg: any) => {
          if (!acc[pkg.visa_id]) {
            acc[pkg.visa_id] = [];
          }
          acc[pkg.visa_id].push(pkg);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Assign visa packages to visas
      visas.forEach((visa: any) => {
        visa.visa_packages = visaPackagesByvisaId[visa.id] || [];
      });

      // Get all visa package prices in one query
      const allvisaPackageIds = allvisaPackages.map((pkg: any) => pkg.id);
      const allvisaPackagePrices = await knex("visa_package_prices")
        .whereIn("visa_package_prices.visa_package_id", allvisaPackageIds)
        .innerJoin(
          "currencies",
          "visa_package_prices.currency_id",
          "currencies.id"
        )
        .innerJoin(
          "currency_pivots",
          "currencies.id",
          "currency_pivots.currency_id"
        )
        .where("currency_pivots.language_code", language)
        .whereNull("visa_package_prices.deleted_at")
        .select(
          "visa_package_prices.id",
          "visa_package_prices.visa_package_id",
          "visa_package_prices.main_price",
          "visa_package_prices.child_price",
          "visa_package_prices.currency_id",
          "currency_pivots.name",
          "currencies.code",
          "currencies.symbol"
        );

      // Group prices by visa_package_id (only keep the first price for each package)
      const pricesByPackageId = allvisaPackagePrices.reduce(
        (acc: Record<string, any>, price: any) => {
          if (!acc[price.visa_package_id]) {
            acc[price.visa_package_id] = price;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Assign prices to visa packages
      visas.forEach((visa: any) => {
        if (visa.visa_packages) {
          // Assign prices to visa packages
          visa.visa_packages.forEach((visaPackage: any) => {
            visaPackage.visa_package_price =
              pricesByPackageId[visaPackage.id] || null;
          });

          // Find the visa package with the lowest main_price
          const cheapestPackage = visa.visa_packages.reduce(
            (lowest: any, current: any) => {
              const lowestPrice =
                lowest?.visa_package_price?.main_price ?? Infinity;
              const currentPrice =
                current?.visa_package_price?.main_price ?? Infinity;

              return currentPrice < lowestPrice ? current : lowest;
            },
            null
          );

          // Keep only the cheapest package
          visa.visa_packages = cheapestPackage ? cheapestPackage : null;

          let totalPrice = 0;
          // Note: baby_price column doesn't exist in visa_package_prices table
          
          if (visa.visa_packages && visa.visa_packages.visa_package_price) {
            if (adult && visa.visa_packages.visa_package_price.main_price) {
              totalPrice +=
                visa.visa_packages.visa_package_price.main_price * adult;
            }
            if (child && visa.visa_packages.visa_package_price.child_price) {
              totalPrice +=
                visa.visa_packages.visa_package_price.child_price * child;
            }
            if (
              !adult &&
              !child &&
              visa.visa_packages.visa_package_price.main_price
            ) {
              totalPrice += visa.visa_packages.visa_package_price.main_price * 1;
            }
          }
          visa.total_price = totalPrice;
        }
      });

      if(isAvailable) {
        visas = visas.filter((visa: any) => 
          visa.visa_packages && 
          visa.visa_packages.visa_package_price && 
          visa.visa_packages.visa_package_price.main_price > 0
        );
      }

      if(min_price) {
        visas = visas.filter((visa: any) => (visa.total_price || 0) >= min_price);
      }
      if(max_price) {
        visas = visas.filter((visa: any) => (visa.total_price || 0) <= max_price);
      }
      
      if(arrangement === "price_increasing") {
        visas.sort((a: any, b: any) => (a.total_price || 0) - (b.total_price || 0));
      } else if(arrangement === "price_decreasing") {
        visas.sort((a: any, b: any) => (b.total_price || 0) - (a.total_price || 0));
      } else if(arrangement === "star_increasing") {
        visas.sort((a: any, b: any) => 0);
      } else if(arrangement === "star_decreasing") {
        visas.sort((a: any, b: any) => 0);
      } else if(arrangement === "rating_increasing") {
        visas.sort((a: any, b: any) => a.average_rating - b.average_rating);
      } else if(arrangement === "rating_decreasing") {
        visas.sort((a: any, b: any) => b.average_rating - a.average_rating);
      }
    


      const total = await countQuery.first();
      const totalPages = Math.ceil(total?.total ?? 0 / Number(limit));
      return res.status(200).send({
        success: true,
        message: "visas fetched successfully",
        data: visas,
        total: total?.total,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error("visas error:", error);
      return res.status(500).send({
        success: false,
        message: "visas fetch failed",
      });
    }
  }
}
