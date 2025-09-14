import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class FaqModel extends BaseModel {
  constructor() {
    super("faqs");
  }
  static columns = [
    'id', 
    'order',
    'service_type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getDashboardFaqs(
    language: string,
  ): Promise<any[]> {
    try {
      const faqs = await knex("faqs")
        .whereNull("faqs.deleted_at")
        .innerJoin("faq_pivots", "faqs.id", "faq_pivots.faq_id")
        .where("faq_pivots.language_code", language)
        .whereNull("faq_pivots.deleted_at")
        .select(
          "faqs.id",
          "faqs.order",
          "faqs.service_type",
          "faq_pivots.title",
          "faq_pivots.description"
        )
        .orderBy("faqs.order", "asc");


      return faqs;
    } catch (error) {
      console.error("Error fetching dashboard faqs:", error);
      return [];
    }
  }
}

export default FaqModel;
