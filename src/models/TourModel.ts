import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";
    
class TourModel extends BaseModel {
  constructor() {
    super("tours");
  }
  static columns = [
    'id',
    'solution_partner_id',
    'status',
    'highlight',
    'admin_approval',
    'night_count',
    'day_count',
    'refund_days',
    'user_count',
    'comment_count',
    'average_rating',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getDashboardTours(
    language: string,
    limit: number = 8
  ): Promise<any[]> {
    try {
      // First get highlighted hotels
      const highlightedTours = await this.getToursByHighlightStatus(language, true);
      
      // If we need more hotels, get non-highlighted ones
      if (highlightedTours.length < limit) {
        const remainingCount = limit - highlightedTours.length;
        const additionalTours = await this.getToursByHighlightStatus(language, false, remainingCount);
        return [...highlightedTours, ...additionalTours];
      }
      
      return highlightedTours.slice(0, limit);
    } catch (error) {
      console.error("Error fetching dashboard tours:", error);
      return [];
    }
  }

  private async getToursByHighlightStatus(
    language: string, 
    isHighlighted: boolean, 
    limit?: number
  ): Promise<any[]> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
      
      const query = knex("tours")
        .whereNull("tours.deleted_at")
        .where("tours.highlight", isHighlighted)
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .innerJoin('tour_galleries', 'tours.id', 'tour_galleries.tour_id')
        .whereNull('tour_galleries.deleted_at')
        .leftJoin('tour_packages', 'tours.id', 'tour_packages.tour_id')
        .whereNull('tour_packages.deleted_at')
        .leftJoin('tour_package_prices', 'tour_packages.id', 'tour_package_prices.tour_package_id')
        .whereNull('tour_package_prices.deleted_at')
        .where(function() {
          this.where('tour_packages.constant_price', true)
            .orWhere(function() {
              this.where('tour_packages.constant_price', false)
                .andWhere(function() {
                  this.where('tour_package_prices.start_date', '<=', today)
                    .andWhere(function() {
                      this.whereNull('tour_package_prices.end_date')
                        .orWhere('tour_package_prices.end_date', '>=', today);
                    });
                });
            });
        })
        .leftJoin('currencies', 'tour_package_prices.currency_id', 'currencies.id')
        .leftJoin('currency_pivots', function(this: any) {
          this.on('currencies.id', '=', 'currency_pivots.currency_id')
            .andOn('currency_pivots.language_code', '=', knex.raw('?', [language]));
        })
        .select(
          "tours.id",
          "tours.average_rating",
          "tours.highlight",
          "tours.night_count",
          "tours.day_count",
          "tour_pivots.title",
          "tour_galleries.image_url as photo",
          knex.raw(`
            CASE 
              WHEN tour_packages.constant_price = true THEN 
                json_build_object(
                  'main_price', tour_package_prices.main_price,
                  'child_price', tour_package_prices.child_price,
                  'baby_price', tour_package_prices.baby_price,
                  'currency_id', tour_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'is_constant', true
                )
              WHEN tour_packages.constant_price = false THEN 
                json_build_object(
                  'main_price', tour_package_prices.main_price,
                  'child_price', tour_package_prices.child_price,
                  'baby_price', tour_package_prices.baby_price,
                  'currency_id', tour_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'is_constant', false,
                  'start_date', tour_package_prices.start_date,
                  'end_date', tour_package_prices.end_date
                )
              ELSE NULL
            END as package_price
          `)
        )
        .groupBy(
          "tours.id",
          "tours.average_rating", 
          "tours.highlight",
          "tours.night_count",
          "tours.day_count",
          "tour_pivots.title",
          "tour_galleries.image_url",
          "tour_packages.constant_price",
          "tour_package_prices.main_price",
          "tour_package_prices.child_price",
          "tour_package_prices.baby_price",
          "tour_package_prices.currency_id",
          "currency_pivots.name",
          "currencies.code",
          "tour_package_prices.start_date",
          "tour_package_prices.end_date"
        )
        .orderBy("tours.created_at", "desc");

      const result = limit ? await query.limit(limit) : await query;
      
      // Paket fiyatlarını temizle ve sadece geçerli olanları al
      return result.map(tour => {
        if (tour.package_price) {
          return tour;
        }
        return {
          ...tour,
          package_price: null
        };
      });
    } catch (error) {
      console.error("Error fetching dashboard tours:", error);
      return [];
    }
  }
   
}

export default TourModel;
