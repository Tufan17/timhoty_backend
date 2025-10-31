import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class TourController {
  async getApprovedTours(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { location_id } = req.query as { location_id?: string };

      // Get tours with pivot table data, filtering for admin approval and active status
      const tours = await knex("tours")
        .whereNull("tours.deleted_at")
        .where("tours.admin_approval", true) // Admin approved
        .where("tours.status", true) // Active status
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.whereIn("tours.id", function () {
              this.select("tour_id")
                .from("tour_locations")
                .where("location_id", location_id)
                .whereNull("deleted_at");
            });
          }
        })
        .select(
          "tours.id",
          "tours.night_count",
          "tours.day_count",
          "tours.user_count",
          "tours.status",
          "tours.admin_approval",
          "tours.comment_count",
          "tours.average_rating",
          "tours.refund_days",
          "tours.created_at",
          "tours.updated_at",
          "tour_pivots.title as name",
          "tour_pivots.general_info",
          "tour_pivots.tour_info",
          "tour_pivots.refund_policy"
        )
        .orderBy("tours.created_at", "desc");

      // Get tour locations for each tour
      if (tours.length > 0) {
        const tourIds = tours.map((tour: any) => tour.id);
        const tourLocations = await knex("tour_locations")
          .whereIn("tour_locations.tour_id", tourIds)
          .whereNull("tour_locations.deleted_at")
          .innerJoin("cities", "tour_locations.location_id", "cities.id")
          .innerJoin("city_pivots", function () {
            this.on("cities.id", "city_pivots.city_id").andOn(
              "city_pivots.language_code",
              knex.raw("?", [language])
            );
          })
          .whereNull("city_pivots.deleted_at")
          .innerJoin("country_pivots", function () {
            this.on("cities.country_id", "country_pivots.country_id").andOn(
              "country_pivots.language_code",
              knex.raw("?", [language])
            );
          })
          .whereNull("country_pivots.deleted_at")
          .select(
            "tour_locations.tour_id",
            "city_pivots.name as city_name",
            "country_pivots.name as country_name"
          );

        // Group locations by tour_id
        const locationsByTourId = tourLocations.reduce(
          (acc: Record<string, any[]>, location: any) => {
            if (!acc[location.tour_id]) {
              acc[location.tour_id] = [];
            }
            acc[location.tour_id].push({
              city_name: location.city_name,
              country_name: location.country_name,
            });
            return acc;
          },
          {} as Record<string, any[]>
        );

        // Add locations to tours
        tours.forEach((tour: any) => {
          tour.locations = locationsByTourId[tour.id] || [];
          tour.address = tour.locations.length > 0 
            ? `${tour.locations[0].country_name || ""}, ${tour.locations[0].city_name || ""}`.trim()
            : "";
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR.TOUR_FETCHED_SUCCESS"),
        data: tours,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR.TOUR_FETCHED_ERROR"),
      });
    }
  }

  async getTourById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { date,period } = req.query as {
        date: string;
        period:string;
      };
      const salesPartnerId = (req as any).user?.sales_partner_id;
