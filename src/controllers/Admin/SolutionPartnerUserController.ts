import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel";
import SolutionPartnerModel from "@/models/SolutionPartnerModel";

export default class SolutionPartnerUserController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        solution_partner_id = "",
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        solution_partner_id: string;
      };
      const query = knex("solution_partner_users")
        .whereNull("solution_partner_users.deleted_at")
        .leftJoin(
          "solution_partners",
          "solution_partners.id",
          "solution_partner_users.solution_partner_id"
        )
        .where(function () {
          this.where(
            "solution_partner_users.name_surname",
            "ilike",
            `%${search}%`
          )
            .orWhere("solution_partner_users.phone", "ilike", `%${search}%`)
            .orWhere("solution_partner_users.email", "ilike", `%${search}%`)
            .orWhere("solution_partners.name", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("solution_partner_users.status", search.toLowerCase() === "true");
          }
          if (solution_partner_id) {
            this.where("solution_partner_users.solution_partner_id", solution_partner_id);
          }
        })
        .select(
          "solution_partner_users.*",
          "solution_partners.name as solution_partner_name"
        )
        .groupBy("solution_partner_users.id", "solution_partners.name");
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
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_FETCHED_SUCCESS"
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
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_FETCHED_ERROR"
        ),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const solution_partner_users = await new SolutionPartnerUserModel().first(
        { id }
      );
      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_FETCHED_SUCCESS"
        ),
        data: solution_partner_users,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_FETCHED_ERROR"
        ),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        solution_partner_id,
        type,
        name_surname,
        phone,
        email,
        password,
        language_code,
        status,
      } = req.body as {
        solution_partner_id: string;
        type: string;
        name_surname: string;
        phone: string;
        email: string;
        password: string;
        language_code: string;
        status: boolean;
      };

      const existingSolutionPartnerUser =
        await new SolutionPartnerUserModel().first({ email });

      if (existingSolutionPartnerUser) {
        return res.status(400).send({
          success: false,
          message: req.t(
            "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_ALREADY_EXISTS"
          ),
        });
      }

      const existingSolutionPartner = await new SolutionPartnerModel().first({
        id: solution_partner_id,
      });

      if (!existingSolutionPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
        });
      }

      const solutionPartnerUser = await new SolutionPartnerUserModel().create({
        solution_partner_id,
        type,
        name_surname,
        phone,
        email,
        password,
        language_code: language_code.toLowerCase() || "en",
        status: status || true,
      });

      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_CREATED_SUCCESS"
        ),
        data: solutionPartnerUser,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_CREATED_ERROR"
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
        type: string;
        name_surname: string;
        phone: string;
        email: string;
        password: string;
        language_code: string;
        status: boolean;
      };

      const existingSolutionPartnerUser =
        await new SolutionPartnerUserModel().first({ id });

      if (!existingSolutionPartnerUser) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_NOT_FOUND"
          ),
        });
      }

      const existingSolutionPartner = await new SolutionPartnerModel().first({
        id: existingSolutionPartnerUser.solution_partner_id,
      });

      if (!existingSolutionPartner) {
        return res.status(404).send({
          success: false,
          message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
        });
      }

      if (email && email !== existingSolutionPartnerUser.email) {
        // check if email is already taken
        const existingSolutionPartnerUserByEmail =
          await new SolutionPartnerUserModel().first({ email });

        if (existingSolutionPartnerUserByEmail) {
          return res.status(400).send({
            success: false,
            message: req.t(
              "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_ALREADY_EXISTS"
            ),
          });
        }
      }

      let body: any = {
        type: type || existingSolutionPartnerUser.type,
        name_surname: name_surname || existingSolutionPartnerUser.name_surname,
        phone: phone || existingSolutionPartnerUser.phone,
        email: email || existingSolutionPartnerUser.email,
        password: password,
        status: status || existingSolutionPartnerUser.status,
        language_code:
          language_code.toLowerCase() ||
          existingSolutionPartnerUser.language_code,
      };

      const updatedSolutionPartnerUser =
        await new SolutionPartnerUserModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_UPDATED_SUCCESS"
        ),
        data: updatedSolutionPartnerUser[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_UPDATED_ERROR"
        ),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingSolutionPartnerUser =
        await new SolutionPartnerUserModel().first({
          id,
        });

      if (!existingSolutionPartnerUser) {
        return res.status(404).send({
          success: false,
          message: req.t(
            "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_NOT_FOUND"
          ),
        });
      }

      await new SolutionPartnerUserModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_DELETED_SUCCESS"
        ),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t(
          "SOLUTION_PARTNER_USER.SOLUTION_PARTNER_USER_DELETED_ERROR"
        ),
      });
    }
  }
}
