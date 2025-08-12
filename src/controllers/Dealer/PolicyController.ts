import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import PolicyModel from "@/models/Dealer/PolicyModel";

export default class OrderController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const query = knex("policies")
        .leftJoin("offers", "policies.offer_id", "offers.id")
        .leftJoin(
          "insurance_types",
          "policies.insurance_type_id",
          "insurance_types.id"
        )
        .leftJoin("users", "policies.user_id", "users.id")
        .leftJoin("dealers", "policies.dealer_id", "dealers.id")
        .leftJoin("companies", "policies.company_id", "companies.id")
        .select(
          "policies.*",
          "insurance_types.name as insurance_type_name",
          "insurance_types.id as insurance_type_id",
          "users.name_surname as user_name",
          "users.id as user_id",
          "dealers.name as dealer_name",
          "dealers.id as dealer_id",
          "companies.name as company_name",
          "companies.id as company_id"
        ).where(function () {
            this.where("policies.policy_number", "ilike", `%${search}%`)
              .orWhere("insurance_types.name", "ilike", `%${search}%`)
              .orWhere("users.name_surname", "ilike", `%${search}%`)
              .orWhereRaw("CAST(policies.start_date AS TEXT) ILIKE ?", [`%${search}%`])
              .orWhereRaw("CAST(policies.end_date AS TEXT) ILIKE ?", [`%${search}%`])
              .orWhere("dealers.name", "ilike", `%${search}%`)
              .orWhere("companies.name", "ilike", `%${search}%`);
          })
        .groupBy(
            "policies.id",
            "insurance_types.id",
            "users.id",
            "dealers.id",
            "companies.id"
          );
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const data = await query
        .clone()
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: "Insurance types fetched successfully",
        data: data.map((item: any) => ({
          id: item.id,
          policy_number: item.policy_number,
          insurance_type: {id: item.insurance_type_id, name: item.insurance_type_name},
          user: {id: item.user_id, name: item.user_name},
          content: item.content,
          status: item.status,
          start_date: item.start_date,
          end_date: item.end_date,
          dealer: {id: item.dealer_id, name: item.dealer_name},
          company: {id: item.company_id, name: item.company_name},
        })),
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Operations fetch failed",
        error: error,
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { policy_number, insurance_type_id, user_id, content, status, start_date, end_date, dealer_id, company_id } = req.body as any;
      const policy = await new PolicyModel().create({ policy_number, insurance_type_id, user_id, content, status, start_date, end_date, dealer_id, company_id });
      return res.status(200).send({
        success: true,
        message: "Policy created successfully",
        data: policy,
      });
    } catch (error) {
      return res.status(500).send({
        success: false, 
        message: "Policy create failed",
        error: error,
      });
    }

  }

  async getPolicyById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const policy = await new PolicyModel().first({ id });
      return res.status(200).send({
        success: true,
        message: "Policy fetched successfully",
        data: policy,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Policy fetch failed",
        error: error,
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { policy_number, insurance_type_id, user_id, content, status, start_date, end_date, dealer_id, company_id } = req.body as any;
      const policy = await new PolicyModel().update(id, { policy_number, insurance_type_id, user_id, content, status, start_date, end_date, dealer_id, company_id });
      return res.status(200).send({
        success: true,
        message: "Policy updated successfully",
        data: policy,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Policy update failed",
        error: error,
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const policy = await new PolicyModel().delete(id);
      return res.status(200).send({
        success: true,
        message: "Policy deleted successfully",
        data: policy,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Policy delete failed",
        error: error,
      });
    }
  }
}