console.log("salesPartnerId",salesPartnerId);

      // Get tour info first
      const tour = await knex("tours")
        .where("tours.id", id)
        .whereNull("tours.deleted_at")
        .select("tours.*")
        .first();

      if (!tour) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR.TOUR_NOT_FOUND"),
        });
      }

      // komisyonu getireceğiz bu satıcının bu tur için ayarladığı komisyonu
      // First, check that salesPartnerId is defined to prevent "undefined binding" errors.
      let commission = null;
      if (salesPartnerId) {
        commission = await knex("sales_partner_commissions")
          .where("sales_partner_commissions.sales_partner_id", salesPartnerId)
          .where("sales_partner_commissions.service_type", "tour")
          .where("sales_partner_commissions.service_id", id)
          .first();

          if(!commission){
            commission = await knex("sales_partner_commissions")
            .where("sales_partner_commissions.sales_partner_id", salesPartnerId)
            .where("sales_partner_commissions.service_type", "tour")
            .first();
          }
      }


      // Get tour packages with pivot table data for names
      const tourPackages = await knex("tour_packages")
        .where("tour_packages.tour_id", id)
        .whereNull("tour_packages.deleted_at")
        .innerJoin("tour_package_pivots", "tour_packages.id", "tour_package_pivots.tour_package_id")
        .where("tour_package_pivots.language_code", (req as any).language)
        .whereNull("tour_package_pivots.deleted_at")
        .select(
          "tour_packages.*",
          "tour_package_pivots.name as package_name",
          "tour_package_pivots.description as package_description",
          "tour_package_pivots.refund_policy as package_refund_policy"
        );

      // Get packages with their prices and images
      const packagesWithPrices = await Promise.all(
        tourPackages.map(async (pkg: any) => {
          // Paket resimlerini al
          const packageImages = await knex("tour_package_images")
            .where("tour_package_images.tour_package_id", pkg.id)
            .whereNull("tour_package_images.deleted_at")
            .select("tour_package_images.id", "tour_package_images.image_url")
            .orderBy("tour_package_images.created_at", "asc");

          let prices = [];
          let calculatedPrice = null;
          
          // Tüm fiyatları al
          let priceQuery = knex("tour_package_prices")
            .where("tour_package_prices.tour_package_id", pkg.id)
            .whereNull("tour_package_prices.deleted_at")
            .leftJoin(
              "currencies",
              "tour_package_prices.currency_id",
              "currencies.id"
            )
            .select(
              "tour_package_prices.id",
              "tour_package_prices.main_price",
              "tour_package_prices.child_price",
              "tour_package_prices.baby_price",
              "tour_package_prices.date",
              "tour_package_prices.period",
              "tour_package_prices.discount",
              "tour_package_prices.single",
              "tour_package_prices.total_tax_amount",
              "currencies.id as currency_id",
              "currencies.code as currency_code",
              "currencies.symbol as currency_symbol"
            );

          // Period parametresi varsa fiyatları filtrele
          if (period) {
            priceQuery = priceQuery.where("tour_package_prices.period", period);
          }

          prices = await priceQuery.orderBy("tour_package_prices.date", "asc");

          // Apply commission to prices if available and currency matches
          const applyCommissionToAmount = (amount: number): number => {
            if (!commission) return amount;
            const type = (commission as any)?.commission_type;
            const value = Number((commission as any)?.commission_value);
            if (!type || isNaN(value)) return amount;
            if (type === "percentage") {
              const adjusted = amount - (amount * value) / 100;
              return adjusted < 0 ? 0 : adjusted;
            }
            if (type === "fixed") {
              const adjusted = amount - value;
              return adjusted < 0 ? 0 : adjusted;
            }
            return amount;
          };

          if (commission && (commission as any)?.commission_currency) {
            const commissionCurrencyCode = String((commission as any).commission_currency).toUpperCase();
            prices = prices.map((p: any) => {
              // Only apply commission when currencies match
              const priceCurrencyCode = String(p.currency_code || "").toUpperCase();
              if (commissionCurrencyCode && priceCurrencyCode && priceCurrencyCode === commissionCurrencyCode) {
                return {
                  ...p,
                  main_price: applyCommissionToAmount(Number(p.main_price)),
                  child_price: applyCommissionToAmount(Number(p.child_price)),
                  baby_price: applyCommissionToAmount(Number(p.baby_price)),
                  single: applyCommissionToAmount(Number(p.single)),
                };
              }
              return p;
            });
          }
          return {
            ...pkg,
            prices: prices,
            images: packageImages,
          };
        })
      ); 

      // Null olan paketleri filtrele
      const filteredPackages = packagesWithPrices.filter(pkg => pkg !== null);

      return res.status(200).send({
        success: true,
        message: req.t("TOUR.TOUR_PACKAGE_FETCHED_SUCCESS"),
        data: filteredPackages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR.TOUR_FETCHED_ERROR"),
      });
    }
  }
}
