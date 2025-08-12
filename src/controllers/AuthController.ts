import { FastifyRequest, FastifyReply } from "fastify";
import AuthAdminService from "../services/AuthAdminService";
import AuthDealerService from "../services/AuthDealerService";
import AuthUserService from "../services/AuthUserService";

export default class AuthController {
  // Admin Login
  async loginAdmin(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const user = await new AuthAdminService().login(email, password);
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
      const user = await new AuthAdminService().logout(token);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // Dealer Login
  async loginDealer(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const user = await new AuthDealerService().login(email, password);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // Dealer Logout
  async logoutDealer(req: FastifyRequest, res: FastifyReply) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new Error("No token provided");
      }
      const user = await new AuthDealerService().logout(token);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // User Login
  async loginUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const { tc_number, phone_number, type } = req.body as {
        tc_number: string;
        phone_number: string;
        type: string;
      };
      const user = await new AuthUserService().login(
        tc_number.replace(/\s/g, ""),
        phone_number.replace(/[\s\(\)\-]/g, ""),
        type
      );
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // User Verify Otp
  async verifyOtpUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const { type, code } = req.body as {
        type: string;
        code: string;
      };

      const user = req.user as any;
      const data = await new AuthUserService().verifyOtp(
        user.tc_no,
        user.phone,
        type,
        code
      );
      return data;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // User Register
  async registerUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name_surname, job_id, email } = req.body as {
        name_surname: string;
        job_id: string;
        email: string;
      };
      const user = req.user as any;
      const data = await new AuthUserService().register(user.id, name_surname, job_id, email);
      return data;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // User Resend Code
  async resendCodeUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const { tc_number, phone_number } = req.body as {
        tc_number: string;
        phone_number: string;
      };
      const data = await new AuthUserService().resendCode(
        tc_number.replace(/\s/g, ""),
        phone_number.replace(/[\s\(\)\-]/g, "")
      );
      return data;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // User Logout
  async logoutUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new Error("No token provided");
      }
      const user = await new AuthUserService().logout(token);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }
}
