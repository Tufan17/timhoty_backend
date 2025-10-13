import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";
import comments from "@/routes/User/comments";

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
        .where("hotels.status", true)
        .where("hotels.admin_approval", true)
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .where("hotel_pivots.language_code", language)
        .whereNull("hotel_pivots.deleted_at")
        .leftJoin('hotel_rooms', function() {
          this.on('hotels.id', '=', 'hotel_rooms.hotel_id')
            .andOnNull('hotel_rooms.deleted_at');
        })
        .leftJoin('hotel_room_packages', function() {
          this.on('hotel_rooms.id', '=', 'hotel_room_packages.hotel_room_id')
            .andOnNull('hotel_room_packages.deleted_at');
        })
        .leftJoin('hotel_room_package_prices', function() {
          this.on('hotel_room_packages.id', '=', 'hotel_room_package_prices.hotel_room_package_id')
            .andOnNull('hotel_room_package_prices.deleted_at');
        })
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
          knex.raw(`
            COALESCE(
              (SELECT hg.image_url 
               FROM hotel_galleries hg 
               INNER JOIN hotel_gallery_pivot hgp ON hg.id = hgp.hotel_gallery_id 
               WHERE hg.hotel_id = hotels.id 
               AND hgp.category = 'Kapak Resmi' 
               AND hgp.language_code = ? 
               AND hg.deleted_at IS NULL 
               AND hgp.deleted_at IS NULL 
               LIMIT 1),
              (SELECT hg.image_url 
               FROM hotel_galleries hg 
               WHERE hg.hotel_id = hotels.id 
               AND hg.deleted_at IS NULL 
               ORDER BY hg.id 
               LIMIT 1)
            ) as photo
          `, [language]),
          knex.raw(`
            json_build_object(
              'main_price', MIN(hotel_room_package_prices.main_price),
              'child_price', MIN(hotel_room_package_prices.child_price),
              'currency_id', (array_agg(hotel_room_package_prices.currency_id))[1],
              'currency_name', MIN(currency_pivots.name),
              'currency_code', MIN(currencies.code),
              'currency_symbol', MIN(currencies.symbol),
              'is_constant', bool_or(hotel_room_packages.constant_price),
              'start_date', MIN(hotel_room_package_prices.start_date),
              'end_date', MIN(hotel_room_package_prices.end_date),
              'discount', MIN(hotel_room_packages.discount)
            ) as package_price
          `)
        )
        .groupBy("hotels.id", "hotels.highlight", "hotels.created_at", "hotel_pivots.name")
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


  getComments(language: string, limit: number = 3,id?:string): Promise<any[]> {
    return knex("comments")
      .where("comments.service_type", "hotel")
      .whereNull("comments.deleted_at")
      .where("comments.language_code", language)
      .modify(qb => {
        if (id) {
          qb.where("comments.service_id", id);
        }
      })
      .leftJoin("users", "comments.user_id", "users.id")
      .leftJoin("hotel_pivots", function() {
        this.on("comments.service_id", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", knex.raw("?", [language]));
      })
      .whereNull("hotel_pivots.deleted_at")
      .select("comments.comment as comment","comments.created_at as created_at", "comments.rating as rating", "users.name_surname as user_name", "users.avatar as user_avatar", "hotel_pivots.name as title")
      .orderBy("comments.created_at", "desc")
      .limit(limit);

  }
}

export default HotelModel;
