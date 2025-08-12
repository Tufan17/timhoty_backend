import { Knex } from "knex";
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
    // Önce mevcut verileri temizle
    await knex("districts").del();

    // İstanbul'un ID'sini al
    const istanbul = await knex("cities").where("name", "İstanbul").first();
    const ankara = await knex("cities").where("name", "Ankara").first();
    const izmir = await knex("cities").where("name", "İzmir").first();

    // İlçeleri ekle
    await knex("districts").insert([
        // İstanbul ilçeleri
        { id: uuidv4(), name: "Kadıköy", city_id: istanbul.id },
        { id: uuidv4(), name: "Beşiktaş", city_id: istanbul.id },
        { id: uuidv4(), name: "Üsküdar", city_id: istanbul.id },
        { id: uuidv4(), name: "Bakırköy", city_id: istanbul.id },
        
        // Ankara ilçeleri
        { id: uuidv4(), name: "Çankaya", city_id: ankara.id },
        { id: uuidv4(), name: "Keçiören", city_id: ankara.id },
        { id: uuidv4(), name: "Mamak", city_id: ankara.id },
        
        // İzmir ilçeleri
        { id: uuidv4(), name: "Karşıyaka", city_id: izmir.id },
        { id: uuidv4(), name: "Bornova", city_id: izmir.id },
        { id: uuidv4(), name: "Konak", city_id: izmir.id },
        // ... diğer ilçeler
    ]);
}