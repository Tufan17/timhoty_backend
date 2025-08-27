import { FastifyRequest, FastifyReply } from "fastify";
import AuthUserService from "../../services/AuthUserService";

export default class UserAuthController {


    async accessTokenRenew(req: FastifyRequest, res: FastifyReply) {
        try {
            const { refreshToken } = req.body as { refreshToken: string };
            const user = await new AuthUserService().accessTokenRenew(refreshToken);
            return user;
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }

    // User login
    async login(req: FastifyRequest, res: FastifyReply) {
        try {
            const { email, password } = req.body as { email: string, password: string };
            const user = await new AuthUserService().login(email, password, req.t);
            return user;
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }

    // User register
    async register(req: FastifyRequest, res: FastifyReply) {
        try {
            const { name_surname, email, password, language, device_name } = req.body as { name_surname: string, email: string, password: string, language: string, device_name: string };
            const user = await new AuthUserService().register(name_surname, email, password, language, device_name, req.t);
            return user;
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }

    // User logout
    async logout(req: FastifyRequest, res: FastifyReply) {
        try {
            const user = await new AuthUserService().logout(req.t);
            return user;
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }
}
