import { FastifyRequest, FastifyReply } from "fastify";
import AuthSalesPartnerService from "@/services/AuthSalesPartnerService";

export default class SalesPartnerAuthController {
  // Sales Partner Login
  async login(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const user = await new AuthSalesPartnerService().login(email, password, req.t);
      return user;
    } catch (error: any) {
      return res.status(400).send({
        success: false,
        message: req.t('SALES_PARTNER.LOGIN_ERROR'),
        error: error.message
      });
    }
  }

  // Sales Partner Logout
  async logout(req: FastifyRequest, res: FastifyReply) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new Error(req.t('SALES_PARTNER.NO_TOKEN_PROVIDED'));
      }
      const user = await new AuthSalesPartnerService().logout(token, req.t);
      return user;
    } catch (error: any) {
      return res.status(400).send(error.message);
    }
  }

  // Sales Partner Profile (Protected route to test middleware)
  async profile(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = (req as any).user;
      return {
        success: true,
        message: req.t('SALES_PARTNER.PROFILE_SUCCESS'),
        user: {
          id: user.id,
          sales_partner_id: user.sales_partner_id,
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
        message: req.t('SALES_PARTNER.PROFILE_ERROR'),
        error: error.message
      });
    }
  }

  // Sales Partner Register
  async register(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, password, nameSalesPartner, phoneSalesPartner, addressSalesPartner, taxOffice, taxNumber, bankName, swiftNumber, accountOwner, iban, nameSurname, country, city } = req.body as {
        email: string;
        password: string;
        nameSalesPartner: string;
        phoneSalesPartner: string;
        addressSalesPartner: string;
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

      const user = await new AuthSalesPartnerService().register(email, password, nameSalesPartner, phoneSalesPartner, addressSalesPartner, taxOffice, taxNumber, bankName, swiftNumber, accountOwner, iban, nameSurname, country, city, language, req.t);
      return user;
    } catch (error: any) {
      return res.status(400).send({
        success: false,
        message: req.t('SALES_PARTNER.REGISTER_ERROR'),
        error: error
      });
    }
  }
}