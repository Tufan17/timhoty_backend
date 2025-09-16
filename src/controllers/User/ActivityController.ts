import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import CarTypeModel from "@/models/CarTypeModel";
import GearTypeModel from "@/models/GearTypeModel";
import ActivityTypeModel from "@/models/ActivityTypeModel";

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
        min_price,
        max_price,
        type,
      } = req.query as any;

      const countQuery = knex("activities")
        .innerJoin(
          "activity_pivots",
          "activities.id",
          "activity_pivots.activity_id"
        )
        // .where("activities.status", true)
        // .where("activities.admin_approval", true)

        .whereNull("activities.deleted_at")
        .where("activity_pivots.language_code", language)
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("activities.location_id", location_id);
          }
          if (guest_rating) {
            queryBuilder.where("activities.average_rating", ">=", guest_rating);
          }
          if (type && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(type)) {
            queryBuilder.where("activities.activity_type_id", type);
          }
        })
        .groupBy("activities.id")
        .countDistinct("activities.id as total");

      let activities = await knex("activities")
        .whereNull("activities.deleted_at")
        // .where("activities.status", true)
        // .where("activities.admin_approval", true)
        .innerJoin("activity_pivots", function () {
          this.on("activities.id", "activity_pivots.activity_id").andOn(
            "activity_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .innerJoin("cities", "activities.location_id", "cities.id")
        .innerJoin("activities_type_pivots", function () {
          this.on(
            "activities.activity_type_id",
            "activities_type_pivots.activity_type_id"
          ).andOn(
            "activities_type_pivots.language_code",
            knex.raw("?", [language])
          );
        })
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
            queryBuilder.where("activities.location_id", location_id);
          }
          if (type && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(type)) {
            queryBuilder.where("activities.activity_type_id", type);
          }
        })
        .limit(limit)
        .offset((page - 1) * limit)
        .select(
          "activities.id",
          "activity_pivots.title",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name",
          "city_pivots.city_id as location_id",
          "country_pivots.country_id as country_id",
          "activities.activity_type_id",
          "activities.about_to_run_out",
          "activities.average_rating",
          "activities_type_pivots.name as activity_type_name",
          "activities.comment_count",
          "activities.duration",
          "activities.map_location",
          "activities.approval_period"
        );

      // Get all car_rental packages for all activity in one query
      const activityIds = activities.map((activity: any) => activity.id);

      // Get all car_rental packages for all activity in one query
      const allactivityPackages = await knex("activity_packages")
        .whereIn("activity_packages.activity_id", activityIds)
        .innerJoin(
          "activity_package_pivots",
          "activity_packages.id",
          "activity_package_pivots.activity_package_id"
        )
        .where("activity_package_pivots.language_code", language)
        .whereNull("activity_packages.deleted_at")
        .select(
          "activity_packages.id",
          "activity_packages.activity_id",
          "activity_package_pivots.name",
          "return_acceptance_period",
          "discount",
          "total_tax_amount",
          "constant_price"
        );

      // Group car_rental packages by activity_id
      const activityPackagesByactivityId = allactivityPackages.reduce(
        (acc: Record<string, any[]>, pkg: any) => {
          if (!acc[pkg.activity_id]) {
            acc[pkg.activity_id] = [];
          }
          acc[pkg.activity_id].push(pkg);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Assign car_rental packages to activity
      activities.forEach((activity: any) => {
        activity.activity_packages =
          activityPackagesByactivityId[activity.id] || [];
      });

      // Get all car_rental package prices in one query
      const allactivityPackageIds = allactivityPackages.map(
        (pkg: any) => pkg.id
      );
      const allactivityPackagePrices = await knex("activity_package_prices")
        .whereIn(
          "activity_package_prices.activity_package_id",
          allactivityPackageIds
        )
        .innerJoin(
          "currencies",
          "activity_package_prices.currency_id",
          "currencies.id"
        )
        .innerJoin(
          "currency_pivots",
          "currencies.id",
          "currency_pivots.currency_id"
        )
        .where("currency_pivots.language_code", language)
        .whereNull("activity_package_prices.deleted_at")
        .select(
          "activity_package_prices.id",
          "activity_package_prices.activity_package_id",
          "activity_package_prices.main_price",
          "activity_package_prices.child_price",
          "activity_package_prices.currency_id",
          "currency_pivots.name",
          "currencies.code",
          "currencies.symbol"
        );

      // Group prices by activity_package_id (only keep the first price for each package)
      const pricesByPackageId = allactivityPackagePrices.reduce(
        (acc: Record<string, any>, price: any) => {
          if (!acc[price.activity_package_id]) {
            acc[price.activity_package_id] = price;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Assign prices to car_rental packages
      activities.forEach((activity: any) => {
        if (activity.activity_packages) {
          // Assign prices to car_rental packages
          activity.activity_packages.forEach((activityPackage: any) => {
            activityPackage.activity_package_price =
              pricesByPackageId[activityPackage.id] || null;
          });

          // Find the car_rental package with the lowest main_price
          const cheapestPackage = activity.activity_packages.reduce(
            (lowest: any, current: any) => {
              const lowestPrice =
                lowest?.activity_package_price?.main_price ?? Infinity;
              const currentPrice =
                current?.activity_package_price?.main_price ?? Infinity;

              return currentPrice < lowestPrice ? current : lowest;
            },
            null
          );

          // Keep only the cheapest package
          activity.activity_packages = cheapestPackage ? cheapestPackage : null;

          let totalPrice = 0;
          // Note: baby_price column doesn't exist in activity_package_prices table

          if (activity.activity_packages && activity.activity_packages.activity_package_price) {
            totalPrice +=
              activity.activity_packages.activity_package_price.main_price * 1;
          }
          activity.total_price = totalPrice;
        }
      });

      if (min_price) {
        activities = activities.filter(
          (activity: any) => (activity.total_price || 0) >= min_price
        );
      }
      if (max_price) {
        activities = activities.filter(
          (activity: any) => (activity.total_price || 0) <= max_price
        );
      }

      if (arrangement === "price_increasing") {
        activities.sort(
          (a: any, b: any) => (a.total_price || 0) - (b.total_price || 0)
        );
      } else if (arrangement === "price_decreasing") {
        activities.sort(
          (a: any, b: any) => (b.total_price || 0) - (a.total_price || 0)
        );
      } else if (arrangement === "star_increasing") {
        activities.sort((a: any, b: any) => 0);
      } else if (arrangement === "star_decreasing") {
        activities.sort((a: any, b: any) => 0);
      } else if (arrangement === "rating_increasing") {
        activities.sort(
          (a: any, b: any) => a.average_rating - b.average_rating
        );
      } else if (arrangement === "rating_decreasing") {
        activities.sort(
          (a: any, b: any) => b.average_rating - a.average_rating
        );
      }

      const total = await countQuery.first();
      const totalPages = Math.ceil(total?.total ?? 0 / Number(limit));
      return res.status(200).send({
        success: true,
        message: "activities fetched successfully",
        data: activities,
        total: Number(total?.total),
        totalPages: totalPages,
      });
    } catch (error) {
      console.error("activities error:", error);
      return res.status(500).send({
        success: false,
        message: "activities fetch failed",
      });
    }
  }

  async activityTypes(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language ?? "en";
      const activityTypeModel = new ActivityTypeModel();
      const activityTypes = await activityTypeModel.getPivots(language);
      return res.status(200).send({
        success: true,
        message: "activity_types fetched successfully",
        data: activityTypes,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "activity_types fetch failed",
      });
    }
  }
}
