import { FastifyReply, FastifyRequest } from "fastify";
import knex from "../../db/knex";

export default class UserCurrencyController {
    async getAll(req: FastifyRequest, res: FastifyReply) {
        try {
            const currencies = await knex("currencies").where("is_active", true).whereNull("deleted_at");
            return res.status(200).send({
                success: true,
                message: "Currencies fetched successfully",
                data: currencies,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                success: false,
                message: "Error fetching currencies",
            });
        }
    }
}