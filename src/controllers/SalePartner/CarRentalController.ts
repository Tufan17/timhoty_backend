import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class CarRentalController {
  async getApprovedCarRentals(req: FastifyRequest, res: FastifyReply) {
    try {
      const { location_id } = req.query as { location_id?: string };
      // Get car rentals with pivot table data, filtering for admin approval and active status
      const carRentals = await knex("car_rentals")
        .whereNull("car_rentals.deleted_at")
        .where("car_rentals.admin_approval", true) // Admin approved
        .where("car_rentals.status", true) // Active status
        .innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
        .innerJoin("cities", "car_rentals.location_id", "cities.id")
        .innerJoin(
          "country_pivots",
          "cities.country_id",
          "country_pivots.country_id"
        )
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("car_rental_pivots.language_code", (req as any).language)
        .where("country_pivots.language_code", (req as any).language)
        .where("city_pivots.language_code", (req as any).language)
        .whereNull("cities.deleted_at")
        .whereNull("country_pivots.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("car_rental_pivots.deleted_at")
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("car_rentals.location_id", location_id);
          }
        })
        .select(
          "car_rentals.id",
          "car_rentals.location_id",
          "car_rentals.solution_partner_id",
          "car_rentals.status",
          "car_rentals.admin_approval",
          "car_rentals.highlight",
          "car_rentals.comment_count",
          "car_rentals.average_rating",
          "car_rentals.created_at",
          "car_rentals.updated_at",
          "car_rental_pivots.title as name",
          "car_rental_pivots.general_info",
          "car_rental_pivots.car_info",
          "car_rental_pivots.refund_policy",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name"
        )
        .orderBy("car_rentals.created_at", "desc");

      // Format the response with address information
      const formattedcar_rentals = carRentals.map((carRental: any) => ({
        ...carRental,
        address: `${carRental.country_name || ""}, ${carRental.city_name || ""}`.trim(),
      }));

      return res.status(200).send({
        success: true,
        message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_SUCCESS"),
        data: formattedcar_rentals,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_ERROR"),
      });
    }
  }

  async getCarRentalById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { start_date, end_date, adult } = req.query as {
        start_date: string;
        end_date: string;
        adult: number;
      };


      const carRental = await knex("car_rentals")
        .where("car_rentals.id", id)
        .whereNull("car_rentals.deleted_at")
        .first();

      if (!carRental) {
        return res.status(404).send({
          success: false,
          message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
        });
      }

      const carRentalPackages = await knex("car_rental_packages")
        .where("car_rental_packages.car_rental_id", id)
        .whereNull("car_rental_packages.deleted_at")
        .innerJoin("car_rental_package_pivots", "car_rental_packages.id", "car_rental_package_pivots.car_rental_package_id")
        .where("car_rental_package_pivots.language_code", (req as any).language)
        .whereNull("car_rental_package_pivots.deleted_at")
        .select(
          "car_rental_packages.*",
          "car_rental_package_pivots.name as package_name",
          "car_rental_package_pivots.description as package_description",
          "car_rental_package_pivots.refund_policy as package_refund_policy"
        );

      // Get packages with their prices and images
      const packagesWithData = await Promise.all(
        carRentalPackages.map(async (packageItem: any) => {
          const packageImages = await knex("car_rental_package_images")
            .where("car_rental_package_images.car_rental_package_id", packageItem.id)
            .whereNull("car_rental_package_images.deleted_at")
            .select("car_rental_package_images.id", "car_rental_package_images.image_url")
            .orderBy("car_rental_package_images.created_at", "asc");

          let selectedPrice = null;
          let calculatedPrice = null;
          
          if (packageItem.constant_price) {
            // Sabit fiyat ise sadece bir tane price al
            const prices = await knex("car_rental_package_prices")
              .where(
                "car_rental_package_prices.car_rental_package_id",
                packageItem.id
              )
              .whereNull("car_rental_package_prices.deleted_at")
              .leftJoin(
                "currencies",
                "car_rental_package_prices.currency_id",
                "currencies.id"
              )
              .select(
                "car_rental_package_prices.id",
                "car_rental_package_prices.main_price",
                "car_rental_package_prices.start_date",
                "car_rental_package_prices.end_date",
                "currencies.code as currency_code",
                "currencies.symbol as currency_symbol"
              )
              .first();
            
            selectedPrice = prices;
          } else {
            // Dinamik fiyat ise seçilen tarih aralığına göre price al
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            
            // Seçilen tarih aralığı ile kesişen fiyat aralığını bul
            const matchingPrice = await knex("car_rental_package_prices")
              .where(
                "car_rental_package_prices.car_rental_package_id",
                packageItem.id
              )
              .whereNull("car_rental_package_prices.deleted_at")
              .where(function() {
                this.where(function() {
                  // Tarih aralıkları kesişiyor mu kontrol et
                  this.where("car_rental_package_prices.start_date", "<=", endDate)
                      .andWhere("car_rental_package_prices.end_date", ">=", startDate);
                });
              })
              .leftJoin(
                "currencies",
                "car_rental_package_prices.currency_id",
                "currencies.id"
              )
              .select(
                "car_rental_package_prices.id",
                "car_rental_package_prices.main_price",
                "car_rental_package_prices.start_date",
                "car_rental_package_prices.end_date",
                "currencies.code as currency_code",
                "currencies.symbol as currency_symbol"
              )
              .first();

            selectedPrice = matchingPrice;
          }
          
          // Seçilen price ile hesaplama yap
          if (selectedPrice) {
            calculatedPrice = CarRentalController.calculateSimplePrice(selectedPrice, packageItem, adult || 1, start_date, end_date);
          }

          // Eğer hesaplanan fiyat yoksa bu paketi gösterme
          if (!calculatedPrice) {
            return null;
          }

          return {
            ...packageItem,
            price: selectedPrice,
            calculated_price: calculatedPrice,
            images: packageImages,
          };
        })
      ); 

      // Null olan paketleri filtrele
      const filteredPackages = packagesWithData.filter(packageItem => packageItem !== null);

      return res.status(200).send({
        success: true,
        message: req.t("CAR_RENTAL.CAR_RENTAL_PACKAGE_FETCHED_SUCCESS"),
        data: filteredPackages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_ERROR"),
      });
    }
  }

  private static calculateSimplePrice(priceData: any, packageData: any, adult: number, startDate?: string, endDate?: string) {
    if (!priceData) return null;
 
    const mainPrice = parseFloat(priceData.main_price) || 0;
    const discount = parseFloat(packageData.discount) || 0;
    const totalTaxAmount = parseFloat(packageData.total_tax_amount) || 0;

    // Gün sayısını hesapla (başlangıç ve bitiş tarihi arasındaki gün sayısı)
    let days = 1; // Default 1 gün
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end.getTime() - start.getTime();
      days = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Gün farkı
    }

    // Ana fiyatı hesapla (gün sayısı ile çarp)
    const totalPrice = mainPrice * adult * days;
    
    // İndirim hesapla
    const discountAmount = (totalPrice * discount) / 100;
    const discountedTotal = totalPrice - discountAmount;
    
    // Vergi hesapla
    const taxAmount = (discountedTotal * totalTaxAmount) / 100;
    
    // Final fiyat
    const finalPrice = discountedTotal ;

    return {
      currency_code: priceData.currency_code,
      currency_symbol: priceData.currency_symbol,
      main_price: mainPrice,
      days: days,
      adult_count: adult,
      subtotal: totalPrice,
      discount_percentage: discount,
      discount_amount: discountAmount,
      discounted_subtotal: discountedTotal,
      tax_percentage: totalTaxAmount,
      tax_amount: taxAmount,
      final_price: finalPrice,
      price_breakdown: {
        subtotal: totalPrice,
        discount_amount: discountAmount,
        discounted_subtotal: discountedTotal,
        tax_amount: taxAmount,
        final_price: finalPrice
      }
    };
  }

  async getCarRentalStations(req: FastifyRequest, res: FastifyReply) {
    try {
        const { location_id } = req.params as { location_id: string };
      const language = (req as any).language;

      if (!location_id) {
        return res.status(400).send({
          success: false,
          message: "Location ID is required"
        });
      }

      // Get stations for the specified car rental through car_pickup_delivery table
      // First join car_rentals to get the car rental by location_id, then join car_pickup_delivery
      const stations = await knex("car_rentals")
        .where("car_rentals.location_id", location_id)
        .whereNull("car_rentals.deleted_at")
        .innerJoin("car_pickup_delivery", "car_rentals.id", "car_pickup_delivery.car_rental_id")
        .whereNull("car_pickup_delivery.deleted_at")
        .innerJoin("stations", "car_pickup_delivery.station_id", "stations.id")
        .whereNull("stations.deleted_at")
        .innerJoin("station_pivots", "stations.id", "station_pivots.station_id")
        .where("station_pivots.language_code", language)
        .whereNull("station_pivots.deleted_at")
        .select(
          "stations.id",
          "stations.location_id",
          "stations.solution_partner_id",
          "stations.map_location",
          "stations.status",
          "stations.created_at",
          "stations.updated_at",
          "stations.deleted_at",
          "station_pivots.name"
        )
        .orderBy("stations.created_at", "desc");

      return res.status(200).send({
        success: true,
        message: "Stations fetched successfully",
        data: stations,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAR_RENTAL.CAR_RENTAL_STATIONS_FETCHED_ERROR")
      });
    }
  }
}
