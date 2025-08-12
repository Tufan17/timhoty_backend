import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class DealerWalletController {
    async dataTable(req: FastifyRequest, res: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { limit, page, search } = req.query as {
                limit: number;
                page: number;
                search: string;
              };
              
              
              const query = knex("dealer_wallets")
              .where("dealer_wallets.dealer_id", id)
              .whereNull("dealer_wallets.deleted_at")
              .leftJoin("policies", "dealer_wallets.policy_id", "policies.id")
              .leftJoin("dealer_users", "dealer_wallets.dealer_user_id", "dealer_users.id")
              .select(
                "dealer_wallets.*",
                "dealer_users.id as dealer_user_id",
                "dealer_users.name_surname as dealer_user_name",
                "policies.id as policy_id",
                "policies.policy_number",
                "policies.start_date",
                "policies.end_date",

              );
      
            const countResult = await query
              .clone()
              .clearSelect()
              .clearOrder()
              .countDistinct("dealer_wallets.id as total")
              .first();
      
            const total = Number(countResult?.total ?? 0);
            const totalPages = Math.ceil(total / Number(limit));
      
            const rawData = await query
              .clone()
              .limit(Number(limit))
              .offset((Number(page) - 1) * Number(limit));
      
            return res.status(200).send({
              success: true,
              message: "Dealer wallet fetched successfully",
              data: rawData.map((item: any) => ({
                id: item.id,
                price: item.price,
                type: item.type,
                policy: {
                  id: item.policy_id,
                  number: item.policy_number,
                  start_date: item.start_date,
                  end_date: item.end_date,
                },
                dealer_user: {
                  id: item.dealer_user_id,
                  name: item.dealer_user_name,
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