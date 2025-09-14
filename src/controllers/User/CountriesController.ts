import { FastifyReply, FastifyRequest } from "fastify";
import knex from "../../db/knex";

export default class UserCountriesController {
    async getAll(req: FastifyRequest, res: FastifyReply) {
        try {
            const countries = await knex("countries").whereNull("deleted_at");
            return res.status(200).send({
                success: true,
                message: "Countries fetched successfully",
                data: countries,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                success: false,
                message: "Error fetching countries",
            });
        }
    }
}