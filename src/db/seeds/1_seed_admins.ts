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
      password: HashPassword("123456"),
      language: "tr",
      status: true,
    },
  ]);
}
