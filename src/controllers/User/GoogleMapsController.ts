import { FastifyRequest, FastifyReply } from "fastify";
import GoogleMapsService from "@/services/GoogleMapsService";

export default class GoogleMapsController {
  private googleMapsService: GoogleMapsService | null = null;

  constructor() {
    try {
      this.googleMapsService = new GoogleMapsService();
    } catch (error: any) {
      console.error("GoogleMapsService initialization error:", error.message);
      this.googleMapsService = null;
    }
  }

  private getService(): GoogleMapsService {
    if (!this.googleMapsService) {
      try {
        this.googleMapsService = new GoogleMapsService();
      } catch (error: any) {
        throw new Error("Google Maps servisi başlatılamadı. GOOGLE_MAP_API_KEY environment variable kontrol edin.");
      }
    }
    return this.googleMapsService;
  }

  /**
   * Yer arama endpoint'i
   * GET için query parametreleri veya POST için body'de şu parametreler olmalı:
   * - city: Şehir adı (ZORUNLU - her zaman gönderilmelidir)
   * - query: Arama metni (min 4 karakter, opsiyonel)
   * - latitude: Enlem (opsiyonel, longitude ile birlikte kullanılabilir)
   * - longitude: Boylam (opsiyonel, latitude ile birlikte kullanılabilir)
   * - radius: Arama yarıçapı metre cinsinden (opsiyonel, varsayılan: 5000, sadece lat/lng varsa kullanılır)
   */
  async search(req: FastifyRequest, res: FastifyReply) {
    try {
      // Hem body hem query parametrelerini destekle
      const bodyParams = (req.body || {}) as {
        city?: string;
        query?: string;
        latitude?: number | string;
        longitude?: number | string;
        radius?: number | string;
      };
      
      const queryParams = (req.query || {}) as {
        city?: string;
        query?: string;
        latitude?: string;
        longitude?: string;
        radius?: string;
      };

      // Body veya query'den parametreleri al
      const city = bodyParams?.city || queryParams?.city;
      const query = bodyParams?.query || queryParams?.query;
      const latitude = bodyParams?.latitude || queryParams?.latitude;
      const longitude = bodyParams?.longitude || queryParams?.longitude;
      const radius = bodyParams?.radius || queryParams?.radius;

      // City zorunlu validasyonu
      if (!city || (typeof city === 'string' && city.trim().length === 0)) {
        return res.status(400).send({
          success: false,
          message: "Şehir bilgisi (city) zorunludur.",
        });
      }

      // Latitude ve longitude birlikte olmalı
      if ((latitude && !longitude) || (!latitude && longitude)) {
        return res.status(400).send({
          success: false,
          message: "Latitude ve longitude birlikte gönderilmelidir.",
        });
      }

      // Query validasyonu (eğer varsa min 4 karakter olmalı)
      if (query && typeof query === 'string' && query.trim().length > 0 && query.trim().length < 4) {
        return res.status(400).send({
          success: false,
          message: "Arama metni (query) en az 4 karakter olmalıdır.",
        });
      }

      // String'leri number'a çevir
      const latNum = latitude ? Number(latitude) : undefined;
      const lngNum = longitude ? Number(longitude) : undefined;
      const radiusNum = radius ? Number(radius) : undefined;

      // Header'dan dil bilgisini al (languageMiddleware tarafından set edilir)
      const language = (req as any).language || "tr";
      
      // Google Maps API için dil kodunu dönüştür (tr -> tr, en -> en, diğerleri -> en)
      // Google Maps API desteklediği diller: https://developers.google.com/maps/faq#languagesupport
      const googleLanguageCode = language === "tr" ? "tr" : "en";
      
      // City her zaman zorunlu, lat/lng varsa birlikte kullan
      const cityStr = typeof city === 'string' ? city.trim() : String(city).trim();
      const queryStr = query ? (typeof query === 'string' ? query : String(query)) : undefined;
      
      const result = await this.getService().searchByCity(
        cityStr,
        queryStr,
        latNum,
        lngNum,
        radiusNum,
        googleLanguageCode
      );

      // Sonuçları formatla
      const service = this.getService();
      const formattedResults = result.results.map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        location: {
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
        },
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        types: place.types,
        photos: place.photos?.slice(0, 3).map((photo: any) => ({
          photo_reference: photo.photo_reference,
          photo_url: service.getPhotoUrl(photo.photo_reference, photo.width || 400, photo.height),
          width: photo.width,
          height: photo.height,
        })),
      }));

      return res.status(200).send({
        success: true,
        message: "Yerler başarıyla getirildi",
        data: {
          results: formattedResults,
          total: formattedResults.length,
          status: result.status,
        },
      });
    } catch (error: any) {
      console.error("Google Maps search error:", error);
      return res.status(500).send({
        success: false,
        message: error.message || "Yer arama sırasında bir hata oluştu",
      });
    }
  }

  /**
   * Place detaylarını getirir
   */
  async getDetails(req: FastifyRequest, res: FastifyReply) {
    try {
      const { place_id } = req.params as { place_id: string };

      if (!place_id) {
        return res.status(400).send({
          success: false,
          message: "place_id parametresi gereklidir.",
        });
      }

      // Header'dan dil bilgisini al (languageMiddleware tarafından set edilir)
      const language = (req as any).language || "tr";
      
      // Google Maps API için dil kodunu dönüştür
      const googleLanguageCode = language === "tr" ? "tr" : "en";
      
      const service = this.getService();
      const result = await service.getPlaceDetails(place_id, googleLanguageCode);

      // Photo URL'lerini ekle
      if (result.result?.photos) {
        result.result.photos = result.result.photos.map((photo: any) => ({
          ...photo,
          photo_url: service.getPhotoUrl(photo.photo_reference, photo.width || 400, photo.height),
        }));
      }

      return res.status(200).send({
        success: true,
        message: "Yer detayları başarıyla getirildi",
        data: result.result,
      });
    } catch (error: any) {
      console.error("Google Maps getDetails error:", error);
      return res.status(500).send({
        success: false,
        message: error.message || "Yer detayları getirilirken bir hata oluştu",
      });
    }
  }
}

