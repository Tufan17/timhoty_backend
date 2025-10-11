import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import HotelModel from "@/models/HotelModel";

// Helper function to calculate price for date range
async function calculatePriceForDateRange(
  packageId: string,
  checkInDate: Date,
  checkOutDate: Date
): Promise<number> {
  let totalPrice = 0;

  // Get all price periods for this package
  const pricePeriods = await knex("hotel_room_package_prices")
    .where("hotel_room_package_id", packageId)
    .whereNull("deleted_at")
    .orderBy("start_date", "asc");

  // Calculate price for each day
  const currentDate = new Date(checkInDate);
  while (currentDate < checkOutDate) {
    let dayPrice = 0;

    // Find the price period that covers this day
    for (const period of pricePeriods) {
      const periodStart = new Date(period.start_date);
      const periodEnd = period.end_date ? new Date(period.end_date) : null;

      if (
        currentDate >= periodStart &&
        (!periodEnd || currentDate <= periodEnd)
      ) {
        dayPrice = period.main_price;
        break;
      }
    }

    totalPrice += dayPrice;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalPrice;
}

export default class HotelController {
  async index(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;

      const {
        location_id,
        star_rating,
        page = 1,
        limit = 1,
        childAge = "",
        start_date,
        guest_rating,
        end_date,
        adult,
        child,
        arrangement,
        isAvailable,
        min_price,
        max_price,
      } = req.query as any;

      const countQuery = knex("hotels")
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .where("hotels.status", true)
        .where("hotels.admin_approval", true)

        .whereNull("hotels.deleted_at")
        .where("hotel_pivots.language_code", language)
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("hotels.location_id", location_id);
          }
          if (star_rating?.split(",").length > 0) {
            queryBuilder.whereIn("hotels.star_rating", star_rating?.split(","));
          }
          if (guest_rating) {
            queryBuilder.where("hotels.average_rating", ">=", guest_rating);
          }
        })
        .groupBy("hotels.id")
        .countDistinct("hotels.id as total");

      let hotel = await knex("hotels")
        .whereNull("hotels.deleted_at")
        .where("hotels.status", true)
        .where("hotels.admin_approval", true)
        .innerJoin("hotel_pivots", function () {
          this.on("hotels.id", "hotel_pivots.hotel_id").andOn(
            "hotel_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .innerJoin("cities", "hotels.location_id", "cities.id")
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
            queryBuilder.where("hotels.location_id", location_id);
          }
          if (star_rating?.split(",").length > 0) {
            queryBuilder.whereIn("hotels.star_rating", star_rating?.split(","));
          }
          if (guest_rating) {
            queryBuilder.where("hotels.average_rating", ">=", guest_rating);
          }
        })
        // otel galerisinden sadece 1 fotoğraf getir
        .leftJoin(
          // Join only the first image per hotel using lateral join
          knex.raw(
            `LATERAL (
              SELECT hg.image_url
              FROM hotel_galleries hg
              LEFT JOIN hotel_gallery_pivot hgp ON hg.id = hgp.hotel_gallery_id
              WHERE hg.hotel_id = hotels.id
              AND hg.deleted_at IS NULL
              AND hgp.category = 'Kapak Resmi'
              AND hgp.deleted_at IS NULL
              ORDER BY hg.created_at ASC
              LIMIT 1
            ) AS hotel_gallery ON true`
          )
        )
        .limit(limit)
        .offset((page - 1) * limit)
        .select(
          "hotels.id",
          "hotel_pivots.name",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name",
          "city_pivots.city_id as location_id",
          "country_pivots.country_id as country_id",
          "hotels.star_rating",
          "hotels.average_rating",
          "hotels.comment_count",
          "hotels.refund_days",
          "hotels.pool",
          "hotels.private_beach",
          "hotels.transfer",
          "hotels.map_location",
          "hotels.free_age_limit",
          "hotel_gallery.image_url"
        );

      // otel odaları getirilecek
      // Fetch all hotel rooms for all hotels in the current page, not just one hotel
      const hotelIds = hotel.map((h: any) => h.id);

      const hotelRooms = await knex("hotel_rooms")
        .whereIn("hotel_rooms.hotel_id", hotelIds)
        .innerJoin(
          "hotel_room_pivots",
          "hotel_rooms.id",
          "hotel_room_pivots.hotel_room_id"
        )
        .where("hotel_room_pivots.language_code", language)
        .whereNull("hotel_rooms.deleted_at")
        .select(
          "hotel_rooms.refund_days",
          "hotel_rooms.id",
          "hotel_rooms.hotel_id",
          "hotel_room_pivots.name"
        );

      const roomPackages = await knex("hotel_room_packages")
        .whereIn(
          "hotel_room_packages.hotel_room_id",
          hotelRooms.map((h: any) => h.id)
        )
        .whereNull("hotel_room_packages.deleted_at")
        .select(
          "hotel_room_packages.id",
          "hotel_room_packages.hotel_room_id",
          "hotel_room_packages.constant_price",
          "hotel_room_packages.total_tax_amount",
          "hotel_room_packages.discount"
        );

      const roomPackagePrices = await knex("hotel_room_package_prices")
        .whereIn(
          "hotel_room_package_prices.hotel_room_package_id",
          roomPackages.map((h: any) => h.id)
        )
        .whereNull("hotel_room_package_prices.deleted_at")
        .select("hotel_room_package_prices.*");

      hotel.forEach((item: any) => {
        hotelRooms.forEach(async (hotelRoom: any) => {
          roomPackages.forEach(async (roomPackage: any) => {
            if (start_date && end_date) {
              // şimdi iki tarih arasında kalan günleri bulalım
              const startDate = new Date(start_date);
              const endDate = new Date(end_date);
              const diffTime = Math.abs(
                endDate.getTime() - startDate.getTime()
              );
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const days = [];
              for (let i = 0; i < diffDays; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                days.push(date);
              }
              // şimdi iki tarih arasında kalan günleri bulalım
              //  şimdi bu tarihler arasındaki fiyatları bulacağız

              // kaç gece kalınacak
              const nights = Math.ceil(
                (endDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              for (const day of days) {
                // fiyat sabitse direk al değilse tarih arasındaki fiyatları bulalım
                const price = roomPackage.constant_price
                  ? roomPackagePrices.find(
                      (room: any) =>
                        room.hotel_room_package_id === roomPackage.id
                    )
                  : roomPackagePrices.find(
                      (room: any) =>
                        room.hotel_room_package_id === roomPackage.id &&
                        room.start_date <= day &&
                        room.end_date >= day
                    );
                if (price) {
                  roomPackage.price = {
                    main_price: price.main_price,
                    child_price: price.child_price,
                  };

                  let totalPrice = 0;
                  if (adult) {
                    totalPrice += price.main_price * adult;
                  }
                  if (child) {
                    const newChild =
                      childAge.split(",").length !== Number(child)
                        ? child
                        : childAge
                            .split(",")
                            .filter(
                              (c: any) => parseInt(c) > item.free_age_limit
                            );
                    totalPrice += price.child_price * newChild.length;
                  }

                  if (!adult && !child) {
                    totalPrice += price.main_price;
                  }

                  roomPackage.total_price = totalPrice * nights;
                  roomPackage.nights = nights;
                }
              }
            } else if (roomPackage.constant_price) {
              const price = roomPackagePrices.find(
                (room: any) => room.hotel_room_package_id === roomPackage.id
              );
              roomPackage.price = {
                main_price: price.main_price,
                child_price: price.child_price,
              };
              let totalPrice = 0;
              if (adult) {
                totalPrice += price.main_price * adult;
              }
              if (child) {
                const newChild =
                  childAge.split(",").length !== Number(child)
                    ? child
                    : childAge
                        .split(",")
                        .filter((c: any) => parseInt(c) > item.free_age_limit);
                totalPrice += price.child_price * newChild.length;
              }
              if (!adult && !child) {
                totalPrice += price.main_price;
              }
              roomPackage.total_price = totalPrice;
              roomPackage.nights = 1;
            } else {
              const now = new Date();
              const price = roomPackagePrices.find(
                (room: any) =>
                  room.hotel_room_package_id === roomPackage.id &&
                  room.start_date <= now &&
                  room.end_date >= now
              );

              if (!price) {
                // Eğer fiyat bulunamazsa, varsayılan değerler kullan
                roomPackage.price = {
                  main_price: 0,
                  child_price: 0,
                };
                roomPackage.totalPrice = 0;
                return;
              }

              roomPackage.price = {
                main_price: price.main_price,
                child_price: price.child_price,
              };
              let totalPrice = 0;
              if (adult) {
                totalPrice += price.main_price * adult;
              }
              if (child) {
                const newChild =
                  childAge.split(",").length !== Number(child)
                    ? child
                    : childAge
                        .split(",")
                        .filter((c: any) => parseInt(c) > item.free_age_limit);
                totalPrice += price.child_price * newChild.length;
              }
              if (!adult && !child) {
                totalPrice += price.main_price;
              }

              roomPackage.total_price = totalPrice;
              roomPackage.nights = 1;
            }
          });

          hotelRoom.roomPackage = roomPackages.find(
            (room: any) => room.hotel_room_id === hotelRoom.id
          );
        });

        // Otele ait odaları bul
        const relatedRooms = hotelRooms.filter(
          (room: any) => room.hotel_id === item.id
        );

        // En düşük fiyatlı odayı seç
        const cheapestRoom = relatedRooms.reduce(
          (lowest: any, current: any) => {
            const lowestPrice = lowest?.roomPackage?.total_price ?? Infinity;
            const currentPrice = current?.roomPackage?.total_price ?? Infinity;

            return currentPrice < lowestPrice ? current : lowest;
          },
          null
        );

        // Otele sadece en ucuz odayı ata
        item.room = cheapestRoom ? cheapestRoom : null;
      });

      if (arrangement === "price_increasing") {
        hotel.sort(
          (a: any, b: any) =>
            a.room.roomPackage.total_price - b.room.roomPackage.total_price
        );
      } else if (arrangement === "price_decreasing") {
        hotel.sort(
          (a: any, b: any) =>
            b.room.roomPackage.total_price - a.room.roomPackage.total_price
        );
      } else if (arrangement === "star_increasing") {
        hotel.sort((a: any, b: any) => a.star_rating - b.star_rating);
      } else if (arrangement === "star_decreasing") {
        hotel.sort((a: any, b: any) => b.star_rating - a.star_rating);
      } else if (arrangement === "rating_increasing") {
        hotel.sort((a: any, b: any) => a.average_rating - b.average_rating);
      } else if (arrangement === "rating_decreasing") {
        hotel.sort((a: any, b: any) => b.average_rating - a.average_rating);
      }

      if (isAvailable) {
        hotel = hotel.filter(
          (item: any) => item?.room?.roomPackage?.total_price > 0
        );
      }

      if (min_price) {
        hotel = hotel.filter(
          (item: any) => item?.room?.roomPackage?.total_price >= min_price
        );
      }
      if (max_price) {
        hotel = hotel.filter(
          (item: any) => item?.room?.roomPackage?.total_price <= max_price
        );
      }

      const countResult = await countQuery;
      const total = countResult.length;
      const totalPages = Math.ceil(total / limit);
      return res.status(200).send({
        success: true,
        message: "Test success",
        data: hotel,
        limit: limit,
        total: total,
        currentPage: Number(page),
        totalPages: totalPages,
      });
    } catch (error) {
      console.error("Test error:", error);
      return res.status(500).send({
        success: false,
        message: "Test failed",
      });
    }
  }

  async show(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as any;
      const language = (req as any).language;
      const { start_date, end_date, adult, child, childAge = "" } = req.query as any;

      // Tek sorguda tüm veriyi çek - LEFT JOIN kullanarak
      const results = await knex("hotels")
        .where("hotels.id", id)
        .whereNull("hotels.deleted_at")

        // Hotel bilgileri
        .innerJoin("hotel_pivots", function () {
          this.on("hotels.id", "hotel_pivots.hotel_id").andOn(
            "hotel_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .whereNull("hotel_pivots.deleted_at")

        // Şehir ve ülke bilgileri
        .innerJoin("cities", "hotels.location_id", "cities.id")
        .innerJoin("country_pivots", function () {
          this.on("cities.country_id", "country_pivots.country_id").andOn(
            "country_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .whereNull("country_pivots.deleted_at")
        .innerJoin("city_pivots", function () {
          this.on("cities.id", "city_pivots.city_id").andOn(
            "city_pivots.language_code",
            knex.raw("?", [language])
          );
        })
        .whereNull("city_pivots.deleted_at")

        // Oda bilgileri (LEFT JOIN - oda olmayabilir)
        .leftJoin("hotel_rooms", function () {
          this.on("hotels.id", "hotel_rooms.hotel_id").andOnNull(
            "hotel_rooms.deleted_at"
          );
        })
        .leftJoin("hotel_room_pivots", function () {
          this.on("hotel_rooms.id", "hotel_room_pivots.hotel_room_id")
            .andOn("hotel_room_pivots.language_code", knex.raw("?", [language]))
            .andOnNull("hotel_room_pivots.deleted_at");
        })

        // Gallery bilgileri (tek seferde)
        .leftJoin("hotel_galleries", function () {
          this.on("hotels.id", "hotel_galleries.hotel_id").andOnNull(
            "hotel_galleries.deleted_at"
          );
        })
        .leftJoin("hotel_gallery_pivot", function () {
          this.on("hotel_galleries.id", "hotel_gallery_pivot.hotel_gallery_id")
            .andOn(
              "hotel_gallery_pivot.language_code",
              knex.raw("?", [language])
            )
            .andOnNull("hotel_gallery_pivot.deleted_at");
        })

        // Otel olanakları
        .leftJoin("hotel_opportunities", function () {
          this.on("hotels.id", "hotel_opportunities.hotel_id").andOnNull(
            "hotel_opportunities.deleted_at"
          );
        })
        .leftJoin("hotel_opportunity_pivots", function () {
          this.on(
            "hotel_opportunities.id",
            "hotel_opportunity_pivots.hotel_opportunity_id"
          )
            .andOn(
              "hotel_opportunity_pivots.language_code",
              knex.raw("?", [language])
            ) // Düzeltildi
            .andOnNull("hotel_opportunity_pivots.deleted_at");
        })

        // Otel özellikleri
        .leftJoin("hotel_features", function () {
          this.on("hotels.id", "hotel_features.hotel_id").andOnNull(
            "hotel_features.deleted_at"
          );
        })
        .leftJoin("hotel_feature_pivots", function () {
          this.on("hotel_features.id", "hotel_feature_pivots.hotel_feature_id")
            .andOn(
              "hotel_feature_pivots.language_code",
              knex.raw("?", [language])
            )
            .andOnNull("hotel_feature_pivots.deleted_at");
        })

        // Paket bilgileri (LEFT JOIN - paket olmayabilir)
        .leftJoin("hotel_room_packages", function () {
          this.on(
            "hotel_rooms.id",
            "hotel_room_packages.hotel_room_id"
          ).andOnNull("hotel_room_packages.deleted_at");
        })
        .leftJoin("hotel_room_package_prices", function () {
          this.on(
            "hotel_room_packages.id",
            "hotel_room_package_prices.hotel_room_package_id"
          ).andOnNull("hotel_room_package_prices.deleted_at");
        })

        // Otel oda resimleri (pivot tablosu yok, direkt image tablosu)
        .leftJoin("hotel_room_images", function () {
          this.on(
            "hotel_rooms.id",
            "hotel_room_images.hotel_room_id"
          ).andOnNull("hotel_room_images.deleted_at");
        })
        // hotel room opportunity
        .leftJoin("hotel_room_opportunities", function () {
          this.on(
            "hotel_rooms.id",
            "hotel_room_opportunities.hotel_room_id"
          ).andOnNull("hotel_room_opportunities.deleted_at");
        })
        .leftJoin("hotel_room_opportunity_pivots", function () {
          this.on(
            "hotel_room_opportunities.id",
            "hotel_room_opportunity_pivots.hotel_room_opportunity_id"
          )
            .andOn(
              "hotel_room_opportunity_pivots.language_code",
              knex.raw("?", [language])
            )
            .andOnNull("hotel_room_opportunity_pivots.deleted_at");
        })
        // hotel room feature
        .leftJoin("hotel_room_features", function () {
          this.on(
            "hotel_rooms.id",
            "hotel_room_features.hotel_room_id"
          ).andOnNull("hotel_room_features.deleted_at");
        })
        .leftJoin("hotel_room_feature_pivots", function () {
          this.on(
            "hotel_room_features.id",
            "hotel_room_feature_pivots.hotel_room_feature_id"
          )
            .andOn(
              "hotel_room_feature_pivots.language_code",
              knex.raw("?", [language])
            )
            .andOnNull("hotel_room_feature_pivots.deleted_at");
        })

        // Para birimi bilgileri
        .leftJoin("currencies", function () {
          this.on(
            "hotel_room_package_prices.currency_id",
            "currencies.id"
          ).andOnNull("currencies.deleted_at");
        })

        .select(
          // Hotel bilgileri
          "hotels.*",
          "hotels.refund_days",
          "hotel_pivots.name as hotel_name",
          "hotel_pivots.general_info",
          "hotel_pivots.hotel_info",
          "hotel_pivots.refund_policy as hotel_refund_policy",

          // Lokasyon bilgileri
          "country_pivots.name as country_name",
          "city_pivots.name as city_name",

          // Oda bilgileri
          "hotel_rooms.id as room_id",
          "hotel_rooms.refund_days as room_refund_days",
          "hotel_room_pivots.name as room_name",
          "hotel_room_pivots.description as room_description",
          "hotel_room_pivots.refund_policy as room_refund_policy",

          // Gallery bilgileri
          "hotel_galleries.id as gallery_id",
          "hotel_galleries.image_url as gallery_image_url",
          "hotel_gallery_pivot.category as gallery_category",

          // Otel olanakları
          "hotel_opportunities.id as opportunity_id",
          "hotel_opportunity_pivots.category as opportunity_category",
          "hotel_opportunity_pivots.description as opportunity_description",

          "hotel_features.id as feature_id",
          "hotel_features.status as feature_status",
          "hotel_feature_pivots.name as feature_name",

          // Otel oda resimleri
          "hotel_room_images.id as room_image_id",
          "hotel_room_images.image_url as room_image_url",

          // Otel oda olanakları
          "hotel_room_opportunities.id as room_opportunity_id",
          "hotel_room_opportunity_pivots.name as room_opportunity_name",

          // Otel oda özellikleri
          "hotel_room_features.id as room_feature_id",
          "hotel_room_features.status as room_feature_status",
          "hotel_room_feature_pivots.name as room_feature_name",

          // Paket bilgileri
          "hotel_room_packages.id as package_id",
          "hotel_room_packages.discount",
          "hotel_room_packages.total_tax_amount",
          "hotel_room_packages.constant_price",

          // Fiyat bilgileri
          "hotel_room_package_prices.id as price_id",
          "hotel_room_package_prices.main_price",
          "hotel_room_package_prices.child_price",
          "hotel_room_package_prices.start_date",
          "hotel_room_package_prices.end_date",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol"
        );

      let total_days = 1;

      if (start_date && end_date) {
        total_days = Math.ceil(
          (new Date(end_date).getTime() - new Date(start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
      }

      if (results.length === 0) {
        return res.status(404).send({
          success: false,
          message: "Hotel not found",
        });
      }

      const firstRow = results[0];
      const hotel = {
        id: firstRow.id,
        name: firstRow.hotel_name,
        general_info: firstRow.general_info,
        hotel_info: firstRow.hotel_info,
        refund_policy: firstRow.hotel_refund_policy,
        refund_days: firstRow.refund_days || 0,
        country_name: firstRow.country_name,
        city_name: firstRow.city_name,
        star_rating: firstRow.star_rating,
        average_rating: firstRow.average_rating,
        comment_count: firstRow.comment_count,
        pool: firstRow.pool,
        private_beach: firstRow.private_beach,
        transfer: firstRow.transfer,
        map_location: firstRow.map_location,
        free_age_limit: firstRow.free_age_limit,
        created_at: firstRow.created_at,
        updated_at: firstRow.updated_at,
        rooms: [],
        galleries: [],
        opportunities: [],
        features: [],
        comments: [],
      };

      // Odaları grupla ve yapılandır
      const roomMap = new Map();
      const now = new Date();

      results.forEach((row: any) => {
        if (!row.room_id) return; // Oda yoksa atla

        if (!roomMap.has(row.room_id)) {
          roomMap.set(row.room_id, {
            id: row.room_id,
            name: row.room_name,
            description: row.room_description,
            refund_policy: row.room_refund_policy,
            refund_days: row.room_refund_days,
            images: [],
            package: null,
            opportunities: [],
            features: [],
          });
        }

        // Otel oda resimleri varsa
        if (row.room_image_id) {
          const room = roomMap.get(row.room_id);
          // Aynı resim zaten eklenmiş mi kontrol et
          const existingImage = room.images.find(
            (img: any) => img.id === row.room_image_id
          );
          if (!existingImage) {
            room.images.push({
              id: row.room_image_id,
              image_url: row.room_image_url,
            });
          }
        }

        // Otel oda olanakları varsa
        if (row.room_opportunity_id) {
          const room = roomMap.get(row.room_id);
          // Aynı opportunity zaten eklenmiş mi kontrol et
          const existingOpportunity = room.opportunities.find(
            (opp: any) => opp.id === row.room_opportunity_id
          );
          if (!existingOpportunity) {
            room.opportunities.push({
              id: row.room_opportunity_id,
              name: row.room_opportunity_name,
            });
          }
        }

        // Otel oda özellikleri varsa
        if (row.room_feature_id) {
          const room = roomMap.get(row.room_id);
          // Aynı feature zaten eklenmiş mi kontrol et
          const existingFeature = room.features.find(
            (feat: any) => feat.id === row.room_feature_id
          );
          if (!existingFeature) {
            room.features.push({
              id: row.room_feature_id,
              name: row.room_feature_name,
              status: row.room_feature_status,
            });
          }
        }

        // Paket bilgileri varsa
        if (row.package_id && !roomMap.get(row.room_id).package) {
          let selectedPrice = null;

          // Fiyat mantığını uygula
          if (row.constant_price) {
            // Sabit fiyat ise herhangi bir fiyat al
            selectedPrice = row.price_id
              ? {
                  id: row.price_id,
                  main_price: row.main_price,
                  child_price: row.child_price,
                  start_date: row.start_date,
                  end_date: row.end_date,
                  currency_code: row.currency_code,
                  currency_symbol: row.currency_symbol,
                  total_price: (() => {
                    let totalPrice = 0;
                    if (adult) {
                      totalPrice += row.main_price * adult;
                    }
                    if (child) {
                      const newChild =
                        childAge.split(",").length !== Number(child)
                          ? child
                          : childAge
                              .split(",")
                              .filter(
                                (c: any) => parseInt(c) > firstRow.free_age_limit
                              );
                      totalPrice += row.child_price * newChild.length;
                    }
                    if (!adult && !child) {
                      totalPrice += row.main_price;
                    }
                    return totalPrice * total_days;
                  })(),
                }
              : null;
          } else {
            // Sabit fiyat değilse şu anki tarihe göre fiyat bul
            if (row.price_id && row.start_date && row.end_date) {
              const startDate = new Date(row.start_date);
              const endDate = new Date(row.end_date);

              if (now >= startDate && now <= endDate) {
                selectedPrice = {
                  id: row.price_id,
                  main_price: row.main_price,
                  child_price: row.child_price,
                  start_date: row.start_date,
                  end_date: row.end_date,
                  currency_code: row.currency_code,
                  currency_symbol: row.currency_symbol,
                  total_price: (() => {
                    let totalPrice = 0;
                    if (adult) {
                      totalPrice += row.main_price * adult;
                    }
                    if (child) {
                      const newChild =
                        childAge.split(",").length !== Number(child)
                          ? child
                          : childAge
                              .split(",")
                              .filter(
                                (c: any) => parseInt(c) > firstRow.free_age_limit
                              );
                      totalPrice += row.child_price * newChild.length;
                    }
                    if (!adult && !child) {
                      totalPrice += row.main_price;
                    }
                    return totalPrice * total_days;
                  })(),
                };
              }
            }
          }

          roomMap.get(row.room_id).package = selectedPrice
            ? {
                id: row.package_id,
                discount: row.discount,
                total_tax_amount: row.total_tax_amount,
                constant_price: row.constant_price,
                price: selectedPrice,
              }
            : null;
        }
      });

      hotel.rooms = Array.from(roomMap.values()) as any;

      // Gallery verilerini grupla
      const galleryMap = new Map();

      results.forEach((row: any) => {
        if (!row.gallery_image_url || !row.gallery_id) return; // Gallery yoksa atla

        if (!galleryMap.has(row.gallery_id)) {
          galleryMap.set(row.gallery_id, {
            image_url: row.gallery_image_url,
            category: row.gallery_category,
          });
        }
      });

      hotel.galleries = Array.from(galleryMap.values()) as any;

      // Otel olanaklarını grupla
      const opportunityMap = new Map();

      results.forEach((row: any) => {
        if (!row.opportunity_id) return; // Olanak yoksa atla

        if (!opportunityMap.has(row.opportunity_id)) {
          opportunityMap.set(row.opportunity_id, {
            id: row.opportunity_id,
            category: row.opportunity_category,
            description: row.opportunity_description,
          });
        }
      });

      hotel.opportunities = Array.from(opportunityMap.values()) as any;

      // Otel özelliklerini grupla
      const featureMap = new Map();

      results.forEach((row: any) => {
        if (!row.feature_id) return; // Özellik yoksa atla

        if (!featureMap.has(row.feature_id)) {
          featureMap.set(row.feature_id, {
            id: row.feature_id,
            name: row.feature_name,
            status: row.feature_status,
          });
        }
      });

      hotel.features = Array.from(featureMap.values()) as any;

      // comments
      const hotelModel = new HotelModel();
      const comments = await hotelModel.getComments(language, 100, id);
      hotel.comments = comments as any;

      return res.status(200).send({
        success: true,
        message: "Hotel retrieved successfully",
        data: hotel,
      });
    } catch (error) {
      console.error("Hotel show error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve hotel",
      });
    }
  }
}
