import { FastifyRequest, FastifyReply } from "fastify";
import AuthUserService from "../services/AuthUserService";

export default class UserAuthController {

    // User register
    async register(req: FastifyRequest, res: FastifyReply) {
        try {
            const { name_surname, email, password, language } = req.body as { name_surname: string, email: string, password: string, language: string };
            const user = await new AuthUserService().register(name_surname, email, password, language, req.t);
            return user;
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }
}
