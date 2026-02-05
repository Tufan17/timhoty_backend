# Viator API Servisi - Kullanım Kılavuzu

## Yapı

Viator API servisi artık Payment servisi ile aynı modern TypeScript yapısında:

```
src/
├── services/
│   └── ViatorApi/
│       └── index.ts          # Ana servis dosyası
├── controllers/
│   └── v2/
│       └── ViatorController.ts  # Controller
└── routes/
    └── v2/
        └── viator.ts         # Route tanımları
```

## Konfigürasyon

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```bash
VIATOR_API_KEY=your_viator_api_key_here
VIATOR_BASE_URL=https://api.sandbox.viator.com
VIATOR_TIMEOUT=30000
```

## Kullanım

### 1. Controller'da Kullanım (Önerilen)

Controller'lar zaten hazır ve route'lara bağlı. Endpoints:

#### Ürün İşlemleri

- `POST /api/v2/viator/products/search` - Ürün arama
- `GET /api/v2/viator/products/modified?count=5` - Değiştirilmiş ürünler
- `GET /api/v2/viator/products/:productCode` - Ürün detayları
- `POST /api/v2/viator/products/bulk` - Toplu ürün getir

#### Müsaitlik

- `POST /api/v2/viator/availability/check` - Müsaitlik kontrolü
- `GET /api/v2/viator/availability/schedule/:productCode` - Müsaitlik programı

#### Destinasyon ve İncelemeler

- `GET /api/v2/viator/destinations` - Tüm destinasyonlar
- `POST /api/v2/viator/reviews/:productCode` - Ürün yorumları

#### Rezervasyon

- `POST /api/v2/viator/bookings/hold` - Rezervasyon beklet
- `POST /api/v2/viator/bookings/confirm` - Rezervasyon onayla
- `GET /api/v2/viator/bookings/:bookingReference/status` - Rezervasyon durumu
- `POST /api/v2/viator/bookings/:bookingReference/cancel` - Rezervasyon iptali

### 2. Doğrudan Servis Kullanımı

Kendi controller'ınızda veya başka bir yerde kullanmak isterseniz:

```typescript
import { viatorApiService } from "../../services/ViatorApi"
// veya
import { searchProducts, getProduct } from "../../services/ViatorApi"

// Singleton instance ile
const products = await viatorApiService.searchProducts({
	filtering: {
		destination: "77",
	},
	currency: "USD",
	pagination: {
		limit: 10,
	},
})

// Export edilen metodlar ile
const productDetails = await getProduct("productCode123")
```

### 3. Örnek İstekler

#### Ürün Arama

```bash
curl -X POST http://localhost:3000/api/v2/viator/products/search \
  -H "Content-Type: application/json" \
  -d '{
    "filtering": {
      "destination": "77"
    },
    "currency": "USD",
    "pagination": {
      "limit": 10
    }
  }'
```

#### Değiştirilmiş Ürünleri Getir

```bash
curl http://localhost:3000/api/v2/viator/products/modified?count=5
```

#### Destinasyonları Getir

```bash
curl http://localhost:3000/api/v2/viator/destinations
```

#### Ürün Detayı

```bash
curl http://localhost:3000/api/v2/viator/products/PRODUCT_CODE_HERE
```

## Özellikler

✅ **Modern TypeScript** - Tip güvenliği ve IntelliSense desteği
✅ **Singleton Pattern** - Tek bir instance, her yerden erişilebilir
✅ **Export Metodlar** - Hem class hem de bireysel metodlar export edilir
✅ **Hata Yönetimi** - Tutarlı error handling ve logging
✅ **Axios Client** - Otomatik header yönetimi
✅ **Environment Variables** - Güvenli konfigürasyon

## Notlar

- Şu an için type'lar basit tutulmuş (any), ilerleye Viator API dökümanlarına göre detaylandırılabilir
- Tüm servis metodları async/await kullanır
- Hata durumlarında detaylı mesajlar console'a loglanır
- API key ve diğer hassas bilgiler `.env` dosyasında tutulur

## Sonraki Adımlar

İhtiyaç duyduğunuzda:

1. Type definitions ekleyin (`ViatorApi/types.ts`)
2. Request/Response interface'lerini detaylandırın
3. Validation ekleyin (Zod kullanarak)
4. Rate limiting ekleyin
5. Caching mekanizması ekleyin
