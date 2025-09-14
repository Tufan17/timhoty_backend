import { FastifyReply, FastifyRequest } from "fastify";
import knex from "../../db/knex";

export default class UserLanguageController {
    async getAll(req: FastifyRequest, res: FastifyReply) {
        try {
            const languages = await knex("languages").whereNull("deleted_at");
            return res.status(200).send({
                success: true,
                message: "Languages fetched successfully",
                data: languages,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                success: false,
                message: "Error fetching languages",
            });
        }
    }
}