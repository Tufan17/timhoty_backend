import { FastifyRequest, FastifyReply } from "fastify";
import AuthAdminService from "../services/AuthAdminService";

export default class AdminAuthController {
  // Admin Login
  async loginAdmin(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const user = await new AuthAdminService().login(email, password, req.t);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // Admin Logout
  async logoutAdmin(req: FastifyRequest, res: FastifyReply) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new Error("No token provided");
      }
      const user = await new AuthAdminService().logout(token, req.t);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

}
