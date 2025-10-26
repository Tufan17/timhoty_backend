import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class VisaController {
  async getApprovedVisas(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { location_id, page = 1, limit = 5, guest_rating, date, arrangement, min_price, max_price } = req.query as any;

      // Count query: get the total number of visas matching the filters
      const countQuery = knex("visas")
        .innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
        .where("visas.status", true)
        .where("visas.admin_approval", true)
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
        .countDistinct("visas.id as total");

      let visas = await knex("visas")
        .whereNull("visas.deleted_at")
        .where("visas.status", true)
        .where("visas.admin_approval", true)
        .innerJoin("visa_pivots", function () {
          this.on("visas.id", "visa_pivots.visa_id").andOn("visa_pivots.language_code", knex.raw("?", [language]));
        })
        .innerJoin("country_pivots", function () {
          this.on("visas.location_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]));
        })
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("visas.location_id", location_id);
          }
          if (guest_rating) {
            queryBuilder.where("visas.average_rating", ">=", guest_rating);
          }
        })
        .limit(limit)
        .offset((page - 1) * limit)
        .select("visas.id", "visa_pivots.title", "country_pivots.name as country_name", "country_pivots.country_id as location_id", "visas.average_rating", "visas.comment_count", "visas.refund_days");

      // Get all visa packages for all visas in one query
      const visaIds = visas.map((visa: any) => visa.id);
      const mainImages = await knex("visa_galleries")
        .select("visa_galleries.visa_id", "visa_galleries.image_url")
        .innerJoin("visa_gallery_pivot", "visa_galleries.id", "visa_gallery_pivot.visa_gallery_id")
        .whereIn("visa_galleries.visa_id", visaIds)
        .whereNull("visa_galleries.deleted_at")
        .whereNull("visa_gallery_pivot.deleted_at")
        .where("visa_gallery_pivot.language_code", language)
        .where("visa_gallery_pivot.category", "Kapak Resmi")
        .whereRaw(
          `visa_galleries.id IN (
        SELECT vg.id FROM visa_galleries vg
        LEFT JOIN visa_gallery_pivot vgp ON vg.id = vgp.visa_gallery_id
        WHERE vg.visa_id = visa_galleries.visa_id
        AND vg.deleted_at IS NULL
        AND vgp.deleted_at IS NULL
        AND vgp.language_code = ?
        AND vgp.category = 'Kapak Resmi'
        ORDER BY vg.created_at ASC
        LIMIT 1
    )`,
          [language]
        );

      visas.forEach((visa: any) => {
        const image_url = mainImages.find((img: any) => img.visa_id === visa.id);
        visa.image_url = image_url ? image_url.image_url : null;
      });

      return res.status(200).send({
        success: true,
        message: req.t("VISA.VISA_FETCHED_SUCCESS"),
        data: visas,
        total: visas.length,
        totalPages: Math.ceil(visas.length / Number(limit)),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA.VISA_FETCHED_ERROR"),
      });
    }
  }

  async getVisaById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as any;
      const language = (req as any).language;
      const { adult, child } = req.query as {
        adult: number;
        child: number;
      };


      // Tek sorguda tüm veriyi çek
      const results = await knex("visas")
        .where("visas.id", id)
        .whereNull("visas.deleted_at")

        // Visa bilgileri
        .innerJoin("visa_pivots", function () {
          this.on("visas.id", "visa_pivots.visa_id").andOn("visa_pivots.language_code", knex.raw("?", [language]));
        })
        .whereNull("visa_pivots.deleted_at")

        // Şehir ve ülke bilgileri
        .innerJoin("countries", "visas.location_id", "countries.id")
        .innerJoin("country_pivots", function () {
          this.on("countries.id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]));
        })
        .whereNull("country_pivots.deleted_at")

        // Gallery bilgileri
        .leftJoin("visa_galleries", function () {
          this.on("visas.id", "visa_galleries.visa_id").andOnNull("visa_galleries.deleted_at");
        })
        .leftJoin("visa_gallery_pivot", function () {
          this.on("visa_galleries.id", "visa_gallery_pivot.visa_gallery_id")
            .andOn("visa_gallery_pivot.language_code", knex.raw("?", [language]))
            .andOnNull("visa_gallery_pivot.deleted_at");
        })

        // Visa özellikleri
        .leftJoin("visa_features", function () {
          this.on("visas.id", "visa_features.visa_id").andOnNull("visa_features.deleted_at");
        })
        .leftJoin("visa_feature_pivots", function () {
          this.on("visa_features.id", "visa_feature_pivots.visa_feature_id")
            .andOn("visa_feature_pivots.language_code", knex.raw("?", [language]))
            .andOnNull("visa_feature_pivots.deleted_at");
        })

        // Paket bilgileri
        .leftJoin("visa_packages", function () {
          this.on("visas.id", "visa_packages.visa_id").andOnNull("visa_packages.deleted_at");
        })
        .leftJoin("visa_package_pivots", function () {
          this.on("visa_packages.id", "visa_package_pivots.visa_package_id")
            .andOn("visa_package_pivots.language_code", knex.raw("?", [language]))
            .andOnNull("visa_package_pivots.deleted_at");
        })

        // Paket fiyatları
        .leftJoin("visa_package_prices", function () {
          this.on("visa_packages.id", "visa_package_prices.visa_package_id").andOnNull("visa_package_prices.deleted_at");
        })

        // Para birimi bilgileri
        .leftJoin("currencies", "visa_package_prices.currency_id", "currencies.id")
        .leftJoin("currency_pivots", function () {
          this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]));
        })

        // Paket resimleri
        .leftJoin("visa_package_images", function () {
          this.on("visa_packages.id", "visa_package_images.visa_package_id").andOnNull("visa_package_images.deleted_at");
        })

        // Paket özellikleri
        .leftJoin("visa_package_features", function () {
          this.on("visa_packages.id", "visa_package_features.visa_package_id").andOnNull("visa_package_features.deleted_at");
        })
        .leftJoin("visa_package_feature_pivots", function () {
          this.on("visa_package_features.id", "visa_package_feature_pivots.visa_package_feature_id")
            .andOn("visa_package_feature_pivots.language_code", knex.raw("?", [language]))
            .andOnNull("visa_package_feature_pivots.deleted_at");
        })

        .select(
          // Visa bilgileri
          "visas.*",
          "visa_pivots.title as visa_title",
          "visa_pivots.general_info as general_info",
          "visa_pivots.visa_info",
          "visa_pivots.refund_policy as visa_refund_policy",

          // Lokasyon bilgileri
          "country_pivots.name as country_name",

          // Gallery bilgileri
          "visa_galleries.id as gallery_id",
          "visa_galleries.image_url as gallery_image_url",
          "visa_galleries.image_type as gallery_image_type",
          "visa_gallery_pivot.category as gallery_category",

          // Visa features
          "visa_features.id as feature_id",
          "visa_features.status as feature_status",
          "visa_feature_pivots.name as feature_name",

          // Paket bilgileri
          "visa_packages.id as package_id",
          "visa_package_pivots.name as package_name",
          "visa_package_pivots.description as package_description",
          "visa_package_pivots.refund_policy as package_refund_policy",
          "visa_packages.return_acceptance_period",
          "visa_packages.discount",
          "visa_packages.total_tax_amount",
          "visa_packages.constant_price",

          // Paket fiyatları
          "visa_package_prices.id as price_id",
          "visa_package_prices.main_price",
          "visa_package_prices.child_price",
          "visa_package_prices.start_date",
          "visa_package_prices.end_date",
          "currency_pivots.name as currency_name",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",

          // Paket resimleri
          "visa_package_images.id as package_image_id",
          "visa_package_images.image_url as package_image_url",

          // Paket özellikleri
          "visa_package_features.id as package_feature_id",
          "visa_package_features.status as package_feature_status",
          "visa_package_feature_pivots.name as package_feature_name"
        );

      if (results.length === 0) {
        return res.status(404).send({
          success: false,
          message: "Visa not found",
        });
      }

      // Sadece paket verilerini döndür

      // Paketleri grupla
      const packageMap = new Map();
      const now = new Date();

      results.forEach((row: any) => {
        if (!row.package_id) return;

        if (!packageMap.has(row.package_id)) {
          packageMap.set(row.package_id, {
            id: row.package_id,
            name: row.package_name,
            description: row.package_description,
            refund_policy: row.package_refund_policy,
            return_acceptance_period: row.return_acceptance_period,
            discount: row.discount,
            total_tax_amount: row.total_tax_amount,
            constant_price: row.constant_price,
            images: [],
            features: [],
            selectedPrice: null,
            calculated_price: null,
          });
        }

        const packageData = packageMap.get(row.package_id);

        // Paket resimleri
        if (row.package_image_id) {
          const existingImage = packageData.images.find((img: any) => img.id === row.package_image_id);
          if (!existingImage) {
            packageData.images.push({
              id: row.package_image_id,
              image_url: row.package_image_url,
            });
          }
        }

        // Paket özellikleri
        if (row.package_feature_id) {
          const existingFeature = packageData.features.find((feat: any) => feat.id === row.package_feature_id);
          if (!existingFeature) {
            packageData.features.push({
              id: row.package_feature_id,
              name: row.package_feature_name,
              status: row.package_feature_status,
            });
          }
        }

        // Paket fiyatları
        if (row.price_id && !packageData.selectedPrice) {
          let selectedPrice = null;

          if (row.constant_price) {
            // Sabit fiyat ise herhangi bir fiyat al
            selectedPrice = {
              id: row.price_id,
              main_price: row.main_price,
              child_price: row.child_price,
              start_date: row.start_date,
              end_date: row.end_date,
              currency: {
                name: row.currency_name,
                code: row.currency_code,
                symbol: row.currency_symbol,
              },
            };
          } else {
            // Sabit fiyat değilse şu anki tarihe göre fiyat bul
            if (row.start_date && row.end_date) {
              const startDate = new Date(row.start_date);
              const endDate = new Date(row.end_date);

              if (now >= startDate && now <= endDate) {
                selectedPrice = {
                  id: row.price_id,
                  main_price: row.main_price,
                  child_price: row.child_price,
                  start_date: row.start_date,
                  end_date: row.end_date,
                  currency: {
                    name: row.currency_name,
                    code: row.currency_code,
                    symbol: row.currency_symbol,
                  },
                };
              }
            }
          }

          if (selectedPrice) {
            packageData.selectedPrice = selectedPrice;
          }
        }
      });

      // Fiyat hesaplama
      const packages = Array.from(packageMap.values()).map((pkg: any) => {
        if (pkg.selectedPrice && adult && child !== undefined) {
          pkg.calculated_price = VisaController.calculatePrice(pkg.selectedPrice, pkg, adult, child);
        }
        return {
          ...pkg,
          price: pkg.selectedPrice,
          selectedPrice: undefined,
        };
      });

      return res.status(200).send({
        success: true,
        message: "Visa packages retrieved successfully",
        data: packages,
      });
    } catch (error) {
      console.error("Visa show error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve visa",
      });
    }
  }

  private static calculatePrice(priceData: any, packageData: any, adult: number, child: number) {
    if (!priceData) return null;
 
    const mainPrice = parseFloat(priceData.main_price) || 0;
    const childPrice = parseFloat(priceData.child_price) || 0;
    const discount = parseFloat(packageData.discount) || 0;

    // Yetişkin fiyatı hesapla
    const adultTotal = mainPrice * adult;
    
    // Çocuk fiyatı hesapla - basit çocuk fiyatı
    const childTotal = childPrice * child;
    
    // Toplam fiyat
    const subtotal = adultTotal + childTotal;
    
    // İndirim hesapla
    const discountAmount = (subtotal * discount) / 100;
    
    // Final fiyat (vergisiz)
    const finalPrice = subtotal - discountAmount;

    return {
      currency_code: priceData.currency.code,
      currency_symbol: priceData.currency.symbol,
      main_price: mainPrice,
      child_price: childPrice,
      adult_count: adult,
      child_count: child,
      subtotal: subtotal,
      discount_percentage: discount,
      discount_amount: discountAmount,
      final_price: finalPrice,
      price_breakdown: {
        adult_total: adultTotal,
        child_total: childTotal,
        subtotal: subtotal,
        discount_amount: discountAmount,
        final_price: finalPrice
      }
    };
  }

}
