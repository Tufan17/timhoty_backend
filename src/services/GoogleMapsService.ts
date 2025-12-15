import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export default class GoogleMapsService {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/place";

  constructor() {
    this.apiKey = process.env.GOOGLE_MAP_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GOOGLE_MAP_API_KEY environment variable is not set");
    }
  }

  /**
   * Şehir bilgisi ile arama yapar (city her zaman zorunlu)
   * @param city - Şehir adı (örn: "Istanbul") - ZORUNLU
   * @param query - Arama metni (min 4 karakter, opsiyonel)
   * @param latitude - Enlem (opsiyonel, city ile birlikte kullanılabilir)
   * @param longitude - Boylam (opsiyonel, city ile birlikte kullanılabilir)
   * @param radius - Arama yarıçapı (metre, varsayılan: 5000, sadece lat/lng varsa kullanılır)
   * @param languageCode - Dil kodu (varsayılan: "tr")
   * @returns Place sonuçları
   */
  async searchByCity(
    city: string,
    query?: string,
    latitude?: number,
    longitude?: number,
    radius: number = 5000,
    languageCode: string = "tr"
  ): Promise<any> {
    try {
      let searchQuery = city;
      
      // Eğer query varsa ve 4 karakterden fazlaysa, şehir ile birleştir
      if (query && query.trim().length >= 4) {
        searchQuery = `${city} ${query.trim()}`;
      }

      // Eğer lat/lng varsa, Text Search ile location parametresi ekle
      if (latitude && longitude) {
        const response = await axios.get(
          `${this.baseUrl}/textsearch/json`,
          {
            params: {
              query: searchQuery,
              location: `${latitude},${longitude}`,
              radius: radius,
              key: this.apiKey,
              language: languageCode,
            },
          }
        );

        if (response.data.status === "OK" || response.data.status === "ZERO_RESULTS") {
          return {
            success: true,
            results: response.data.results || [],
            status: response.data.status,
          };
        }

        // REQUEST_DENIED hatası için özel mesaj
        if (response.data.status === "REQUEST_DENIED") {
          throw new Error(
            `Google Places API hatası: API key'iniz HTTP referrer kısıtlaması ile oluşturulmuş. ` +
            `Server-side (backend) kullanım için API key'inizin "Application restrictions" kısmını "None" veya "IP addresses" olarak ayarlayın. ` +
            `Google Cloud Console > APIs & Services > Credentials bölümünden API key'inizi düzenleyin.`
          );
        }
        
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || "Unknown error"}`);
      }

      // Lat/lng yoksa sadece city ile arama yap
      const response = await axios.get(
        `${this.baseUrl}/textsearch/json`,
        {
          params: {
            query: searchQuery,
            key: this.apiKey,
            language: languageCode,
          },
        }
      );

      if (response.data.status === "OK" || response.data.status === "ZERO_RESULTS") {
        return {
          success: true,
          results: response.data.results || [],
          status: response.data.status,
        };
      }

      throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || "Unknown error"}`);
    } catch (error: any) {
      console.error("Google Maps searchByCity error:", error);
      throw new Error(
        error.response?.data?.error_message || 
        error.message || 
        "Google Maps API hatası oluştu"
      );
    }
  }

  /**
   * Photo reference'ı görsel URL'ye çevirir
   * @param photoReference - Photo reference
   * @param maxWidth - Maksimum genişlik (varsayılan: 400)
   * @param maxHeight - Maksimum yükseklik (opsiyonel)
   * @returns Photo URL
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400, maxHeight?: number): string {
    const params = new URLSearchParams({
      photo_reference: photoReference,
      key: this.apiKey,
      maxwidth: maxWidth.toString(),
    });

    if (maxHeight) {
      params.append('maxheight', maxHeight.toString());
    }

    return `${this.baseUrl}/photo?${params.toString()}`;
  }

  /**
   * Place detaylarını getirir
   * @param placeId - Place ID
   * @param languageCode - Dil kodu (varsayılan: "tr")
   * @returns Place detayları
   */
  async getPlaceDetails(placeId: string, languageCode: string = "tr"): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/details/json`,
        {
          params: {
            place_id: placeId,
            key: this.apiKey,
            language: languageCode,
            fields: "name,formatted_address,geometry,place_id,types,rating,user_ratings_total,photos,opening_hours,website,international_phone_number",
          },
        }
      );

      if (response.data.status === "OK") {
        return {
          success: true,
          result: response.data.result,
        };
      }

      throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || "Unknown error"}`);
    } catch (error: any) {
      console.error("Google Maps getPlaceDetails error:", error);
      throw new Error(
        error.response?.data?.error_message || 
        error.message || 
        "Google Maps API hatası oluştu"
      );
    }
  }
}

