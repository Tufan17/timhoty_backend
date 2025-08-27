import { FastifyRequest, FastifyReply } from "fastify";
import AuthUserService from "../../services/AuthUserService";

export default class UserAuthController {


    async accessTokenRenew(req: FastifyRequest, res: FastifyReply) {
        try {
            const { refresh_token } = req.body as { refresh_token: string };
            const user = await new AuthUserService().accessTokenRenew(refresh_token);
            if (!user.success) {
                return res.status(400).send({
                    success: false,
                    message: user.message,
                });
            }
            return {
                success: true,
                message: user.message,
                data: {
                    access_token: user.accessToken,
                    refresh_token: user.refreshToken,
                },
            };
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }

    // User login
    async login(req: FastifyRequest, res: FastifyReply) {
        try {
            const { email, password } = req.body as { email: string, password: string };
            const user = await new AuthUserService().login(email, password, req.t);
            if (!user.success) {
                return res.status(400).send({
                    success: false,
                    message: user.message,
                });
            }
            return user;
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }

    // User register
    async register(req: FastifyRequest, res: FastifyReply) {
        try {
            const { name_surname, email, password, language } = req.body as { name_surname: string, email: string, password: string, language: string };
            const user = await new AuthUserService().register(name_surname, email, password, language, req.t);
            if (!user.success) {
                return res.status(400).send({
                    success: false,
                    message: user.message,
                });
            }
            return user;
        } catch (error: any) {
            return res.status(400).send({
                success: false,
                message: error.message,
            });
        }
    }

    // User logout
    async logout(req: FastifyRequest, res: FastifyReply) {
        try {
            const accessToken = req.headers.authorization?.split(" ")[1]!;
            const user = await new AuthUserService().logout(accessToken, req.t);
            return user;
        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }
}
