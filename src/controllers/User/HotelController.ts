import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

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
        limit = 5,
        start_date,
        guest_rating,
        end_date,
        adult,
        child,
        arrangement,
        isAvailable,
        min_price,
        max_price
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
        .select("hotel_rooms.refund_days","hotel_rooms.id","hotel_rooms.hotel_id", "hotel_room_pivots.name");

      const roomPackages = await knex("hotel_room_packages")
        .whereIn(
          "hotel_room_packages.hotel_room_id",
          hotelRooms.map((h: any) => h.id)
        )
        .whereNull("hotel_room_packages.deleted_at")
        .select("hotel_room_packages.id","hotel_room_packages.hotel_room_id","hotel_room_packages.constant_price","hotel_room_packages.total_tax_amount","hotel_room_packages.discount");

      const roomPackagePrices = await knex("hotel_room_package_prices")
        .whereIn(
          "hotel_room_package_prices.hotel_room_package_id",
          roomPackages.map((h: any) => h.id)
        )
        .whereNull("hotel_room_package_prices.deleted_at")
        .select("hotel_room_package_prices.*");

      roomPackages.forEach(async (item: any) => {
        if (start_date && end_date) {
          // şimdi iki tarih arasında kalan günleri bulalım
          const startDate = new Date(start_date);
          const endDate = new Date(end_date);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
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
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          for (const day of days) {
            // fiyat sabitse direk al değilse tarih arasındaki fiyatları bulalım
            const price = item.constant_price
              ? roomPackagePrices.find(
                  (room: any) => room.hotel_room_package_id === item.id
                )
              : roomPackagePrices.find(
                  (room: any) =>
                    room.hotel_room_package_id === item.id &&
                    room.start_date <= day &&
                    room.end_date >= day
                );
            if (price) {
              item.price = {
                main_price: price.main_price,
                child_price: price.child_price,
              };
            }
            let totalPrice = 0;
            if (adult) {
              totalPrice += price.main_price * adult;
            }
            if (child) {
              totalPrice += price.child_price * child;
            }
            if (!adult && !child) {
              totalPrice += price.main_price;
            }

            item.total_price = totalPrice * nights;
            item.nights = nights;
          }
        } else if (item.constant_price) {
          const price = roomPackagePrices.find(
            (room: any) => room.hotel_room_package_id === item.id
          );
          item.price = {
            main_price: price.main_price,
            child_price: price.child_price,
          };
          let totalPrice = 0;
          if (adult) {
            totalPrice += price.main_price * adult;
          }
          if (child) {
            totalPrice += price.child_price * child;
          }
          if (!adult && !child) {
            totalPrice += price.main_price;
          }
          item.total_price = totalPrice;
          item.nights = 1;
        } else {
          const now = new Date();
          const price = roomPackagePrices.find(
            (room: any) =>
              room.hotel_room_package_id === item.id &&
              room.start_date <= now &&
              room.end_date >= now
          );
          item.price = {
            main_price: price.main_price,
            child_price: price.child_price,
          };
          let totalPrice = 0;
          if (adult) {
            totalPrice += price.main_price * adult;
          }
          if (child) {
            totalPrice += price.child_price * child;
          }
          if (!adult && !child) {
            totalPrice += price.main_price;
          }
          item.total_price = totalPrice;
          item.nights = 1;
        }
      });

      hotelRooms.forEach(async (item: any) => {
        item.roomPackage = roomPackages.find(
          (room: any) => room.hotel_room_id === item.id
        );
      });

      hotel.forEach((item: any) => {
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

     

      if(arrangement === "price_increasing") {
        hotel.sort((a: any, b: any) => a.room.roomPackage.total_price - b.room.roomPackage.total_price);
      } else if(arrangement === "price_decreasing") {
        hotel.sort((a: any, b: any) => b.room.roomPackage.total_price - a.room.roomPackage.total_price);
      } else if(arrangement === "star_increasing") {
        hotel.sort((a: any, b: any) => a.star_rating - b.star_rating);
      } else if(arrangement === "star_decreasing") {
        hotel.sort((a: any, b: any) => b.star_rating - a.star_rating);
      } else if(arrangement === "rating_increasing") {
        hotel.sort((a: any, b: any) => a.average_rating - b.average_rating);
      } else if(arrangement === "rating_decreasing") {
        hotel.sort((a: any, b: any) => b.average_rating - a.average_rating);
      }

      if(isAvailable) {
        hotel = hotel.filter((item: any) => item?.room?.roomPackage?.total_price > 0);
      }

      if(min_price) {
        hotel = hotel.filter((item: any) => item?.room?.roomPackage?.total_price >= min_price);
      }
      if(max_price) {
        hotel = hotel.filter((item: any) => item?.room?.roomPackage?.total_price <= max_price);
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
}
