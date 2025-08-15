# Uygunsec

Bu proje, PostgreSQL veritabanı ile birlikte Knex.js kullanılarak geliştirilmiştir. Aşağıda veritabanı kurulumu, migration işlemleri ve temel komutlar yer almaktadır.

## Gereksinimler

- Node.js (v14+)
- PostgreSQL
- Knex CLI
- Fastify

## Ortam Değişkenleri (Environment Variables)

Projeyi çalıştırmadan önce `.env` dosyasını oluşturun ve aşağıdaki değişkenleri ayarlayın:

```env
# Veritabanı Konfigürasyonu
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_database_name

# Sunucu Konfigürasyonu
PORT=3005
HOST=0.0.0.0

# Güvenlik
JWT_SECRET=your_jwt_secret_key_here
HASH_ALGORITHM=sha256
HASH_SECRET_KEY=your_hash_secret_key_here

# Google Translate Konfigürasyonu
# Seçenek 1: Service Account Key File (Production için önerilen)
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/your/service-account-key.json

# Seçenek 2: API Key (Development için basit setup)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
```

**Not:** Service account key file veya API key'den birini kullanabilirsiniz. Production ortamlar için service account key file önerilir.

## Migration İşlemleri 
 **Oluşturma :** knex migrate:make migration_adi


**Çalıştırma :** knex migrate:latest


**Geri Alma (Rollback) :** knex migrate:rollback


## Seed İşlemleri
**Oluşturma :** knex seed:make seed_adi

**Çalıştırma :** knex seed:run

**Geri Alma :** knex seed:rollback

