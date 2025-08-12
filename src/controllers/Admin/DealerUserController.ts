import { FastifyRequest, FastifyReply } from "fastify";
import DealerUserModel from "../../models/Admin/DealerUserModel";
import DealerModel from "../../models/Admin/DealerModel";
import { sendSms } from "../../services/SmsService";
import { sendMail } from "../../services/MailService";
import validateTCKimlikNo from "../../utils/isValidTC";
import LogModel from "@/models/Admin/LogModel";
import knex from "../../db/connection";

export default class DealerUserController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { search="", page=1, limit=10 } = req.query as {
        search: string;
        page: number;
        limit: number;
      };
      const { id } = req.params as { id: string };
      const query = knex("dealer_users")
        .leftJoin("dealers", "dealers.id", "dealer_users.dealer_id")
        .whereNull("dealer_users.deleted_at")
        .where(function () {
          this.where("name_surname", "ilike", `%${search}%`)
            .orWhere("tc_no", "ilike", `%${search}%`)
            .orWhere("gsm", "ilike", `%${search}%`)
            .orWhere("dealers.name", "ilike", `%${search}%`)
            .orWhere("email", "ilike", `%${search}%`);
            if (search && (search.toLowerCase() === 'true' || search.toLowerCase() === 'false')) {
              this.orWhere("status", search.toLowerCase() === 'true');
            }
        }).select("dealer_users.*", "dealers.name as dealer_name", "dealers.id as dealer_id","dealer_users.type as type")
        .groupBy("dealer_users.id", "dealers.name", "dealers.id", "dealer_users.type");

      const countQuery = knex("dealer_users")
        .leftJoin("dealers", "dealers.id", "dealer_users.dealer_id")
        .whereNull("dealer_users.deleted_at")
        .where(function () {
          this.where("name_surname", "ilike", `%${search}%`)
            .orWhere("tc_no", "ilike", `%${search}%`)
            .orWhere("gsm", "ilike", `%${search}%`)
            .orWhere("dealers.name", "ilike", `%${search}%`)
            .orWhere("email", "ilike", `%${search}%`);
            if (search && (search.toLowerCase() === 'true' || search.toLowerCase() === 'false')) {
              this.orWhere("status", search.toLowerCase() === 'true');
            }
        });

      const countResult = await countQuery.countDistinct("dealer_users.id as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const transformedData = data.map((item: any) => {
        return {
          id: item.id,
          name_surname: item.name_surname,
          tc_no: item.tc_no,
          gsm: item.gsm,
          email: item.email,
          status: item.status,
          dealer_id: item.dealer_id,
          dealer_name: item.dealer_name,
          verify: item.verify,
          type: item.type === "manager" ? "Yönetici" : "Çalışan",
          created_at: item.created_at,
        };
      });

      return res.status(200).send({
        success: true,
        message: "Dealer users fetched successfully",
        data: transformedData,
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Dealer user fetch failed",
      });
    }
  }

  async getUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const dealerUser = await new DealerUserModel().first({ id: user.id });
      if (!dealerUser) {
        return res.status(400).send({
          success: false,
          message: "Dealer user not found",
        });
      }

      return res.status(200).send({
        success: true,
        message: "Dealer user fetched successfully",
        data: dealerUser,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer user fetch failed",
      });
    }
  }

  async dealerUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const { search="", page=1, limit=10 } = req.query as {
        search: string;
        page: number;
        limit: number;
      };
      const { id } = req.params as { id: string };
      const query = knex("dealer_users")
        .where("dealer_id", id)
        .whereNull("deleted_at")
        .where(function () {
          this.where("name_surname", "ilike", `%${search}%`)
            .orWhere("tc_no", "ilike", `%${search}%`)
            .orWhere("gsm", "ilike", `%${search}%`)
            .orWhere("email", "ilike", `%${search}%`);
            if (search && (search.toLowerCase() === 'true' || search.toLowerCase() === 'false')) {
              this.orWhere("status", search.toLowerCase() === 'true');
            }
            
        });

      const countQuery = knex("dealer_users")
        .leftJoin("dealers", "dealers.id", "dealer_users.dealer_id")
        .whereNull("dealer_users.deleted_at")
        .where(function () {
          this.where("name_surname", "ilike", `%${search}%`)
            .orWhere("tc_no", "ilike", `%${search}%`)
            .orWhere("gsm", "ilike", `%${search}%`)
            .orWhere("dealers.name", "ilike", `%${search}%`)
            .orWhere("email", "ilike", `%${search}%`);
            if (search && (search.toLowerCase() === 'true' || search.toLowerCase() === 'false')) {
              this.orWhere("status", search.toLowerCase() === 'true');
            }
        });

      const countResult = await countQuery.countDistinct("dealer_users.id as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

        data.map((item: any) => {
          item.type = item.type === "manager" ? "Yönetici" : "Çalışan";
        });

      const transformedData = data.map((item: any) => {
        return {
          id: item.id,
          name_surname: item.name_surname,
          tc_no: item.tc_no,
          gsm: item.gsm,
          email: item.email,
          status: item.status,
          dealer_id: item.dealer_id,
          dealer_name: item.dealer_name,
          verify: item.verify,
          type: item.type === "manager" ? "Yönetici" : "Çalışan",
          created_at: item.created_at,
        };
      });

      return res.status(200).send({
        success: true,
        message: "Dealer users fetched successfully",
        data: transformedData,
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Dealer user fetch failed",
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name_surname, tc_no, gsm, email, password, dealer_id, type } =
        req.body as {
          name_surname: string;
          tc_no: string;
          gsm: string;
          email: string;
          password: string;
          dealer_id: number;
          type: string;
          status: boolean;
          verify: boolean;
        };

      if (!["manager", "user"].includes(type)) {
        return res.status(400).send({
          success: false,
          message: "Invalid type",
        });
      }

      const dealer = await new DealerModel().exists({ id: dealer_id });

      if (!dealer) {
        return res.status(400).send({
          success: false,
          message: "Dealer not found",
        });
      }

      if (!validateTCKimlikNo(tc_no)) {
        return res.status(400).send({
          success: false,
          message: "Invalid TC number",
        });

      }
      const dealerUser = await new DealerUserModel().exists({ email: email });

      if (dealerUser) {
        return res.status(400).send({
          success: false,
          message: "Dealer user already exists",
        });
      }

      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

      await sendSms(gsm, smsCode);
      await sendMail(email, "Dealer user created", smsCode);

      await new DealerUserModel().create({
        name_surname,
        tc_no,
        gsm,
        email,
        password,
        status: true,
        dealer_id,
        type,
        verify: false,
        otp_code: smsCode,
        otp_code_expires_at: new Date(Date.now() + 1000 * 60 * 5),
      });

      const newDealerUser: any = await new DealerUserModel().first({
        name_surname,
        tc_no,
        gsm,
        email,
        dealer_id,
        type,
      });
      await new LogModel().createLog(
        req.user,
        "create",
        "dealer_users",
        newDealerUser
      );
      return res.status(201).send({
        success: true,
        message: "Dealer user created successfully",
        data: newDealerUser,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Dealer user creation failed",
      });
    }
  }

  async verify(req: FastifyRequest, res: FastifyReply) {
    try {
      const { dealer_user_id, otp_code } = req.body as {
        dealer_user_id: string;
        otp_code: string;
      };

      const dealerUser = await new DealerUserModel().first({
        id: dealer_user_id,
      });

      if (!dealerUser) {
        return res.status(400).send({
          success: false,
          message: "Dealer user not found",
        });
      }

      if (
        dealerUser.otp_code_expires_at &&
        dealerUser.otp_code_expires_at < new Date()
      ) {
        return res.status(400).send({
          success: false,
          message: "OTP code expired",
        });
      }

      if (dealerUser.otp_code !== otp_code) {
        return res.status(400).send({
          success: false,
          message: "OTP code is incorrect",
        });
      }

      await new DealerUserModel().update(dealer_user_id, {
        verify: true,
        otp_code_expires_at: null,
      });

      return res.status(200).send({
        success: true,
        message: "Dealer user verified successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer user verification failed",
      });
    }
  }

  async resendOtp(req: FastifyRequest, res: FastifyReply) {
    try {
      const { dealer_user_id } = req.body as {
        dealer_user_id: string;
      };

      const dealerUser = await new DealerUserModel().first({
        id: dealer_user_id,
      });

      if (!dealerUser) {
        return res.status(400).send({
          success: false,
          message: "Dealer user not found",
        });
      }

      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

      await sendSms(dealerUser.gsm, smsCode);
      await sendMail(dealerUser.email, "Dealer user created", smsCode);

      await new DealerUserModel().update(dealer_user_id, {
        otp_code: smsCode,
        otp_code_expires_at: new Date(Date.now() + 1000 * 60 * 5),
      });

      return res.status(200).send({
        success: true,
        message: "Dealer user OTP resend successfully",
      });
    } catch (error) {
      return res.status(500).send({
        message: "Dealer user OTP resend failed",
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name_surname, tc_no, gsm, email, password, dealer_id } =
        req.body as {
          name_surname?: string;
          tc_no?: string;
          gsm?: string;
          email?: string;
          password?: string;
          dealer_id?: string;
        };

      const dealerUser = await new DealerUserModel().first({ id: id });

      if (!dealerUser) {
        return res.status(400).send({
          success: false,
          message: "Dealer user not found",
        });
      }

      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

      await sendSms(dealerUser.gsm, smsCode);
      await sendMail(dealerUser.email, "Dealer user updated", smsCode);


      const body = {
        name_surname: name_surname || dealerUser.name_surname,
        tc_no: tc_no || dealerUser.tc_no,
        gsm: gsm || dealerUser.gsm,
        email: email || dealerUser.email,
        password: password || dealerUser.password,
        dealer_id: dealer_id || dealerUser.dealer_id,
        otp_code: smsCode,
        otp_code_expires_at: new Date(Date.now() + 1000 * 60 * 5),
      };

      await new DealerUserModel().update(id, body);
      await new LogModel().createLog(
        req.user,
        "update",
        "dealer_users",
        dealerUser
      );
      return res.status(200).send({
        success: true,
        message: "Dealer user updated successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer user update failed",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const dealerUser = await new DealerUserModel().first({ id: id });
      if (!dealerUser) {
        return res.status(400).send({
          success: false,
          message: "Dealer user not found",
        });
      }
      await new DealerUserModel().delete(id);
      await new LogModel().createLog(
        req.user,
        "delete",
        "dealer_users",
        dealerUser
      );
      return res.status(200).send({
        success: true,
        message: "Dealer user deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer user deletion failed",
      });
    }
  }
}
