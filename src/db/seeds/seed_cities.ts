import { Knex } from "knex";
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
    // Önce mevcut verileri temizle
    await knex("cities").del();

    // Şehirleri ekle
    await knex("cities").insert([
        { id: uuidv4(), name: "İstanbul", number_plate: 34 },
        { id: uuidv4(), name: "Ankara", number_plate: 6 },
        { id: uuidv4(), name: "İzmir", number_plate: 35 },
        { id: uuidv4(), name: "Bursa", number_plate: 16 },
        { id: uuidv4(), name: "Antalya", number_plate: 7 },
        { id: uuidv4(), name: "Adana", number_plate: 1 },
        { id: uuidv4(), name: "Konya", number_plate: 42 },
        // ... diğer şehirler
    ]);
}