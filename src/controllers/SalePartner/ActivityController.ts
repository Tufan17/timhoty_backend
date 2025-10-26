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
      const { date, adult, child } = req.query as { 
        date?: string; 
        adult?: number; 
        child?: number;
      };
      const language = (req as any).language;

      // Get activity info with all related data in a single query
      const results = await knex("activities")
        .where("activities.id", id)
        .whereNull("activities.deleted_at")
        .where("activities.status", true)
        .where("activities.admin_approval", true)

        // Activity bilgileri
        .innerJoin("activity_pivots", function () {
          this.on("activities.id", "activity_pivots.activity_id").andOn("activity_pivots.language_code", knex.raw("?", [language]));
        })
        .whereNull("activity_pivots.deleted_at")

        // Activity Type bilgileri
        .leftJoin("activities_type_pivots", function () {
          this.on("activities.activity_type_id", "activities_type_pivots.activity_type_id").andOn("activities_type_pivots.language_code", knex.raw("?", [language]));
        })

        // Şehir ve ülke bilgileri
        .innerJoin("cities", "activities.location_id", "cities.id")
        .innerJoin("country_pivots", function () {
          this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]));
        })
        .whereNull("country_pivots.deleted_at")
        .innerJoin("city_pivots", function () {
          this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]));
        })
        .whereNull("city_pivots.deleted_at")

        // Gallery bilgileri
        .leftJoin("activity_galleries", "activities.id", "activity_galleries.activity_id")
        .leftJoin("activity_gallery_pivots", function () {
          this.on("activity_galleries.id", "activity_gallery_pivots.activity_gallery_id")
            .andOn("activity_gallery_pivots.language_code", knex.raw("?", [language]))
            .andOnNull("activity_galleries.deleted_at")
            .andOnNull("activity_gallery_pivots.deleted_at");
        })

        // Activity özellikleri
        .leftJoin("activity_features", "activities.id", "activity_features.activity_id")
        .leftJoin("activity_feature_pivots", function () {
          this.on("activity_features.id", "activity_feature_pivots.activity_feature_id")
            .andOn("activity_feature_pivots.language_code", knex.raw("?", [language]))
            .andOnNull("activity_features.deleted_at")
            .andOnNull("activity_feature_pivots.deleted_at");
        })

        // Paket bilgileri
        .leftJoin("activity_packages", "activities.id", "activity_packages.activity_id")
        .leftJoin("activity_package_pivots", function () {
          this.on("activity_packages.id", "activity_package_pivots.activity_package_id")
            .andOn("activity_package_pivots.language_code", knex.raw("?", [language]))
            .andOnNull("activity_packages.deleted_at")
            .andOnNull("activity_package_pivots.deleted_at");
        })

        // Paket fiyatları
        .leftJoin("activity_package_prices", function () {
          this.on("activity_packages.id", "activity_package_prices.activity_package_id").andOnNull("activity_package_prices.deleted_at");
        })

        // Para birimi bilgileri
        .leftJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
        .leftJoin("currency_pivots", function () {
          this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]));
        })

        // Paket saatleri
        .leftJoin("activity_package_hours", function () {
          this.on("activity_packages.id", "activity_package_hours.activity_package_id").andOnNull("activity_package_hours.deleted_at");
        })

        // Paket resimleri
        .leftJoin("activity_package_images", function () {
          this.on("activity_packages.id", "activity_package_images.activity_package_id").andOnNull("activity_package_images.deleted_at");
        })

        .select(
          // Activity bilgileri
          "activities.*",
          "activity_pivots.title as activity_title",
          "activity_pivots.general_info",
          "activity_pivots.activity_info",
          "activity_pivots.refund_policy as activity_refund_policy",

          // Activity type bilgileri
          "activities_type_pivots.name as activity_type_name",

          // Lokasyon bilgileri
          "country_pivots.name as country_name",
          "city_pivots.name as city_name",

          // Gallery bilgileri
          "activity_galleries.id as gallery_id",
          "activity_galleries.image_url as gallery_image_url",
          "activity_galleries.image_type as gallery_image_type",
          "activity_gallery_pivots.category as gallery_category",

          // Activity features
          "activity_features.id as feature_id",
          "activity_features.status as feature_status",
          "activity_feature_pivots.name as feature_name",

          // Paket bilgileri
          "activity_packages.id as package_id",
          "activity_packages.activity_id",
          "activity_package_pivots.name as package_name",
          "activity_package_pivots.description as package_description",
          "activity_package_pivots.refund_policy as package_refund_policy",
          "activity_packages.return_acceptance_period",
          "activity_packages.discount",
          "activity_packages.start_date as package_start_date",
          "activity_packages.end_date as package_end_date",
          "activity_packages.total_tax_amount",
          "activity_packages.constant_price",
          "activity_packages.created_at",
          "activity_packages.updated_at",

          // Paket fiyatları
          "activity_package_prices.id as price_id",
          "activity_package_prices.main_price",
          "activity_package_prices.child_price",
          "activity_package_prices.start_date as price_start_date",
          "activity_package_prices.end_date as price_end_date",
          "currency_pivots.name as currency_name",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",

          // Paket saatleri
          "activity_package_hours.id as hour_id",
          "activity_package_hours.hour",
          "activity_package_hours.minute",

          // Paket resimleri
          "activity_package_images.id as package_image_id",
          "activity_package_images.image_url as package_image_url",
        );

      if (results.length === 0) {
        return res.status(404).send({
          success: false,
          message: req.t("ACTIVITY.ACTIVITY_NOT_FOUND"),
        });
      }

      // grupla ve yapılandır
      const packageMap = new Map();
      const now = new Date();

      results.forEach((row: any) => {
        if (!row.package_id) return; // Paket yoksa atla

        // Geçmiş paketleri filtrele
        if (row.package_end_date && new Date(row.package_end_date) < now) {
          return; // Geçmiş paketleri atla
        }

        if (!packageMap.has(row.package_id)) {
          packageMap.set(row.package_id, {
            id: row.package_id,
            activity_id: row.activity_id,
            start_date: row.package_start_date,
            end_date: row.package_end_date,
            return_acceptance_period: row.return_acceptance_period,
            discount: row.discount,
            total_tax_amount: row.total_tax_amount,
            constant_price: row.constant_price,
            package_name: row.package_name,
            package_description: row.package_description,
            package_refund_policy: row.package_refund_policy,
            created_at: row.created_at,
            updated_at: row.updated_at,
            pkg_info: {
              id: row.package_id,
              activity_id: row.activity_id,
              discount: row.discount,
              total_tax_amount: row.total_tax_amount,
              return_acceptance_period: row.return_acceptance_period,
              created_at: row.created_at,
              updated_at: row.updated_at,
              hours: [],
              calculated_price: null,
            },
            images: [],
            price: null,
          });
        }

        const packageData = packageMap.get(row.package_id);

        // Paket saatleri - pkg_info içine ekle
        if (row.hour_id) {
          const existingHour = packageData.pkg_info.hours.find((hour: any) => hour.id === row.hour_id);
          if (!existingHour) {
            packageData.pkg_info.hours.push({
              id: row.hour_id,
              hour: row.hour,
              minute: row.minute,
              activity_package_id: row.package_id,
            });
          }
        }

        // Paket fiyatı - tek fiyat seç
        if (row.price_id && !packageData.price) {
          const currentDate = date ? new Date(date) : new Date();
          
          // constant_price true ise her zaman ilk fiyatı seç
          if (row.constant_price) {
            packageData.price = {
              id: row.price_id,
              activity_package_id: row.package_id,
              main_price: row.main_price,
              child_price: row.child_price,
              start_date: row.price_start_date,
              end_date: row.price_end_date,
              currency: row.currency_code ? {
                code: row.currency_code,
                symbol: row.currency_symbol,
              } : undefined,
            };
          } else {
            // constant_price false ise tarih aralığına göre seç
            const priceStartDate = row.price_start_date ? new Date(row.price_start_date) : null;
            const priceEndDate = row.price_end_date ? new Date(row.price_end_date) : null;
            
            // Tarih aralığı kontrolü
            const isInDateRange = (!priceStartDate || currentDate >= priceStartDate) && 
                                  (!priceEndDate || currentDate <= priceEndDate);
            
            if (isInDateRange) {
              packageData.price = {
                id: row.price_id,
                activity_package_id: row.package_id,
                main_price: row.main_price,
                child_price: row.child_price,
                start_date: row.price_start_date,
                end_date: row.price_end_date,
                currency: row.currency_code ? {
                  code: row.currency_code,
                  symbol: row.currency_symbol,
                } : undefined,
              };
            }
          }
        }

        // Paket resimleri - ActivityPackageImage formatında
        if (row.package_image_id) {
          const existingImage = packageData.images.find((img: any) => img.id === row.package_image_id);
          if (!existingImage) {
            packageData.images.push({
              id: row.package_image_id,
              image_url: row.package_image_url,
            });
          }
        }
      });

      // Paket saatlerini sırala ve calculated_price hesapla
      packageMap.forEach(packageData => {
        packageData.pkg_info.hours.sort((a: any, b: any) => {
          if (a.hour !== b.hour) return a.hour - b.hour;
          return a.minute - b.minute;
        });

        // calculated_price hesapla ve price'ın içine ekle
        if (packageData.price && adult !== undefined && child !== undefined) {
          const adultCount = Number(adult) || 1;
          const childCount = Number(child) || 0;
          
          const calculatedPrice = ActivityController.calculatePrice(
            packageData.price,
            packageData,
            adultCount,
            childCount,
            date
          );
          
          // Price'ın içine calculated_price bilgilerini ekle
          if (packageData.price && calculatedPrice) {
            packageData.price.discount_percentage = calculatedPrice.discount_percentage;
            packageData.price.discount_amount = calculatedPrice.discount_amount;
            packageData.price.tax_percentage = calculatedPrice.tax_percentage;
            packageData.price.tax_amount = calculatedPrice.tax_amount;
            packageData.price.final_price = calculatedPrice.final_price;
            packageData.price.price_breakdown = calculatedPrice.price_breakdown;
          }
          
          packageData.pkg_info.calculated_price = calculatedPrice;
        }
      });

      // Sadece fiyatı olan paketleri döndür
      const packages = Array.from(packageMap.values())
        .filter((pkg: any) => pkg.price !== null) as any;

      return res.status(200).send({
        success: true,
        message: req.t("ACTIVITY.ACTIVITY_PACKAGE_FETCHED_SUCCESS"),
        data: packages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ACTIVITY.ACTIVITY_FETCHED_ERROR"),
      });
    }
  }

  private static calculatePrice(priceData: any, pkgData: any, adult: number, child: number, date?: string) {
    if (!priceData) return null;
 
    const mainPrice = parseFloat(priceData.main_price) || 0;
    const childPrice = parseFloat(priceData.child_price) || 0;
    const discount = parseFloat(pkgData.discount) || 0;
    const totalTaxAmount = parseFloat(pkgData.total_tax_amount) || 0;

    // Aktivite için gün sayısı 1 (tek günlük aktivite)
    const days = 1;

    // Yetişkin fiyatı hesapla
    const adultTotal = mainPrice * adult * days;
    
    // Çocuk fiyatı hesapla - basit çocuk fiyatı
    const childTotal = childPrice * child * days;
    
    // Toplam fiyat (vergi dahil)
    const subtotal = adultTotal + childTotal;
    
    // İndirim hesapla
    const discountAmount = (subtotal * discount) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    
    // Vergi bilgisi (ama final fiyata dahil etme, vergi zaten fiyata dahil)
    const taxAmount = 0; // Vergi final fiyata dahil değil
    // Final fiyat (vergi dahil, indirim uygulanmış)
    const finalPrice = discountedSubtotal;

    return {
      currency_code: priceData.currency?.code || "USD",
      currency_symbol: priceData.currency?.symbol || "$",
      main_price: mainPrice,
      child_price: childPrice,
      days: days,
      adult_count: adult,
      child_count: child,
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
