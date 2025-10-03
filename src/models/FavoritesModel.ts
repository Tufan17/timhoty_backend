import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class FavoritesModel extends BaseModel {
  constructor() {
    super("favorites");
  }

  static columns = [
    "id",
    "service_type",     // hotel, rental, activity, tour, visa
    "service_id",       // service id
    "user_id",
    "created_at",
    "updated_at",
    "deleted_at",
  ];
  //   eğer favorilerde varsa sil, yoksa ekle
  async toggleFavorite(serviceType: string, serviceId: string, userId: string) {
    const db = serviceType === "hotel" ? "hotels" : 
               serviceType === "car_rental" ? "car_rentals" : 
               serviceType === "activity" ? "activities" : 
               serviceType === "tour" ? "tours" : "visas";

    const existProduct = await knex(db)
      .where("id", serviceId)
      .whereNull("deleted_at")
      .first();
    if (!existProduct) {
      throw new Error("Service not found");
    }

    const favorite = await knex("favorites")
      .where("service_type", serviceType)
      .where("service_id", serviceId)
      .where("user_id", userId)
      .whereNull("deleted_at")
      .first();
    
    if (favorite) {
      // Favori varsa sil
      await knex("favorites")
        .where("id", favorite.id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });
      return { isAdded: false };
    } else {
      // Favori yoksa ekle
      await knex("favorites").insert({
        service_type: serviceType,
        service_id: serviceId,
        user_id: userId,
      });
      return { isAdded: true };
    }
  }

//   tüm favorileri getir servislri ile birlikte getir
  async getAllFavorites(userId: string, language: string) {
    // Fetch all favorites for the user
    const favorites = await knex("favorites")
      .where("user_id", userId)
      .whereNull("deleted_at")
      .select("favorites.*");

    // Group favorites by service_type for easier lookup
    const groupedFavorites: Record<string, any[]> = favorites.reduce((acc: any, favorite: any) => {
      acc[favorite.service_type] = acc[favorite.service_type] || [];
      acc[favorite.service_type].push(favorite);
      return acc;
    }, {});

    // Helper to get service_ids for a type
    const getServiceIds = (type: string) =>
      (groupedFavorites[type] || []).map((favorite: any) => favorite.service_id);

    // Prepare queries only if there are favorites for that type
    const carRentalIds = getServiceIds("car_rental");
    const activityIds = getServiceIds("activity");
    const tourIds = getServiceIds("tour");
    const visaIds = getServiceIds("visa");
    const hotelIds = getServiceIds("hotel");

    // Fetch all service details in parallel, only if there are ids
    const [
      carRentalFavorites,
      activityFavorites,
      tourFavorites,
      visaFavorites,
      hotelFavorites
    ] = await Promise.all([
      carRentalIds.length
        ? knex("car_rentals")
            .whereIn("car_rentals.id", carRentalIds)
            .leftJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
            .where("car_rental_pivots.language_code", language)
            .whereNull("car_rental_pivots.deleted_at")
            .whereNull("car_rentals.deleted_at")
            .select(
              "car_rentals.id",
              "car_rental_pivots.title",
              "car_rental_pivots.general_info as description",
              knex.raw("(SELECT image_url FROM car_rental_galleries WHERE car_rental_id = car_rentals.id AND deleted_at IS NULL LIMIT 1) as photo_url"),
              knex.raw("'car_rental' as service_type")
            )
        : [],
      activityIds.length
        ? knex("activities")
            .whereIn("activities.id", activityIds)
            .leftJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
            .where("activity_pivots.language_code", language)
            .whereNull("activity_pivots.deleted_at")
            .whereNull("activities.deleted_at")
            .select(
              "activities.id",
              "activity_pivots.title",
              "activity_pivots.general_info as description",
              knex.raw("(SELECT image_url FROM activity_galleries WHERE activity_id = activities.id AND deleted_at IS NULL LIMIT 1) as photo_url"),
              knex.raw("'activity' as service_type")
            )
        : [],
      tourIds.length
        ? knex("tours")
            .whereIn("tours.id", tourIds)
            .leftJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
            .where("tour_pivots.language_code", language)
            .whereNull("tour_pivots.deleted_at")
            .whereNull("tours.deleted_at")
            .select(
              "tours.id",
              "tour_pivots.title",
              "tour_pivots.general_info as description",
              knex.raw("(SELECT image_url FROM tour_galleries WHERE tour_id = tours.id AND deleted_at IS NULL LIMIT 1) as photo_url"),
              knex.raw("'tour' as service_type")
            )
        : [],
      visaIds.length
        ? knex("visas")
            .whereIn("visas.id", visaIds)
            .leftJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
            .where("visa_pivots.language_code", language)
            .whereNull("visa_pivots.deleted_at")
            .whereNull("visas.deleted_at")
            .select(
              "visas.id",
              "visa_pivots.title",
              "visa_pivots.general_info as description",
              knex.raw("(SELECT image_url FROM visa_galleries WHERE visa_id = visas.id AND deleted_at IS NULL LIMIT 1) as photo_url"),
              knex.raw("'visa' as service_type")
            )
        : [],
      hotelIds.length
        ? knex("hotels")
            .whereIn("hotels.id", hotelIds)
            .leftJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
            .where("hotel_pivots.language_code", language)
            .whereNull("hotel_pivots.deleted_at")
            .whereNull("hotels.deleted_at")
            .select(
              "hotels.id",
              "hotel_pivots.name as title",
              "hotel_pivots.general_info as description",
              knex.raw("(SELECT image_url FROM hotel_galleries WHERE hotel_id = hotels.id AND deleted_at IS NULL LIMIT 1) as photo_url"),
              knex.raw("'hotel' as service_type")
            )
        : []
    ]);

    // Merge all favorites into a single array
    const allFavorites = [
      ...carRentalFavorites,
      ...activityFavorites,
      ...tourFavorites,
      ...visaFavorites,
      ...hotelFavorites
    ];

    // Map service id/type to created_at for sorting
    const createdAtMap: Record<string, string> = {};
    favorites.forEach((fav: any) => {
      createdAtMap[`${fav.service_type}_${fav.service_id}`] = fav.created_at;
    });

    // Attach created_at to each favorite for sorting
    allFavorites.forEach((fav: any) => {
      fav.created_at = createdAtMap[`${fav.service_type}_${fav.id}`] || null;
    });

    // Sort by created_at descending
    allFavorites.sort((a: any, b: any) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    return allFavorites;
  }
}

export default FavoritesModel;
