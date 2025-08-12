import { FastifyRequest, FastifyReply } from 'fastify';
import knex from '@/db/knex';
import OfferModel from '@/models/Admin/OfferModel';


export default class OfferController {

    async dataTable(req: FastifyRequest, res: FastifyReply) {
        try {
            const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };
          
            const query = knex("offers")
              .leftJoin("operations", "offers.operation_id", "operations.id")
              .leftJoin("companies", "offers.company_id", "companies.id")
              .leftJoin("users", "operations.user_id", "users.id")
             
              .where(function () {
                  this.where("companies.name", "ilike", `%${search}%`)
                if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
                  this.orWhere("offers.status", search.toLowerCase() === "true");
                }
              })
              .select(
                "offers.*",
                "operations.id as operation_id",
                "companies.id as company_id",
                "operations.user_id",
                "operations.content as operation_content",
                "companies.name as company_name",
                "users.name_surname as user_name"
              )
              .groupBy(
                "offers.id",
                "operations.id",
                "companies.id",
                "operations.content",
                "companies.name",
                "users.name_surname"
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
                company: {id: item.company_id, name: item.company_name},
                user: {id: item.operation_user_id, name: item.user_name},
                status: item.status,
                start_date: item.start_date,
                end_date: item.end_date,
                price: item.price,
              })),
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
              message: "Offers fetch failed",
              error: error
            });
          }
          
      }


}