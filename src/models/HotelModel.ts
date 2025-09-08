import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class HotelModel extends BaseModel {
  constructor() {
    super("hotels");
  }
  static columns = [
    "id",
    "location_id",
    "pool",
    "private_beach",
    "transfer",
    "map_location",
    "free_age_limit",
    "solution_partner_id",
    "star_rating",
    "status",
    "admin_approval",
    "highlight",
    "comment_count",
    "average_rating",
    "refund_days",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async getDashboardHotels(
    language: string,
    limit: number = 8
  ): Promise<any[]> {
    try {
      // First get highlighted hotels
      const highlightedHotels = await this.getHotelsByHighlightStatus(language, true);
      
      // If we need more hotels, get non-highlighted ones
      if (highlightedHotels.length < limit) {
        const remainingCount = limit - highlightedHotels.length;
        const additionalHotels = await this.getHotelsByHighlightStatus(language, false, remainingCount);
        return [...highlightedHotels, ...additionalHotels];
      }
      
      return highlightedHotels.slice(0, limit);
    } catch (error) {
      console.error("Error fetching dashboard hotels:", error);
      return [];
    }
  }

  private async getHotelsByHighlightStatus(
    language: string, 
    isHighlighted: boolean, 
    limit?: number
  ): Promise<any[]> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
      
      const query = knex("hotels")
        .whereNull("hotels.deleted_at")
        .where("hotels.highlight", isHighlighted)
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .where("hotel_pivots.language_code", language)
        .whereNull("hotel_pivots.deleted_at")
        .innerJoin('hotel_galleries', 'hotels.id', 'hotel_galleries.hotel_id')
        .whereNull('hotel_galleries.deleted_at')
        .leftJoin('hotel_rooms', 'hotels.id', 'hotel_rooms.hotel_id')
        .whereNull('hotel_rooms.deleted_at')
        .leftJoin('hotel_room_packages', 'hotel_rooms.id', 'hotel_room_packages.hotel_room_id')
        .whereNull('hotel_room_packages.deleted_at')
        .leftJoin('hotel_room_package_prices', 'hotel_room_packages.id', 'hotel_room_package_prices.hotel_room_package_id')
        .whereNull('hotel_room_package_prices.deleted_at')
        .where(function() {
          this.where('hotel_room_packages.constant_price', true)
            .orWhere(function() {
              this.where('hotel_room_packages.constant_price', false)
                .andWhere(function() {
                  this.where('hotel_room_package_prices.start_date', '<=', today)
                    .andWhere(function() {
                      this.whereNull('hotel_room_package_prices.end_date')
                        .orWhere('hotel_room_package_prices.end_date', '>=', today);
                    });
                });
            });
        })
        .leftJoin('currencies', 'hotel_room_package_prices.currency_id', 'currencies.id')
        .leftJoin('currency_pivots', function(this: any) {
          this.on('currencies.id', '=', 'currency_pivots.currency_id')
            .andOn('currency_pivots.language_code', '=', knex.raw('?', [language]));
        })
        .select(
          "hotels.id",
          "hotels.highlight",
          "hotel_pivots.name",
          "hotel_galleries.image_url as photo",
          knex.raw(`
            CASE 
              WHEN hotel_room_packages.constant_price = true THEN 
                json_build_object(
                  'main_price', hotel_room_package_prices.main_price,
                  'child_price', hotel_room_package_prices.child_price,
                  'currency_id', hotel_room_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'is_constant', true
                )
              WHEN hotel_room_packages.constant_price = false THEN 
                json_build_object(
                  'main_price', hotel_room_package_prices.main_price,
                  'child_price', hotel_room_package_prices.child_price,
                  'currency_id', hotel_room_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'is_constant', false,
                  'start_date', hotel_room_package_prices.start_date,
                  'end_date', hotel_room_package_prices.end_date
                )
              ELSE NULL
            END as package_price
          `)
        )
        .groupBy(
          "hotels.id",
          "hotels.highlight",
          "hotel_pivots.name",
          "hotel_galleries.image_url",
          "hotel_room_packages.constant_price",
          "hotel_room_package_prices.main_price",
          "hotel_room_package_prices.child_price",
          "hotel_room_package_prices.currency_id",
          "currency_pivots.name",
          "currencies.code",
          "hotel_room_package_prices.start_date",
          "hotel_room_package_prices.end_date"
        )
        .orderBy("hotels.created_at", "desc");

      const result = limit ? await query.limit(limit) : await query;
      
      // Paket fiyatlarını temizle ve sadece geçerli olanları al
      return result.map(hotel => {
        if (hotel.package_price) {
          return hotel;
        }
        return {
          ...hotel,
          package_price: null
        };
      });
    } catch (error) {
      console.error("Error fetching dashboard hotels:", error);
      return [];
    }
  }
}

export default HotelModel;
