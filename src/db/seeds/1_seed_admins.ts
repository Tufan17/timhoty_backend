import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import HashPassword from "@/utils/hashPassword";

export async function seed(knex: Knex): Promise<void> {
  await knex("admins").del();

  await knex("admins").insert([
    {
      id: uuidv4(),
      name_surname: "Süper Admin",
      email: "admin@timhoty.com",
      phone: "00000000001",
      password: "bc2ce654f64b74183f6253d8e772fa6e",
      language: "tr",
      status: true,
    },
  ]);
}
