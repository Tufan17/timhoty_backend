import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class VisaModel extends BaseModel {
  constructor() {
    super("visas");
  }
  static columns = [
    "id",
    "location_id",
    "refund_days",
    "approval_period",
    "status",
    "highlight",
    "solution_partner_id",
    "admin_approval",
    "comment_count",
    "average_rating",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async getDashboardVisas(language: string, limit: number = 4): Promise<any[]> {
    try {
      // First get highlighted visas
      const highlightedVisas = await this.getVisasByHighlightStatus(
        language,
        true
      );

      // If we need more visas, get non-highlighted ones
      if (highlightedVisas.length < limit) {
        const remainingCount = limit - highlightedVisas.length;
        const additionalVisas = await this.getVisasByHighlightStatus(
          language,
          false,
          remainingCount
        );
        return [...highlightedVisas, ...additionalVisas];
      }

      return highlightedVisas.slice(0, limit);
    } catch (error) {
      console.error("Error fetching dashboard visas:", error);
      return [];
    }
  }

  private async getVisasByHighlightStatus(
    language: string,
    isHighlighted: boolean,
    limit?: number
  ): Promise<any[]> {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD formatında bugünün tarihi

      const query = knex("visas")
        .whereNull("visas.deleted_at")
        .where("visas.highlight", isHighlighted)
        .where("visas.status", true)
        .where("visas.admin_approval", true)
        .innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
        .where("visa_pivots.language_code", language)
        .whereNull("visa_pivots.deleted_at")
        .leftJoin("visa_packages", "visas.id", "visa_packages.visa_id")
        .whereNull("visa_packages.deleted_at")
        .leftJoin(
          "visa_package_prices",
          "visa_packages.id",
          "visa_package_prices.visa_package_id"
        )
        .whereNull("visa_package_prices.deleted_at")
        .where(function () {
          this.where("visa_packages.constant_price", true).orWhere(function () {
            this.where("visa_packages.constant_price", false).andWhere(
              function () {
                this.where(
                  "visa_package_prices.start_date",
                  "<=",
                  today
                ).andWhere(function () {
                  this.whereNull("visa_package_prices.end_date").orWhere(
                    "visa_package_prices.end_date",
                    ">=",
                    today
                  );
                });
              }
            );
          });
        })
        .leftJoin(
          "currencies",
          "visa_package_prices.currency_id",
          "currencies.id"
        )
        .leftJoin("currency_pivots", function (this: any) {
          this.on("currencies.id", "=", "currency_pivots.currency_id").andOn(
            "currency_pivots.language_code",
            "=",
            knex.raw("?", [language])
          );
        })
        .leftJoin("visa_galleries", "visas.id", "visa_galleries.visa_id")
        .whereNull("visa_galleries.deleted_at")
        .limit(1)
        .select(
          "visas.id",
          "visas.highlight",
          "visas.average_rating",
          "visas.refund_days",
          "visas.approval_period",
          "visa_pivots.title",
          "visa_galleries.image_url",
          knex.raw(`
            CASE 
              WHEN visa_packages.constant_price = true THEN 
                json_build_object(
                  'main_price', visa_package_prices.main_price,
                  'child_price', visa_package_prices.child_price,
                  'currency_id', visa_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'currency_symbol', currencies.symbol,
                  'is_constant', true
                )
              WHEN visa_packages.constant_price = false THEN 
                json_build_object(
                  'main_price', visa_package_prices.main_price,
                  'child_price', visa_package_prices.child_price,
                  'currency_id', visa_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'currency_code', currencies.code,
                  'currency_symbol', currencies.symbol,
                  'is_constant', false,
                  'start_date', visa_package_prices.start_date,
                  'end_date', visa_package_prices.end_date
                )
              ELSE NULL
            END as package_price
          `)
        )
        .groupBy(
          "visas.id",
          "visas.highlight",
          "visas.average_rating",
          "visas.refund_days",
          "visas.approval_period",
          "visa_pivots.title",
          "visa_packages.constant_price",
          "visa_package_prices.main_price",
          "visa_package_prices.child_price",
          "visa_package_prices.currency_id",
          "currencies.symbol",
          "currency_pivots.name",
          "currencies.code",
          "visa_package_prices.start_date",
          "visa_package_prices.end_date",
          "visa_galleries.image_url"
        )
        .orderBy("visas.created_at", "desc");

      const result = limit ? await query.limit(limit) : await query;

      // Paket fiyatlarını temizle ve sadece geçerli olanları al
      return result.map((visa) => {
        if (visa.package_price) {
          return visa;
        }
        return {
          ...visa,
          package_price: null,
        };
      });
    } catch (error) {
      console.error("Error fetching dashboard visas:", error);
      return [];
    }
  }
  getComments(language: string, limit: number = 3): Promise<any[]> {
    return knex("comments")
      .where("comments.service_type", "visa")
      .whereNull("comments.deleted_at")
      .where("comments.language_code", language)
      .leftJoin("users", "comments.user_id", "users.id")
      .leftJoin("visa_pivots", function () {
        this.on("comments.service_id", "visa_pivots.visa_id").andOn(
          "visa_pivots.language_code",
          knex.raw("?", [language])
        );
      })
      .whereNull("visa_pivots.deleted_at")
      .select(
        "comments.comment as comment",
        "comments.created_at as created_at",
        "comments.rating as rating",
        "users.name_surname as user_name",
        "users.avatar as user_avatar",
        "visa_pivots.title as title"
      )
      .orderBy("comments.created_at", "desc")
      .limit(limit);
  }
}

export default VisaModel;
