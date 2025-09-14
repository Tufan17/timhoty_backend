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
        date,
        arrangement,
        min_price,
        max_price,
      } = req.query as any;

      // Count query: get the total number of visas matching the filters
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

      // Get all visa package prices in one query
      const allvisaPackageIds = allvisaPackages.map((pkg: any) => pkg.id);
      // date gönderilmişse ve fiyat sabit değilse fiyatı tarihe göre getir
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
          "visa_package_prices.start_date",
          "visa_package_prices.end_date",
          "currency_pivots.name",
          "currencies.code",
          "currencies.symbol"
        );

        // visa packages içinde visa_package_prices'ı bul ve ata
        allvisaPackages.forEach((item: any) => {
          let visa_package_price = allvisaPackagePrices.filter(
            (price: any) => price.visa_package_id === item.id
          );

          if(date){
            item.visa_package_price = visa_package_price.find(
              (price: any) => price.start_date <= new Date(date) && price.end_date >= new Date(date)
            );
          }

          else{
            // en düşük fiyatlı olanı ata
            item.visa_package_price = visa_package_price.reduce((lowest: any, current: any) => {
              return current.main_price < lowest.main_price ? current : lowest;
            }, visa_package_price[0]);
          }


        });

 
     

      visas.forEach((visa: any) => {
        // Her vize için, ona ait tüm paketleri bul ve en düşük fiyatlı olanı ata
        const relatedPackages = allvisaPackages.filter(
          (visaPackage: any) => visaPackage.visa_id === visa.id
        );
        if (relatedPackages.length > 0) {
          // Fiyatı olan paketleri filtrele
          const packagesWithPrice = relatedPackages.filter(
            (pkg: any) =>
              pkg.visa_package_price &&
              pkg.visa_package_price.main_price !== undefined &&
              pkg.visa_package_price.main_price !== null
          );
          if (packagesWithPrice.length > 0) {
            // En düşük fiyatlı paketi bul
            let minPricePackage = packagesWithPrice[0];
            for (let i = 1; i < packagesWithPrice.length; i++) {
              if (
                packagesWithPrice[i].visa_package_price.main_price <
                minPricePackage.visa_package_price.main_price
              ) {
                minPricePackage = packagesWithPrice[i];
              }
            }
            visa.visa_package = minPricePackage;
          } else {
            // Fiyatı olmayan varsa ilkini ata
            visa.visa_package = relatedPackages[0];
          }
        } else {
          visa.visa_package = null;
        }
      });

      visas.forEach((visa: any) => {
        if (visa.constant_price) {
          visa.visa_packages.forEach((visaPackage: any) => {
            visaPackage.visa_package_price = allvisaPackagePrices.find(
              (price: any) => price.visa_package_id === visaPackage.id
            );
          });
        }
      });

      // Fiyat filtreleri ve sıralama öncesi, total'ı doğru hesaplamak için filtrelenmiş vizeleri bul
      let filteredVisas = visas;

      if (min_price) {
        filteredVisas = filteredVisas.filter(
          (visa: any) => Number(visa?.visa_package?.visa_package_price?.main_price || 0) >= Number(min_price)
        );
      }
      if (max_price) {
        const maxPrice = Number(max_price);
        filteredVisas = filteredVisas.filter(
          (visa: any) => Number(visa?.visa_package?.visa_package_price?.main_price || 0) <= maxPrice
        );
      }

      // Sıralama
      if (arrangement === "price_increasing") {
        filteredVisas.sort(
          (a: any, b: any) => (a?.visa_package?.visa_package_price?.main_price || 0) - (b?.visa_package?.visa_package_price?.main_price || 0)
        );
      } else if (arrangement === "price_decreasing") {
        filteredVisas.sort(
          (a: any, b: any) => (b?.visa_package?.visa_package_price?.main_price || 0) - (a?.visa_package?.visa_package_price?.main_price || 0)
        );
      } else if (arrangement === "star_increasing") {
        filteredVisas.sort((a: any, b: any) => 0);
      } else if (arrangement === "star_decreasing") {
        filteredVisas.sort((a: any, b: any) => 0);
      } else if (arrangement === "rating_increasing") {
        filteredVisas.sort(
          (a: any, b: any) => a.average_rating - b.average_rating
        );
      } else if (arrangement === "rating_decreasing") {
        filteredVisas.sort(
          (a: any, b: any) => b.average_rating - a.average_rating
        );
      }

      // total yanlış oluyordu, countQuery ile değil, filtrelenmiş vizelerin sayısı ile alınmalı
      // const total = await countQuery.first();
      // const totalPages = Math.ceil(total?.total ?? 0 / Number(limit));
      const total = filteredVisas.length;
      const totalPages = Math.ceil(total / Number(limit));

      // Sayfalama uygula
      const paginatedVisas = filteredVisas.slice(
        (page - 1) * limit,
        (page - 1) * limit + limit
      );

      return res.status(200).send({
        success: true,
        message: "visas fetched successfully",
        data: paginatedVisas,
        total: total,
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
