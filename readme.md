# Uygunsec

Bu proje, PostgreSQL veritabanı ile birlikte Knex.js kullanılarak geliştirilmiştir. Aşağıda veritabanı kurulumu, migration işlemleri ve temel komutlar yer almaktadır.

## Gereksinimler

- Node.js (v14+)
- PostgreSQL
- Knex CLI
- Fastify

## Migration İşlemleri 
 **Oluşturma :** knex migrate:make migration_adi


**Çalıştırma :** knex migrate:latest


**Geri Alma (Rollback) :** knex migrate:rollback


## Seed İşlemleri
**Oluşturma :** knex seed:make seed_adi

**Çalıştırma :** knex seed:run

**Geri Alma :** knex seed:rollback

