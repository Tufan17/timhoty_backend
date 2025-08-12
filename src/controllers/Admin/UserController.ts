import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import UserModel from "@/models/Admin/UserModel";
import DealerModel from "@/models/Admin/DealerModel";
import JobModel from "@/models/Admin/JobModel";
import LogModel from "@/models/Admin/LogModel";
import { sendSms } from "../../services/SmsService";
import { sendMail } from "../../services/MailService";

export default class UserController {
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { tc_no, phone, name_surname, email, job_id, dealer_id } =
        req.body as {
          name_surname: string;
          tc_no: string;
          email: string;
          phone: string;
          job_id: string;
          dealer_id: string;
        };

      const exitUser = await new UserModel().first({ tc_no });
      if (exitUser) {
        return res.status(400).send({
          success: false,
          message: "User already exists",
        });
      }

      if (job_id) {
        const exitJob = await new JobModel().first({ id: job_id });
        if (!exitJob) {
          return res.status(400).send({
            success: false,
            message: "Job not found",
          });
        }
      }

      if (dealer_id) {
        const exitDealer = await new DealerModel().first({ id: dealer_id });
        if (!exitDealer) {
          return res.status(400).send({
            success: false,
            message: "Dealer not found",
          });
        }
      }

      const exitEmail = await new UserModel().first({ email });
      if (exitEmail) {
        return res.status(400).send({
          success: false,
          message: "Email already exists",
        });
      }

      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

      await sendSms(phone, smsCode);
      await sendMail(email, "User created", smsCode);

      type UserBody = {
        tc_no: string;
        phone: string;
        name_surname: string;
        email: string;
        otp_code: string;
        status: boolean;
        otp_code_expired_at: Date;
        job_id?: string;
        dealer_id?: string;
        verify: boolean;
      };

      let body: UserBody = {
        tc_no,
        phone,
        name_surname,
        email,
        otp_code: smsCode,
        status: false,
        otp_code_expired_at: new Date(Date.now() + 1000 * 60 * 5),
        verify: false,
      };
      if (job_id) {
        body = { ...body, job_id };
      }
      if (dealer_id) {
        body = { ...body, dealer_id };
      }

      await new UserModel().create(body);
      const user = await new UserModel().first({ tc_no });

      await new LogModel().createLog(req.user, "create", "User", user);

      return res.status(200).send({
        success: true,
        data: user,
        message: "User created successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async verify(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id, otp_code } = req.body as {
        id: string;
        otp_code: string;
      };

      const user = await new UserModel().first({ id });
      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }

      if (user.otp_code_expired_at < new Date()) {
        return res.status(400).send({
          success: false,
          message: "OTP code expired",
        });
      }

      if (user.otp_code !== otp_code) {
        return res.status(400).send({
          success: false,
          message: "Invalid OTP code",
        });
      }

      await new UserModel().update(id, {
        otp_code: null,
        otp_code_expired_at: null,
        status: true,
        verify: true,
      });

      return res.status(200).send({
        success: true,
        message: "User verified successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async resendOtp(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const user = await new UserModel().first({ id });
      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }

      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

      await sendSms(user.phone, smsCode);
      await sendMail(user.email, "User created", smsCode);

      await new UserModel().update(id, {
        otp_code: smsCode,
        otp_code_expired_at: new Date(Date.now() + 1000 * 60 * 5),
      });

      return res.status(200).send({
        success: true,
        message: "OTP code sent successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name_surname, email, phone, job_id, dealer_id } = req.body as {
        name_surname: string;
        email: string;
        phone: string;
        job_id: string;
        dealer_id: string;
      };

      const user = await new UserModel().first({ id });
      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }
      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

      await sendSms(phone, smsCode);
      await sendMail(email, "User created", smsCode);

      await new UserModel().update(id, {
        name_surname,
        email,
        phone,
        job_id,
        dealer_id,
        otp_code: smsCode,
        otp_code_expired_at: new Date(Date.now() + 1000 * 60 * 5),
      });

      await new LogModel().createLog(req.user, "update", "User", user);

      return res.status(200).send({
        success: true,
        message: "User updated successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const user = await new UserModel().first({ id });
      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }
      await new UserModel().delete(id);
      await new LogModel().createLog(req.user, "delete", "User", user);

      return res.status(200).send({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const { dealer_id, job_id, limit, page, search } = req.query as {
        dealer_id: string;
        job_id: string;
        limit: number;
        page: number;
        search: string;
      };

      const query = knex("users")
        .whereNull("users.deleted_at")
        .leftJoin("jobs", "users.job_id", "jobs.id")
        .leftJoin("dealers", "users.dealer_id", "dealers.id")
        .select(
          "users.id",
          "users.tc_no",
          "users.name_surname",
          "users.email",
          "users.phone",
          "users.status",
          "users.verify",
          "jobs.name as job_name",
          "dealers.name as dealer_name",
          "users.created_at",
          "users.updated_at",
          "dealers.id as dealer_id",
          "jobs.id as job_id"
        )
        .modify((queryBuilder) => {
          if (search) {
            queryBuilder.where(function () {
              this.where("users.name_surname", "ilike", `%${search}%`)
                .orWhere("users.tc_no", "ilike", `%${search}%`)
                .orWhere("users.email", "ilike", `%${search}%`)
                .orWhere("users.phone", "ilike", `%${search}%`)
                .orWhere("dealers.name", "ilike", `%${search}%`)
                .orWhere("jobs.name", "ilike", `%${search}%`);
            });
          }
        }).orderBy("users.created_at", "desc");

      if (dealer_id) {
        query.where("users.dealer_id", dealer_id);
      }

      if (job_id) {
        query.where("users.job_id", job_id);
      }

      const countResult = await query
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct("users.id as total")
        .first();

      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const rawData = await query
        .clone()
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: "User fetched successfully",
        data: rawData.map((item: any) => ({
          id: item.id,
          tc_no: item.tc_no,
          name_surname: item.name_surname,
          email: item.email,
          phone: item.phone,
          status: item.status,
          verify: item.verify,
          job: {
            id: item.job_id,
            name: item.job_name,
          },
          dealer: {
            id: item.dealer_id,
            name: item.dealer_name,
          },
          created_at: item.created_at,
          updated_at: item.updated_at,
        })),
        total: total,
        totalPages: totalPages,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const user = await knex
        .from("users")
        .where("users.id", id)
        .leftJoin("jobs", "users.job_id", "jobs.id")
        .leftJoin("dealers", "users.dealer_id", "dealers.id")
        .select("users.*", "jobs.name as job_name", "dealers.name as dealer_name","jobs.id as job_id","dealers.id as dealer_id","dealers.address as dealer_address","dealers.phone as dealer_phone","dealers.created_at as dealer_created_at","dealers.updated_at as dealer_updated_at")
        .first();

        const body = {
          id: user.id,
          tc_no: user.tc_no,
          name_surname: user.name_surname,
          email: user.email,
          phone: user.phone,
          status: user.status,
          verify: user.verify,
          job: {
            id: user.job_id,
            name: user.job_name,
          },
          dealer: {
            id: user.dealer_id,
            name: user.dealer_name,
            address: user.dealer_address,
            phone: user.dealer_phone,
            created_at: user.dealer_created_at,
            updated_at: user.dealer_updated_at,
          },
          created_at: user.created_at,
          updated_at: user.updated_at,
        }

        if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }
      return res.status(200).send({
        success: true,
        message: "User fetched successfully",
        data: body,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
