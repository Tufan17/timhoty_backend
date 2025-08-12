import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class AgreementController {
    async dataTable(req: FastifyRequest, res: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const { limit, page, search } = req.query as {
                limit: number;
                page: number;
                search: string;
              };
              
              const limitNumber = Number(limit) || 10; // Default to 10 if not a number
              const pageNumber = Number(page) || 1; // Default to 1 if not a number
              
              const query = knex("agreements")
              .where("agreements.dealer_id", id)
              .whereNull("agreements.deleted_at")
              .leftJoin("dealers", "agreements.dealer_id", "dealers.id")
              .leftJoin("receipts", "agreements.receipt_id", "receipts.id")
              .leftJoin("admins", "agreements.admin_id", "admins.id")
              .select(
                "agreements.*",
                "dealers.id as dealer_id",
                "dealers.name as dealer_name",
                "receipts.id as receipt_id",
                "receipts.fileUrl as receipt_fileUrl",
                "admins.id as admin_id",
                "admins.name_surname as admin_name",
              );
      
            const countResult = await query
              .clone()
              .clearSelect()
              .clearOrder()
              .countDistinct("agreements.id as total")
              .first();
      
            const total = Number(countResult?.total ?? 0);
            const totalPages = Math.ceil(total / limitNumber);
      
            const rawData = await query
              .clone()
              .limit(limitNumber)
              .offset((pageNumber - 1) * limitNumber);
      
            return res.status(200).send({
              success: true,
              message: "Agreement fetched successfully",
              data: rawData.map((item: any) => ({
                id: item.id,
                dealer: {
                  id: item.dealer_id,
                  name: item.dealer_name,
                },
                receipt: {
                  id: item.receipt_id,
                  fileUrl: item.receipt_fileUrl,
                },
                admin: {
                  id: item.admin_id,
                  name: item.admin_name,
                },
                dealer_agreement: item.dealer_agreement,
                admin_agreement: item.admin_agreement,
                created_at: item.created_at,
                updated_at: item.updated_at,
              })),
              total: total,
              totalPages: totalPages,
            });
          } catch (error) {
            console.error('Error fetching agreements:', error);
            return res.status(500).send({
              success: false,
              message: "Internal server error",
              error: (error instanceof Error) ? error.message : 'Unknown error', // Safely handle error message
            });
          }
    }
}