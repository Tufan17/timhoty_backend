import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CarRentalModel extends BaseModel {
  constructor() {
    super("car_rentals");
  }
  static columns = [
    'id',
    'location_id',
    'solution_partner_id',
    'status',
    'highlight',
    'admin_approval',
    'car_type_id',
    'gear_type_id',
    'user_count',
    'door_count',
    'age_limit',
    'air_conditioning',
    'about_to_run_out',
    'comment_count',
    'average_rating',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getDashboardCarRentals(
    language: string,
    limit: number = 8
  ): Promise<any[]> {
    try {
      // First get highlighted car rentals
      const highlightedCarRentals = await this.getCarRentalsByHighlightStatus(language, true);
      
      // If we need more car rentals, get non-highlighted ones
      if (highlightedCarRentals.length < limit) {
        const remainingCount = limit - highlightedCarRentals.length;
        const additionalCarRentals = await this.getCarRentalsByHighlightStatus(language, false, remainingCount);
        return [...highlightedCarRentals, ...additionalCarRentals];
      }
      
      return highlightedCarRentals.slice(0, limit);
    } catch (error) {
      console.error("Error fetching dashboard car rentals:", error);
      return [];
    }
  }

  private async getCarRentalsByHighlightStatus(
    language: string, 
    isHighlighted: boolean, 
    limit?: number
  ): Promise<any[]> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
      
      const query = knex("car_rentals")
        .whereNull("car_rentals.deleted_at")
        .where("car_rentals.highlight", isHighlighted)
        .innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
        .where("car_rental_pivots.language_code", language)
        .whereNull("car_rental_pivots.deleted_at")
        .leftJoin('car_rental_packages', 'car_rentals.id', 'car_rental_packages.car_rental_id')
        .whereNull('car_rental_packages.deleted_at')
        .leftJoin('car_rental_package_prices', 'car_rental_packages.id', 'car_rental_package_prices.car_rental_package_id')
        .whereNull('car_rental_package_prices.deleted_at')
        .where(function() {
          this.where('car_rental_packages.constant_price', true)
            .orWhere(function() {
              this.where('car_rental_packages.constant_price', false)
                .andWhere(function() {
                  this.where('car_rental_package_prices.start_date', '<=', today)
                    .andWhere(function() {
                      this.whereNull('car_rental_package_prices.end_date')
                        .orWhere('car_rental_package_prices.end_date', '>=', today);
                    });
                });
            });
        })
        .leftJoin('currencies', 'car_rental_package_prices.currency_id', 'currencies.id')
        .leftJoin('currency_pivots', function(this: any) {
          this.on('currencies.id', '=', 'currency_pivots.currency_id')
            .andOn('currency_pivots.language_code', '=', knex.raw('?', [language]));
        })
        .select(
          "car_rentals.id",
          "car_rentals.highlight",
          "car_rentals.average_rating",
          "car_rentals.user_count",
          "car_rentals.door_count",
          "car_rental_pivots.title",
          knex.raw(`
            CASE 
              WHEN car_rental_packages.constant_price = true THEN 
                json_build_object(
                  'main_price', car_rental_package_prices.main_price,
                  'child_price', car_rental_package_prices.child_price,
                  'currency_id', car_rental_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'is_constant', true
                )
              WHEN car_rental_packages.constant_price = false THEN 
                json_build_object(
                  'main_price', car_rental_package_prices.main_price,
                  'child_price', car_rental_package_prices.child_price,
                  'currency_id', car_rental_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'is_constant', false,
                  'start_date', car_rental_package_prices.start_date,
                  'end_date', car_rental_package_prices.end_date
                )
              ELSE NULL
            END as package_price
          `)
        )
        .groupBy(
          "car_rentals.id",
          "car_rentals.highlight",
          "car_rentals.average_rating",
          "car_rentals.user_count",
          "car_rentals.door_count",
          "car_rental_pivots.title",
          "car_rental_packages.constant_price",
          "car_rental_package_prices.main_price",
          "car_rental_package_prices.child_price",
          "car_rental_package_prices.currency_id",
          "currency_pivots.name",
          "currencies.code",
          "car_rental_package_prices.start_date",
          "car_rental_package_prices.end_date"
        )
        .orderBy("car_rentals.created_at", "desc");

      const result = limit ? await query.limit(limit) : await query;
      
      // Paket fiyatlarını temizle ve sadece geçerli olanları al
      return result.map(carRental => {
        if (carRental.package_price) {
          return carRental;
        }
        return {
          ...carRental,
          package_price: null
        };
      });
    } catch (error) {
      console.error("Error fetching dashboard car rentals:", error);
      return [];
    }
  }
}

export default CarRentalModel;
