import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import AdminModel from "@/models/Admin/AdminModel";
import PermissionModel from "@/models/PermissionModel";
import AdminTokenController from "./AdminTokenController";

export default class AdminController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
      const query = knex("admins")
        .whereNull("admins.deleted_at")
        .where(function () {
          this.where("name_surname", "ilike", `%${search}%`).orWhere(
            "email",
            "ilike",
            `%${search}%`
          );
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("status", search.toLowerCase() === "true");
          }
        });
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
        message: req.t("ADMIN.ADMIN_FETCHED_SUCCESS"),
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
        message: req.t("ADMIN.ADMIN_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const admin = await new AdminModel().first({ id });
      const permissions = await new PermissionModel().getAdminPermissions(id);
      return res.status(200).send({
        success: true,
        message: req.t("ADMIN.ADMIN_FETCHED_SUCCESS"),
        data: { admin, permissions },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ADMIN.ADMIN_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name_surname, email, phone, password, language } = req.body as {
        name_surname: string;
        email: string;
        phone: string;
        password: string;
        language: string;
      };

      const existingAdmin = await new AdminModel().first({ email });

      if (existingAdmin) {
        return res.status(400).send({
          success: false,
          message: req.t("ADMIN.ADMIN_ALREADY_EXISTS"),
        });
      }
      await new AdminModel().create({
        name_surname,
        email,
        phone,
        password,
        language,
        status: true,
      });

      const admin = await new AdminModel().first({ email });

      return res.status(200).send({
        success: true,
        message: req.t("ADMIN.ADMIN_CREATED_SUCCESS"),
        data: admin,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ADMIN.ADMIN_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name_surname, phone, password, language, status } = req.body as {
        name_surname: string;
        phone: string;
        password: string;
        language: string;
        status: boolean;
      };

      const existingAdmin = await new AdminModel().first({ id });

      if (!existingAdmin) {
        return res.status(404).send({
          success: false,
          message: req.t("ADMIN.ADMIN_NOT_FOUND"),
        });
      }

      let body: any = {
        name_surname: name_surname || existingAdmin.name_surname,
        phone: phone || existingAdmin.phone,
        language: language || existingAdmin.language,
        status: status || existingAdmin.status,
        password: password,
      };


      await new AdminModel().update(id, body);

      const updatedAdmin = await new AdminModel().first({ id });
    

      return res.status(200).send({
        success: true,
        message: req.t("ADMIN.ADMIN_UPDATED_SUCCESS"),
        data: updatedAdmin,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ADMIN.ADMIN_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const user = req.user as any;

      if (user.email !== "admin@timhoty.com") {
        return res.status(403).send({
          success: false,
          message: req.t("ADMIN.ADMIN_NOT_AUTHORIZED"),
        });
      }

      const existingAdmin = await new AdminModel().first({ id });

      if (!existingAdmin) {
        return res.status(404).send({
          success: false,
          message: req.t("ADMIN.ADMIN_NOT_FOUND"),
        });
      }

      await new AdminModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("ADMIN.ADMIN_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ADMIN.ADMIN_DELETED_ERROR"),
      });
    }
  }
}
