import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class UserWalletController {
    async dataTable(req: FastifyRequest, res: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { limit, page, search } = req.query as {
                limit: number;
                page: number;
                search: string;
              };
              
              const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
              if (!isValidUUID) {
                return res.status(400).send({
                  success: false,
                  message: "Invalid UUID format for user ID",
                });
              }
              
              const query = knex("user_wallets")
              .where("user_wallets.user_id", id)
              .whereNull("user_wallets.deleted_at")
              .leftJoin("policies", "user_wallets.policy_id", "policies.id")
              .leftJoin("insurance_types", "policies.insurance_type_id", "insurance_types.id")
              .select(
                "user_wallets.*",
                "insurance_types.id as insurance_type_id",
                "insurance_types.name as insurance_type_name",
                "policies.id as policy_id",
                "policies.policy_number",
                "policies.start_date",
                "policies.end_date"
              );
      
            const countResult = await query
              .clone()
              .clearSelect()
              .clearOrder()
              .countDistinct("user_wallets.id as total")
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
                point: item.point,
                policy: {
                  id: item.policy_id,
                  number: item.policy_number,
                  start_date: item.start_date,
                  end_date: item.end_date,
                },
                insurance_type: {
                  id: item.insurance_type_id,
                  name: item.insurance_type_name,
                },
                created_at: item.created_at,
                updated_at: item.updated_at,
              })),
              total: total,
              totalPages: totalPages,
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