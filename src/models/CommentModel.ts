import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CommentModel extends BaseModel {
  constructor() {
    super("comments");
  }

  static columns = [
    "id",
    "service_type",     // hotel, car_rental, activity, tour, visa
    "service_id",       // service id
    "user_id",          // user who made the comment
    "reservation_id",   // reservation id
    "comment",          // comment text
    "rating",           // rating (float)
    "language_code",    // language of the comment
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  // Get comments for a specific service
  async getCommentsByService(serviceType: string, serviceId: string, language?: string) {
    const query = knex("comments")
      .leftJoin("users", "comments.user_id", "users.id")
      .where("comments.service_type", serviceType)
      .where("comments.service_id", serviceId)
      .whereNull("comments.deleted_at")
      .whereNull("users.deleted_at")
      .select(
        "comments.*",
        "users.name_surname as user_name",
        "users.avatar as user_avatar"
      )
      .orderBy("comments.created_at", "desc");

    if (language) {
      query.where("comments.language_code", language);
    }

    return await query;
  }

  // Get average rating for a service
  async getAverageRating(serviceType: string, serviceId: string) {
    const result = await knex("comments")
      .where("service_type", serviceType)
      .where("service_id", serviceId)
      .whereNull("deleted_at")
      .select("*");

    const totalComments = result.length;
    const averageRating =
      totalComments > 0
        ? parseFloat(
            (result.reduce((acc: any, curr: any) => acc + curr.rating, 0) / totalComments).toFixed(2)
          )*2
        : 0;

    return {
      average_rating: averageRating,
      total_comments: totalComments
    };
  }

  // Get rating distribution for a service
  async getRatingDistribution(serviceType: string, serviceId: string) {
    const results = await knex("comments")
      .where("service_type", serviceType)
      .where("service_id", serviceId)
      .whereNull("deleted_at")
      .select("rating")
      .count("id as count")
      .groupBy("rating")
      .orderBy("rating", "desc");

    return results;
  }

  // Check if user has already commented on a service
  async hasUserCommented(reservationId: string,   serviceType: string, serviceId: string, userId: string) {
    const comment = await knex("comments")
      .where("reservation_id", reservationId)
      .where("service_type", serviceType)
      .where("service_id", serviceId)
      .where("user_id", userId)
      .whereNull("deleted_at")
      .first();

    return !!comment;
  }

  // Get user's comment for a specific service
  async getUserComment(serviceType: string, serviceId: string, userId: string) {
    return await knex("comments")
      .where("service_type", serviceType)
      .where("service_id", serviceId)
      .where("user_id", userId)
      .whereNull("deleted_at")
      .first();
  }

  // Get recent comments with user information
  async getRecentComments(limit: number = 10, language?: string) {
    const query = knex("comments")
      .leftJoin("users", "comments.user_id", "users.id")
      .whereNull("comments.deleted_at")
      .whereNull("users.deleted_at")
      .select(
        "comments.*",
        "users.name_surname as user_name",
        "users.avatar as user_avatar"
      )
      .orderBy("comments.created_at", "desc")
      .limit(limit);

    if (language) {
      query.where("comments.language_code", language);
    }

    return await query;
  }
}

export default CommentModel;
