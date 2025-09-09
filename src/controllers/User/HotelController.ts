import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

// Helper function to calculate price for date range
async function calculatePriceForDateRange(packageId: string, checkInDate: Date, checkOutDate: Date): Promise<number> {
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
      
      if (currentDate >= periodStart && (!periodEnd || currentDate <= periodEnd)) {
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
      const query = req.query as any;
      const page = query.page || 1;
      const date = query.date;
      const min_price = query.min_price || query['min-price'];
      const max_price = query.max_price || query['max-price'];
      const location_id = query.location_id || query['location-id'];
      const star_rating = query.star_rating || query['star-rating'];
      const average_rating = query.average_rating || query['average-rating'];
      const start_date = query.start_date || query['start-date'];
      const end_date = query.end_date || query['end-date'];

      const limit = 9;
      const language = (req as any).language;

      // For counting, we need to group by hotels.id to avoid SQL error
      const countQuery = knex("hotels")
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .whereNull("hotels.deleted_at")
        .where("hotel_pivots.language_code", language)
        .modify(function(queryBuilder) {
          if (location_id) {
            queryBuilder.where("hotels.location_id", location_id);
          }
          if (star_rating) {
            queryBuilder.where("hotels.star_rating", star_rating);
          }
          if (average_rating) {
            queryBuilder.where("hotels.average_rating", average_rating);
          }
        })
        .groupBy("hotels.id")
        .countDistinct("hotels.id as total");

      // Get the total number of hotels
      const countResult = await countQuery;
      const total = countResult.length;
      const totalPages = Math.ceil(total / limit);

      // Get paginated hotel data
      // Get date from query or use today
      const selectedDate = date
        ? new Date(date)
        : new Date();

      // Parse start and end dates for price calculation
      const checkInDate = start_date ? new Date(start_date) : selectedDate;
      const checkOutDate = end_date ? new Date(end_date) : new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000); // Default: next day

      // Calculate date range for pricing
      // Get hotels as before
      const hotels = await knex("hotels")
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .innerJoin("cities", "hotels.location_id", "cities.id")
        .innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .leftJoin(
          knex("hotel_galleries")
            .select("hotel_galleries.hotel_id", knex.raw("MIN(hotel_galleries.image_url) as image_url"))
            .groupBy("hotel_galleries.hotel_id")
            .as("first_gallery"),
          "hotels.id",
          "first_gallery.hotel_id"
        )
        .whereNull("hotels.deleted_at")
        .where("hotel_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .modify(function(queryBuilder) {
          if (location_id) {
            queryBuilder.where("hotels.location_id", location_id);
          }
          if (star_rating) {
            queryBuilder.where("hotels.star_rating", star_rating);
          }
          if (average_rating) {
            queryBuilder.where("hotels.average_rating", average_rating);
          }
        })
        .groupBy(
          "hotels.id", 
          "hotel_pivots.name", 
          "first_gallery.image_url",
          "country_pivots.name",
          "city_pivots.name"
        )
        .select(
          "hotels.id",
          "hotels.highlight",
          "hotels.star_rating",
          "hotels.average_rating",
          "hotels.comment_count",
          "hotels.refund_days",
          "hotels.pool",
          "hotels.private_beach",
          "hotels.transfer",
          "hotels.map_location",
          "hotels.free_age_limit",
          "hotel_pivots.name as name",
          "first_gallery.image_url as photo",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name"
        )
        .limit(limit)
        .offset((Number(page) - 1) * limit);

      // For each hotel, get the first room and its package price for the selected date
      const data = [];
      for (const hotel of hotels) {
        // Get the first room for the hotel (by id asc)
        const firstRoom = await knex("hotel_rooms")
          .where("hotel_id", hotel.id)
          .whereNull("deleted_at")
          .orderBy("id", "asc")
          .first();

        let price = null;

        if (firstRoom) {
          // Get the first package for the room (by id asc)
          const firstPackage = await knex("hotel_room_packages")
            .where("hotel_room_id", firstRoom.id)
            .whereNull("deleted_at")
            .orderBy("id", "asc")
            .first();

          if (firstPackage) {
            if (firstPackage.constant_price) {
              // If constant price, calculate total for the date range
              const packagePrice = await knex("hotel_room_package_prices")
                .where("hotel_room_package_id", firstPackage.id)
                .whereNull("deleted_at")
                .orderBy("created_at", "asc")
                .first();

              if (packagePrice) {
                // Calculate number of nights
                const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
                price = packagePrice.main_price * nights;
              }
            } else {
              // If not constant price, calculate total for each day in the range
              price = await calculatePriceForDateRange(firstPackage.id, checkInDate, checkOutDate);
            }
          }
        }

        // Apply price filtering if specified
        let shouldIncludeHotel = true;
        
        if (price !== null && (min_price !== undefined || max_price !== undefined)) {
          if (min_price !== undefined && price < Number(min_price)) {
            shouldIncludeHotel = false;
          }
          if (max_price !== undefined && price > Number(max_price)) {
            shouldIncludeHotel = false;
          }
        }
        
        if (shouldIncludeHotel) {
          data.push({
            ...hotel,
            price,
          });
        }
      }

      // Recalculate total and totalPages after filtering
      const filteredTotal = data.length;
      const filteredTotalPages = Math.ceil(filteredTotal / limit);

      return res.status(200).send({
        success: true,
        message: "Hotels fetched successfully",
        data: data,
        limit: limit,
        total: filteredTotal,
        currentPage: Number(page),
        totalPages: filteredTotalPages,
      });
    } catch (error) {
      console.error("Hotels error:", error);
      return res.status(500).send({
        success: false,
        message: "Hotels fetch failed",
      });
    }
  }
}
