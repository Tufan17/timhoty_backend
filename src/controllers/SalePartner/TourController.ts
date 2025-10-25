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
              "currencies.code as currency_code",
              "currencies.symbol as currency_symbol"
            );

          // Period parametresi varsa fiyatları filtrele
          if (period) {
            priceQuery = priceQuery.where("tour_package_prices.period", period);
          }

          prices = await priceQuery.orderBy("tour_package_prices.date", "asc");
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

  private static calculatePrice(priceData: any, packageData: any, adult: number, child: number, childAges: number[]) {
    if (!priceData) return null;
 
    const mainPrice = parseFloat(priceData.main_price) || 0;
    const childPrice = parseFloat(priceData.child_price) || 0;
    const babyPrice = parseFloat(priceData.baby_price) || 0;
    const discount = parseFloat(priceData.discount) || 0;
    const totalTaxAmount = parseFloat(priceData.total_tax_amount) || 0;

    // Yetişkin fiyatı hesapla
    const adultTotal = mainPrice * adult;
    
    // Çocuk fiyatı hesapla - her çocuk için ayrı ayrı
    let childTotal = 0;
    let babyTotal = 0;
    let paidChildren = 0;
    let paidBabies = 0;
    
    if (child > 0 && childAges.length > 0) {
      for (let i = 0; i < childAges.length && i < child; i++) {
        const childAge = childAges[i];
        
        if (childAge < 2) {
          // 2 yaş altı bebek fiyatı
          babyTotal += babyPrice;
          paidBabies++;
        } else if (childAge < 12) {
          // 12 yaş altı çocuk fiyatı
          childTotal += childPrice;
          paidChildren++;
        } else {
          // 12 yaş üstü yetişkin fiyatı
          childTotal += mainPrice;
          paidChildren++;
        }
      }
    }
    
    // Toplam fiyat
    const subtotal = adultTotal + childTotal + babyTotal;
    
    // İndirim hesapla
    const discountAmount = (subtotal * discount) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    
    // Vergi hesapla
    const taxAmount = (discountedSubtotal * totalTaxAmount) / 100;
    
    // Final fiyat
    const finalPrice = discountedSubtotal;

    return {
      currency_code: priceData.currency_code,
      currency_symbol: priceData.currency_symbol,
      main_price: mainPrice,
      child_price: childPrice,
      baby_price: babyPrice,
      adult_count: adult,
      child_count: child,
      child_ages: childAges,
      paid_children: paidChildren,
      paid_babies: paidBabies,
      subtotal: subtotal,
      discount_percentage: discount,
      discount_amount: discountAmount,
      discounted_subtotal: discountedSubtotal,
      tax_percentage: totalTaxAmount,
      tax_amount: taxAmount,
      final_price: finalPrice,
      price_breakdown: {
        adult_total: adultTotal,
        child_total: childTotal,
        baby_total: babyTotal,
        subtotal: subtotal,
        discount_amount: discountAmount,
        discounted_subtotal: discountedSubtotal,
        tax_amount: taxAmount,
        final_price: finalPrice
      }
    };
  }
}
