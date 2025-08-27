import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex("car_type_pivots").del();
  await knex("gear_type_pivots").del();
  await knex("car_types").del();
  await knex("gear_types").del();

  // Insert car types
  const carTypeIds = await knex("car_types").insert([
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
  ]).returning("id");

  // Insert gear types
  const gearTypeIds = await knex("gear_types").insert([
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
    { id: uuidv4() },
  ]).returning("id");

  // Car type pivot data (English, Turkish, Arabic)
  const carTypePivots = [
    // Sedan
    { id: uuidv4(), car_type_id: carTypeIds[0].id, language_code: "en", name: "Sedan" },
    { id: uuidv4(), car_type_id: carTypeIds[0].id, language_code: "tr", name: "Sedan" },
    { id: uuidv4(), car_type_id: carTypeIds[0].id, language_code: "ar", name: "سيدان" },
    
    // SUV
    { id: uuidv4(), car_type_id: carTypeIds[1].id, language_code: "en", name: "SUV" },
    { id: uuidv4(), car_type_id: carTypeIds[1].id, language_code: "tr", name: "SUV" },
    { id: uuidv4(), car_type_id: carTypeIds[1].id, language_code: "ar", name: "سيارة رياضية متعددة الأغراض" },
    
    // Hatchback
    { id: uuidv4(), car_type_id: carTypeIds[2].id, language_code: "en", name: "Hatchback" },
    { id: uuidv4(), car_type_id: carTypeIds[2].id, language_code: "tr", name: "Hatchback" },
    { id: uuidv4(), car_type_id: carTypeIds[2].id, language_code: "ar", name: "هاتشباك" },
    
    // Station Wagon
    { id: uuidv4(), car_type_id: carTypeIds[3].id, language_code: "en", name: "Station Wagon" },
    { id: uuidv4(), car_type_id: carTypeIds[3].id, language_code: "tr", name: "Station Wagon" },
    { id: uuidv4(), car_type_id: carTypeIds[3].id, language_code: "ar", name: "ستيشن واجن" },
    
    // Convertible
    { id: uuidv4(), car_type_id: carTypeIds[4].id, language_code: "en", name: "Convertible" },
    { id: uuidv4(), car_type_id: carTypeIds[4].id, language_code: "tr", name: "Cabrio" },
    { id: uuidv4(), car_type_id: carTypeIds[4].id, language_code: "ar", name: "كابريوليه" },
    
    // Coupe
    { id: uuidv4(), car_type_id: carTypeIds[5].id, language_code: "en", name: "Coupe" },
    { id: uuidv4(), car_type_id: carTypeIds[5].id, language_code: "tr", name: "Coupe" },
    { id: uuidv4(), car_type_id: carTypeIds[5].id, language_code: "ar", name: "كوبيه" },
    
    // Pickup Truck
    { id: uuidv4(), car_type_id: carTypeIds[6].id, language_code: "en", name: "Pickup Truck" },
    { id: uuidv4(), car_type_id: carTypeIds[6].id, language_code: "tr", name: "Kamyonet" },
    { id: uuidv4(), car_type_id: carTypeIds[6].id, language_code: "ar", name: "شاحنة بيك أب" },
    
    // Van
    { id: uuidv4(), car_type_id: carTypeIds[7].id, language_code: "en", name: "Van" },
    { id: uuidv4(), car_type_id: carTypeIds[7].id, language_code: "tr", name: "Minibüs" },
    { id: uuidv4(), car_type_id: carTypeIds[7].id, language_code: "ar", name: "فان" },
  ];

  // Gear type pivot data (English, Turkish, Arabic)
  const gearTypePivots = [
    // Manual
    { id: uuidv4(), gear_type_id: gearTypeIds[0].id, language_code: "en", name: "Manual" },
    { id: uuidv4(), gear_type_id: gearTypeIds[0].id, language_code: "tr", name: "Manuel" },
    { id: uuidv4(), gear_type_id: gearTypeIds[0].id, language_code: "ar", name: "يدوي" },
    
    // Automatic
    { id: uuidv4(), gear_type_id: gearTypeIds[1].id, language_code: "en", name: "Automatic" },
    { id: uuidv4(), gear_type_id: gearTypeIds[1].id, language_code: "tr", name: "Otomatik" },
    { id: uuidv4(), gear_type_id: gearTypeIds[1].id, language_code: "ar", name: "أوتوماتيكي" },
    
    // Semi-Automatic
    { id: uuidv4(), gear_type_id: gearTypeIds[2].id, language_code: "en", name: "Semi-Automatic" },
    { id: uuidv4(), gear_type_id: gearTypeIds[2].id, language_code: "tr", name: "Yarı Otomatik" },
    { id: uuidv4(), gear_type_id: gearTypeIds[2].id, language_code: "ar", name: "شبه أوتوماتيكي" },
    
    // CVT
    { id: uuidv4(), gear_type_id: gearTypeIds[3].id, language_code: "en", name: "CVT" },
    { id: uuidv4(), gear_type_id: gearTypeIds[3].id, language_code: "tr", name: "CVT" },
    { id: uuidv4(), gear_type_id: gearTypeIds[3].id, language_code: "ar", name: "ناقل حركة متغير مستمر" },
  ];

  // Insert pivot data
  await knex("car_type_pivots").insert(carTypePivots);
  await knex("gear_type_pivots").insert(gearTypePivots);
}
