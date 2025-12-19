import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import SalesPartnerUserModel from "@/models/SalesPartnerUserModel";
import SalesPartnerModel from "@/models/SalesPartnerModel";

export default class SalesPartnerUserController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sales_partner_id = "",
        status = true,
        } = req.query as {
        page: number;
        limit: number;
        search: string;
        sales_partner_id: string;
        status: boolean;
      };
      console.log(sales_partner_id);
      const query = knex("sales_partner_users")
        .whereNull("sales_partner_users.deleted_at")
        .where("sales_partner_users.status", status)
        .leftJoin(
          "sales_partners",
          "sales_partners.id",
          "sales_partner_users.sales_partner_id"
        );

      // sales_partner_id filtresini callback dışına taşıdık (AND koşulu olmalı)
      if (sales_partner_id) {
        query.where("sales_partner_users.sales_partner_id", sales_partner_id);
      }

      // Search koşulları sadece search dolu olduğunda uygulanmalı
      if (search) {
        query.where(function () {
          this.where(
            "sales_partner_users.name_surname",
            "ilike",
            `%${search}%`
          )
            .orWhere("sales_partner_users.phone", "ilike", `%${search}%`)
            .orWhere("sales_partner_users.email", "ilike", `%${search}%`)
            .orWhere("sales_partner_users.type", "ilike", `%${search}%`)
            .orWhere("sales_partners.name", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("sales_partner_users.status", search.toLowerCase() === "true");
          }
        });
          }

      query
        .select(
          "sales_partner_users.*",
          "sales_partners.name as sales_partner_name"
        )
        .groupBy("sales_partner_users.id", "sales_partners.name");


      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_FETCHED_SUCCESS"
        ),
        data: data,
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
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_FETCHED_ERROR"
        ),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const sales_partner_user = await new SalesPartnerUserModel().first(
        { id }
      );
      
      if (!sales_partner_user) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_USER.SALES_PARTNER_USER_NOT_FOUND"
          ),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_FETCHED_SUCCESS"
        ),
        data: sales_partner_user,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_FETCHED_ERROR"
        ),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        sales_partner_id,
        type,
        name_surname,
        phone,
        email,
        password,
        language_code,
        status,
      } = req.body as {
        sales_partner_id: string;
        type: string;
        name_surname: string;
        phone: string;
        email: string;
        password: string;
        language_code: string;
        status: boolean;
      };

      const existingSalesPartnerUser =
        await new SalesPartnerUserModel().first({ email });

      if (existingSalesPartnerUser) {
        return res.status(400).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_USER.SALES_PARTNER_USER_ALREADY_EXISTS"
          ),
        });
      }

      const existingSalesPartner = await new SalesPartnerModel().first({
        id: sales_partner_id,
      });

      if (!existingSalesPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      const salesPartnerUser = await new SalesPartnerUserModel().create({
        sales_partner_id,
        type,
        name_surname,
        phone,
        email,
        password,
        language_code: language_code ? language_code.toLowerCase() : "en",
        status: status !== undefined ? status : true,
      });

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_CREATED_SUCCESS"
        ),
        data: salesPartnerUser,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_CREATED_ERROR"
        ),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const {
        type,
        name_surname,
        phone,
        email,
        password,
        language_code,
        status,
      } = req.body as {
        type?: string;
        name_surname?: string;
        phone?: string;
        email?: string;
        password?: string;
        language_code?: string;
        status?: boolean;
      };

      const existingSalesPartnerUser =
        await new SalesPartnerUserModel().first({ id });

      if (!existingSalesPartnerUser) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_USER.SALES_PARTNER_USER_NOT_FOUND"
          ),
        });
      }

      const existingSalesPartner = await new SalesPartnerModel().first({
        id: existingSalesPartnerUser.sales_partner_id,
      });

      if (!existingSalesPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        });
      }

      if (email && email !== existingSalesPartnerUser.email) {
        // check if email is already taken
        const existingSalesPartnerUserByEmail =
          await new SalesPartnerUserModel().first({ email });

        if (existingSalesPartnerUserByEmail) {
          return res.status(400).send({
            success: false,
            message: req.t(
              "SALES_PARTNER_USER.SALES_PARTNER_USER_ALREADY_EXISTS"
            ),
          });
        }
      }

      let body: any = {
        type: type || existingSalesPartnerUser.type,
        name_surname: name_surname || existingSalesPartnerUser.name_surname,
        phone: phone || existingSalesPartnerUser.phone,
        email: email || existingSalesPartnerUser.email,
        language_code: language_code ? language_code.toLowerCase() : existingSalesPartnerUser.language_code,
        status: status !== undefined ? status : existingSalesPartnerUser.status,
      };

      // Only update password if provided
      if (password) {
        body.password = password;
      }

      const updatedSalesPartnerUser =
        await new SalesPartnerUserModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_UPDATED_SUCCESS"
        ),
        data: updatedSalesPartnerUser[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_UPDATED_ERROR"
        ),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSalesPartnerUser =
        await new SalesPartnerUserModel().first({
          id,
        });

      if (!existingSalesPartnerUser) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SALES_PARTNER_USER.SALES_PARTNER_USER_NOT_FOUND"
          ),
        });
      }

      await new SalesPartnerUserModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_DELETED_SUCCESS"
        ),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SALES_PARTNER_USER.SALES_PARTNER_USER_DELETED_ERROR"
        ),
      });
    }
  }
}
