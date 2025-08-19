import { FastifyRequest, FastifyReply } from "fastify";
import AuthSolutionPartnerService from "@/services/AuthSolutionPartnerService";

export default class SolutionPartnerAuthController {
  // Solution Partner Login
  async login(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const user = await new AuthSolutionPartnerService().login(email, password, req.t);
      return user;
    } catch (error: any) {
      return res.status(400).send({
        success: false,
        message: req.t('SOLUTION_PARTNER.LOGIN_ERROR'),
        error: error.message
      });
    }
  }

  // Solution Partner Logout
  async logout(req: FastifyRequest, res: FastifyReply) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new Error(req.t('SOLUTION_PARTNER.NO_TOKEN_PROVIDED'));
      }
      const user = await new AuthSolutionPartnerService().logout(token, req.t);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // Solution Partner Profile (Protected route to test middleware)
  async profile(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = (req as any).user;
      return {
        success: true,
        message: req.t('SOLUTION_PARTNER.PROFILE_SUCCESS'),
        user: {
          id: user.id,
          solution_partner_id: user.solution_partner_id,
          name_surname: user.name_surname,
          email: user.email,
          type: user.type,
          language: user.language,
        },
        dbUser: user.dbUser
      };
    } catch (error: any) {
      return res.status(400).send({
        success: false,
        message: req.t('SOLUTION_PARTNER.PROFILE_ERROR'),
        error: error.message
      });
    }
  }

  // Solution Partner Register
  async register(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, password, nameSolutionPartner, phoneSolutionPartner, addressSolutionPartner, taxOffice, taxNumber, bankName, swiftNumber, accountOwner, iban, nameSurname, country, city } = req.body as {
        email: string;
        password: string;
        nameSolutionPartner: string;
        phoneSolutionPartner: string;
        addressSolutionPartner: string;
        taxOffice: string;
        taxNumber: string;
        bankName: string;
        swiftNumber: string;
        accountOwner: string;
        iban: string;
        nameSurname: string;
        country: string;
        city: string;
      };
      const language = req.language || "en";

      const user = await new AuthSolutionPartnerService().register(email, password, nameSolutionPartner, phoneSolutionPartner, addressSolutionPartner, taxOffice, taxNumber, bankName, swiftNumber, accountOwner, iban, nameSurname, country, city, language,   req.t);

      return user;
    } catch (error: any) {
      return res.status(400).send({
        success: false,
        message: req.t('SOLUTION_PARTNER.REGISTER_ERROR'),
        error: error
      });
    }
  }
}
 