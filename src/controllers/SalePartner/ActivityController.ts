import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class ActivityController {
  async getApprovedActivities(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { location_id,activity_type_id } = req.query as { location_id?: string,activity_type_id?: string, };

      // Get activities with pivot table data, filtering for admin approval and active status
      const activities = await knex("activities")
        .whereNull("activities.deleted_at")
        .where("activities.admin_approval", true) // Admin approved
        .where("activities.status", true) // Active status
        .innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
        .innerJoin("cities", "activities.location_id", "cities.id")
        .innerJoin(
          "country_pivots",
          "cities.country_id",
          "country_pivots.country_id"
        )
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("activity_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .whereNull("cities.deleted_at")
        .whereNull("country_pivots.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("activity_pivots.deleted_at")
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("activities.location_id", location_id);
          }
          if (activity_type_id) {
            queryBuilder.where("activities.activity_type_id", activity_type_id);
          }
        })
        .select(
          "activities.id",
          "activities.location_id",
          "activities.duration",
          "activities.approval_period",
          "activities.average_rating",
          "activities.comment_count",
          "activities.status",
          "activities.admin_approval",
          "activities.highlight",
          "activities.created_at",
          "activities.updated_at",
          "activity_pivots.title",
          "activity_pivots.general_info",
          "activity_pivots.activity_info",
          "activity_pivots.refund_policy",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name"
        )
        .orderBy("activities.created_at", "desc");

      // Format the response with address information
      const formattedActivities = activities.map((activity: any) => ({
        ...activity,
        address: `${activity.country_name || ""}, ${activity.city_name || ""}`.trim(),
      }));

      return res.status(200).send({
        success: true,
        message: req.t("ACTIVITY.ACTIVITY_FETCHED_SUCCESS"),
        data: formattedActivities,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ACTIVITY.ACTIVITY_FETCHED_ERROR"),
      });
    }
  }

  async getActivityById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { date, adult, child, childAge, } = req.query as {
        date: string;
        adult: number;
        child: number;
        childAge: string; // "1,2,3,4" formatında gelecek
      };

      // childAge'i array'e çevir
      const childAges = childAge ? childAge.split(',').map(age => parseInt(age.trim())) : [];

      // Date validation - ensure date is in YYYY-MM-DD format if provided
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).send({
          success: false,
          message: req.t("ACTIVITY.INVALID_DATE_FORMAT"),
        });
      }

      // Get activity info first
      const activity = await knex("activities")
        .where("activities.id", id)
        .whereNull("activities.deleted_at")
        .select("activities.*")
        .first();

      if (!activity) {
        return res.status(404).send({
          success: false,
          message: req.t("ACTIVITY.ACTIVITY_NOT_FOUND"),
        });
      }

      // Get activity packages with pivot table data for names
      // Filter packages where the provided date is between start_date and end_date
      const activityPackages = await knex("activity_packages")
        .where("activity_packages.activity_id", id)
        .whereNull("activity_packages.deleted_at")
        .modify(function (queryBuilder) {
          if (date) {
            // Date is between start_date and end_date (inclusive)
            queryBuilder
              .where(function() {
                this.where(function() {
                  // Case 1: Both start_date and end_date are set
                  this.whereNotNull("activity_packages.start_date")
                      .whereNotNull("activity_packages.end_date")
                      .where("activity_packages.start_date", "<=", date)
                      .where("activity_packages.end_date", ">=", date);
                })
                .orWhere(function() {
                  // Case 2: Only start_date is set (no end date limit)
                  this.whereNotNull("activity_packages.start_date")
                      .whereNull("activity_packages.end_date")
                      .where("activity_packages.start_date", "<=", date);
                })
                .orWhere(function() {
                  // Case 3: Only end_date is set (no start date limit)
                  this.whereNull("activity_packages.start_date")
                      .whereNotNull("activity_packages.end_date")
                      .where("activity_packages.end_date", ">=", date);
                })
                .orWhere(function() {
                  // Case 4: Neither start_date nor end_date is set (always available)
                  this.whereNull("activity_packages.start_date")
                      .whereNull("activity_packages.end_date");
                });
              });
          }
        })
        .innerJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
        .where("activity_package_pivots.language_code", (req as any).language)
        .whereNull("activity_package_pivots.deleted_at")
        .select(
          "activity_packages.*",
          "activity_package_pivots.name as package_name",
          "activity_package_pivots.description as package_description",
          "activity_package_pivots.refund_policy as package_refund_policy"
        );

      // Get hours and prices for each package separately
      const packagesWithHours = await Promise.all(
        activityPackages.map(async (pkg: any) => {
          // Get hours for this package
          const hoursData = await knex("activity_package_hours")
            .where("activity_package_hours.activity_package_id", pkg.id)
            .whereNull("activity_package_hours.deleted_at")
            .select("activity_package_hours.*")
            .orderBy("activity_package_hours.hour", "asc");

          // Get prices for this package - first try with date filter if date is provided
          let pricesData = await knex("activity_package_prices")
            .where("activity_package_prices.activity_package_id", pkg.id)
            .whereNull("activity_package_prices.deleted_at")
            .innerJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
            .modify(function (queryBuilder) {
              if (date) {
                // Filter prices by date if provided
                queryBuilder.where(function() {
                  this.where(function() {
                    // Case 1: Both start_date and end_date are set
                    this.whereNotNull("activity_package_prices.start_date")
                        .whereNotNull("activity_package_prices.end_date")
                        .where("activity_package_prices.start_date", "<=", date)
                        .where("activity_package_prices.end_date", ">=", date);
                  })
                  .orWhere(function() {
                    // Case 2: Only start_date is set (no end date limit)
                    this.whereNotNull("activity_package_prices.start_date")
                        .whereNull("activity_package_prices.end_date")
                        .where("activity_package_prices.start_date", "<=", date);
                  })
                  .orWhere(function() {
                    // Case 3: Only end_date is set (no start date limit)
                    this.whereNull("activity_package_prices.start_date")
                        .whereNotNull("activity_package_prices.end_date")
                        .where("activity_package_prices.end_date", ">=", date);
                  }) 
                  .orWhere(function() {
                    // Case 4: Neither start_date nor end_date is set (always available)
                    this.whereNull("activity_package_prices.start_date")
                        .whereNull("activity_package_prices.end_date");
                  });
                });
              }
            })
            .select(
              "activity_package_prices.*",
              "currencies.code as currency_code",
              "currencies.symbol as currency_symbol"
            );

          // If no prices found with date filter, try without date filter
          if (pricesData.length === 0 && date) {
            pricesData = await knex("activity_package_prices")
              .where("activity_package_prices.activity_package_id", pkg.id)
              .whereNull("activity_package_prices.deleted_at")
              .innerJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
              .select(
                "activity_package_prices.*",
                "currencies.code as currency_code",
                "currencies.symbol as currency_symbol"
              );
          }

          // Combine hours with prices data
          const hoursWithPrices = hoursData.map(hour => {
            // Find matching price for this hour (use first available price)
            const priceData = pricesData[0] || null;
            return {
              ...hour,
              price: priceData?.main_price || 0,
              child_price: priceData?.child_price || 0,
              currency_code: priceData?.currency_code || "USD",
              currency_symbol: priceData?.currency_symbol || "$"
            };
          });

          // Aktivite resimlerini al
          const activityImages = await knex("activity_galleries")
            .where("activity_galleries.activity_id", id)
            .whereNull("activity_galleries.deleted_at")
            .select("activity_galleries.id", "activity_galleries.image_url")
            .orderBy("activity_galleries.created_at", "asc");

          let pkg_info = null;

          if (hoursWithPrices && hoursWithPrices.length > 0) {
            // Aktivite için saat bazlı fiyat hesaplama
            let calculatedPrice = null;
            
            // İlk saati al (veya seçilen saate göre filtrele)
            const selectedHour = hoursWithPrices[0]; // Varsayılan olarak ilk saat
            
            if (selectedHour) {
              calculatedPrice = ActivityController.calculatePrice(selectedHour, pkg, adult, child, childAges, date);
            }

            // Eğer hesaplanan fiyat yoksa bu paketi gösterme
            if (!calculatedPrice) {
              return null;
            }

            pkg_info = {
              id: pkg.id,
              activity_id: pkg.activity_id,
              discount: pkg.discount,
              total_tax_amount: pkg.total_tax_amount,
              return_acceptance_period: pkg.return_acceptance_period,
              created_at: pkg.created_at,
              updated_at: pkg.updated_at,
              hours: hoursWithPrices,
              calculated_price: calculatedPrice,
            };
          }

          return {
            ...pkg,
            pkg_info: pkg_info,
            images: activityImages,
          };
        })
      ); 

      // Null olan paketleri filtrele
      const filteredPackages = packagesWithHours.filter(pkg => pkg !== null && pkg.pkg_info !== null);

      return res.status(200).send({
        success: true,
        message: req.t("ACTIVITY.ACTIVITY_PACKAGE_FETCHED_SUCCESS"),
        data: filteredPackages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ACTIVITY.ACTIVITY_FETCHED_ERROR"),
      });
    }
  }

  private static calculatePrice(hourData: any, pkgData: any, adult: number, child: number, childAges: number[], date?: string) {
    if (!hourData) return null;
 
    const mainPrice = parseFloat(hourData.price) || 0;
    const childPrice = parseFloat(hourData.child_price) || 0;
    const discount = parseFloat(pkgData.discount) || 0;
    const totalTaxAmount = parseFloat(pkgData.total_tax_amount) || 0;

    // Aktivite için gün sayısı 1 (tek günlük aktivite)
    const days = 1;

    // Yetişkin fiyatı hesapla
    const adultTotal = mainPrice * adult * days;
    
    // Çocuk fiyatı hesapla - her çocuk için ayrı ayrı
    let childTotal = 0;
    let freeChildren = 0;
    let paidChildren = 0;
    
    if (child > 0 && childAges.length > 0) {
      for (let i = 0; i < childAges.length && i < child; i++) {
        const childAge = childAges[i];
        
        if (childAge < 6) {
          // 6 yaş altı ücretsiz
          freeChildren++;
        } else if (childAge < 18) {
          // 18 yaş altı çocuk fiyatı
          childTotal += childPrice * days;
          paidChildren++;
        } else {
          // 18 yaş üstü yetişkin fiyatı
          childTotal += mainPrice * days;
          paidChildren++;
        }
      }
    }
    
    // Toplam fiyat
    const subtotal = adultTotal + childTotal;
    
    // İndirim hesapla
    const discountAmount = (subtotal * discount) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    
    // Vergi hesapla
    const taxAmount = (discountedSubtotal * totalTaxAmount) / 100;
    
    // Final fiyat
    const finalPrice = discountedSubtotal + taxAmount;

    return {
      currency_code: hourData.currency_code || "USD",
      currency_symbol: hourData.currency_symbol || "$",
      main_price: mainPrice,
      child_price: childPrice,
      days: days,
      adult_count: adult,
      child_count: child,
      child_ages: childAges,
      free_children: freeChildren,
      paid_children: paidChildren,
      free_age_limit: 6, // Aktivite için 6 yaş altı ücretsiz
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
        subtotal: subtotal,
        discount_amount: discountAmount,
        discounted_subtotal: discountedSubtotal,
        tax_amount: taxAmount,
        final_price: finalPrice
      }
    };
  }
}
