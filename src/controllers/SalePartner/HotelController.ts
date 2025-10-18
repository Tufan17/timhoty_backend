import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class HotelController {
  async getApprovedHotels(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { location_id } = req.query as { location_id?: string };

      // Get hotels with pivot table data, filtering for admin approval and active status
      const hotels = await knex("hotels")
        .whereNull("hotels.deleted_at")
        .where("hotels.admin_approval", true) // Admin approved
        .where("hotels.status", true) // Active status
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .innerJoin("cities", "hotels.location_id", "cities.id")
        .innerJoin(
          "country_pivots",
          "cities.country_id",
          "country_pivots.country_id"
        )
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("hotel_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .whereNull("cities.deleted_at")
        .whereNull("country_pivots.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("hotel_pivots.deleted_at")
        .modify(function (queryBuilder) {
          if (location_id) {
            queryBuilder.where("hotels.location_id", location_id);
          }
        })
        .select(
          "hotels.id",
          "hotels.location_id",
          "hotels.pool",
          "hotels.private_beach",
          "hotels.transfer",
          "hotels.map_location",
          "hotels.free_age_limit",
          "hotels.solution_partner_id",
          "hotels.star_rating",
          "hotels.status",
          "hotels.admin_approval",
          "hotels.highlight",
          "hotels.comment_count",
          "hotels.average_rating",
          "hotels.refund_days",
          "hotels.created_at",
          "hotels.updated_at",
          "hotel_pivots.name",
          "hotel_pivots.general_info",
          "hotel_pivots.hotel_info",
          "hotel_pivots.refund_policy",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name"
        )
        .orderBy("hotels.created_at", "desc");

      // Format the response with address information
      const formattedHotels = hotels.map((hotel: any) => ({
        ...hotel,
        address: `${hotel.country_name || ""}, ${hotel.city_name || ""}`.trim(),
      }));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
        data: formattedHotels,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
      });
    }
  }

  async getHotelById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { start_date, end_date, adult, child, childAge } = req.query as {
        start_date: string;
        end_date: string;
        adult: number;
        child: number;
        childAge: string; // "1,2,3,4" formatında gelecek
      };

      // childAge'i array'e çevir
      const childAges = childAge ? childAge.split(',').map(age => parseInt(age.trim())) : [];

      // Get hotel info first to get free_age_limit
      const hotel = await knex("hotels")
        .where("hotels.id", id)
        .whereNull("hotels.deleted_at")
        .select("hotels.free_age_limit")
        .first();

      if (!hotel) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
        });
      }

      // Get hotel rooms with pivot table data for names
      const hotelRooms = await knex("hotel_rooms")
        .where("hotel_rooms.hotel_id", id)
        .whereNull("hotel_rooms.deleted_at")
        .innerJoin("hotel_room_pivots", "hotel_rooms.id", "hotel_room_pivots.hotel_room_id")
        .where("hotel_room_pivots.language_code", (req as any).language)
        .whereNull("hotel_room_pivots.deleted_at")
        .select(
          "hotel_rooms.*",
          "hotel_room_pivots.name as room_name",
          "hotel_room_pivots.description as room_description",
          "hotel_room_pivots.refund_policy as room_refund_policy"
        );

      // Get packages for each room with their prices and images
      const roomsWithPackages = await Promise.all(
        hotelRooms.map(async (room: any) => {
          // Her odanın sadece 1 paketi olacak
          const packageData = await knex("hotel_room_packages")
            .where("hotel_room_packages.hotel_room_id", room.id)
            .whereNull("hotel_room_packages.deleted_at")
            .first();

          // Oda resimlerini al
          const roomImages = await knex("hotel_room_images")
            .where("hotel_room_images.hotel_room_id", room.id)
            .whereNull("hotel_room_images.deleted_at")
            .select("hotel_room_images.id", "hotel_room_images.image_url")
            .orderBy("hotel_room_images.created_at", "asc");

          let package_info = null;

          if (packageData) {
            let prices = [];
            let calculatedPrice = null;
            
            if (packageData.constant_price) {
              // Sabit fiyat ise tüm fiyatları al
              prices = await knex("hotel_room_package_prices")
                .where(
                  "hotel_room_package_prices.hotel_room_package_id",
                  packageData.id
                )
                .whereNull("hotel_room_package_prices.deleted_at")
                .leftJoin(
                  "currencies",
                  "hotel_room_package_prices.currency_id",
                  "currencies.id"
                )
                .select(
                  "hotel_room_package_prices.id",
                  "hotel_room_package_prices.main_price",
                  "hotel_room_package_prices.child_price",
                  "hotel_room_package_prices.start_date",
                  "hotel_room_package_prices.end_date",
                  "currencies.code as currency_code",
                  "currencies.symbol as currency_symbol"
                );
              
              // Sabit fiyat için hesaplama yap
              if (prices.length > 0) {
                calculatedPrice = HotelController.calculatePrice(prices[0], packageData, adult, child, childAges, hotel.free_age_limit, start_date, end_date);
              }
            } else {
              // Dinamik fiyat ise seçilen tarih aralığına göre fiyatları filtrele
              const startDate = new Date(start_date);
              const endDate = new Date(end_date);
              
              // Önce tüm fiyatları al
              const allPrices = await knex("hotel_room_package_prices")
                .where(
                  "hotel_room_package_prices.hotel_room_package_id",
                  packageData.id
                )
                .whereNull("hotel_room_package_prices.deleted_at")
                .leftJoin(
                  "currencies",
                  "hotel_room_package_prices.currency_id",
                  "currencies.id"
                )
                .select(
                  "hotel_room_package_prices.id",
                  "hotel_room_package_prices.main_price",
                  "hotel_room_package_prices.child_price",
                  "hotel_room_package_prices.start_date",
                  "hotel_room_package_prices.end_date",
                  "currencies.code as currency_code",
                  "currencies.symbol as currency_symbol"
                )
                .orderBy("hotel_room_package_prices.start_date", "asc");

              // Seçilen tarih aralığı ile kesişen fiyat aralıklarını bul
              prices = allPrices.filter((price: any) => {
                const priceStartDate = new Date(price.start_date);
                const priceEndDate = new Date(price.end_date);
                
                // Tarih aralıkları kesişiyor mu kontrol et
                return priceStartDate <= endDate && priceEndDate >= startDate;
              });

              // Eğer kesişen fiyat bulunamazsa, en yakın fiyatı bul
              if (prices.length === 0) {
                // Seçilen tarihten önceki en son fiyatı bul
                const beforePrices = allPrices.filter((price: any) => {
                  const priceEndDate = new Date(price.end_date);
                  return priceEndDate < startDate;
                }).sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
                
                // Seçilen tarihten sonraki en erken fiyatı bul
                const afterPrices = allPrices.filter((price: any) => {
                  const priceStartDate = new Date(price.start_date);
                  return priceStartDate > endDate;
                }).sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
                
                // En yakın fiyatı seç (önceki varsa onu, yoksa sonrakini)
                if (beforePrices.length > 0) {
                  prices = [beforePrices[0]];
                } else if (afterPrices.length > 0) {
                  prices = [afterPrices[0]];
                }
              }

              // Dinamik fiyat için hesaplama yap
              if (prices.length > 0) {
                calculatedPrice = HotelController.calculatePrice(prices[0], packageData, adult, child, childAges, hotel.free_age_limit, start_date, end_date);
              }
            }

            // Eğer hesaplanan fiyat yoksa bu paketi gösterme
            if (!calculatedPrice) {
              return null;
            }

            package_info = {
              id: packageData.id,
              hotel_room_id: packageData.hotel_room_id,
              discount: packageData.discount,
              total_tax_amount: packageData.total_tax_amount,
              constant_price: packageData.constant_price,
              created_at: packageData.created_at,
              updated_at: packageData.updated_at,
              prices: prices,
              calculated_price: calculatedPrice,
            };
          }

          return {
            ...room,
            package: package_info,
            images: roomImages,
          };
        })
      ); 

      // Null olan paketleri filtrele
      const filteredRooms = roomsWithPackages.filter(room => room !== null && room.package !== null);

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_ROOM_FETCHED_SUCCESS"),
        data: filteredRooms,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
      });
    }
  }

  private static calculatePrice(priceData: any, packageData: any, adult: number, child: number, childAges: number[], freeAgeLimit: number = 0, startDate?: string, endDate?: string) {
    if (!priceData) return null;
 
    const mainPrice = parseFloat(priceData.main_price) || 0;
    const childPrice = parseFloat(priceData.child_price) || 0;
    const discount = parseFloat(packageData.discount) || 0;
    const totalTaxAmount = parseFloat(packageData.total_tax_amount) || 0;

    // Gece sayısını hesapla (başlangıç ve bitiş tarihi arasındaki gün sayısı - 1)
    let nights = 1; // Default 1 gece
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end.getTime() - start.getTime();
      nights = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Gün farkı
    }

    // Yetişkin fiyatı hesapla (gece sayısı ile çarp)
    const adultTotal = mainPrice * adult * nights;
    
    // Çocuk fiyatı hesapla - her çocuk için ayrı ayrı (gece sayısı ile çarp)
    let childTotal = 0;
    let freeChildren = 0;
    let paidChildren = 0;
    
    if (child > 0 && childAges.length > 0) {
      for (let i = 0; i < childAges.length && i < child; i++) {
        const childAge = childAges[i];
        
        if (childAge < freeAgeLimit) {
          // Ücretsiz yaş sınırının altındaysa ücret alınmaz
          freeChildren++;
        } else if (childAge < 18) {
          // 18 yaş altı çocuk fiyatı
          childTotal += childPrice * nights;
          paidChildren++;
        } else {
          // 18 yaş üstü yetişkin fiyatı
          childTotal += mainPrice * nights;
          paidChildren++;
        }
      }
    }
    
    // Toplam fiyat
    const subtotal = adultTotal + childTotal;
    
    // İndirim hesapla
    const discountAmount = (subtotal * discount) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    
    // Vergi hesapla
    const taxAmount = (discountedSubtotal * totalTaxAmount) / 100;
    
    // Final fiyat
    const finalPrice = discountedSubtotal + taxAmount;

    return {
      currency_code: priceData.currency_code,
      currency_symbol: priceData.currency_symbol,
      main_price: mainPrice,
      child_price: childPrice,
      nights: nights,
      adult_count: adult,
      child_count: child,
      child_ages: childAges,
      free_children: freeChildren,
      paid_children: paidChildren,
      free_age_limit: freeAgeLimit,
      subtotal: subtotal,
      discount_percentage: discount,
      discount_amount: discountAmount,
      discounted_subtotal: discountedSubtotal,
      tax_percentage: totalTaxAmount,
      tax_amount: taxAmount,
      final_price: finalPrice,
      price_breakdown: {
        adult_total: adultTotal,
        child_total: childTotal,
        subtotal: subtotal,
        discount_amount: discountAmount,
        discounted_subtotal: discountedSubtotal,
        tax_amount: taxAmount,
        final_price: finalPrice
      }
    };
  }
}
