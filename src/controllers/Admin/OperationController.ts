import { FastifyRequest, FastifyReply } from 'fastify';
import knex from '@/db/knex';
import OperationModel from '@/models/Admin/OperationModel';

export default class OrderController {


    async dataTable(req: FastifyRequest, res: FastifyReply) {
        try {
            const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };
          
            const query = knex("operations")
              .leftJoin("users", "operations.user_id", "users.id")
              .leftJoin("insurance_types", "operations.insurance_type_id", "insurance_types.id")
             
              .where(function () {
                this.where("content", "ilike", `%${search}%`)
                  .orWhere("users.name_surname", "ilike", `%${search}%`)
                  .orWhere("insurance_types.name", "ilike", `%${search}%`);
                if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
                  this.orWhere("status", search.toLowerCase() === "true");
                }
              })
              .select(
                "operations.*",
                "insurance_types.id as insurance_type_id",
                "users.id as user_id",
                "insurance_types.name as insurance_type_name",
                "users.name_surname as user_name"
              )
              .groupBy(
                "operations.id",
                "insurance_types.id",
                "users.id"
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
                insurance_type: {id: item.insurance_type_id, name: item.insurance_type_name},
                user: {id: item.user_id, name: item.user_name},
                content: item.content,
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at,
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
              message: "Operations fetch failed",
            });
          }
          
      }

    async create(req: FastifyRequest, res: FastifyReply) {
        try {
            const { user_id, insurance_type_id, content, status=true } = req.body as { user_id: string, insurance_type_id: string, content: string, status: boolean };
            const operation = await new OperationModel().create({ user_id, insurance_type_id, content, status });
            return res.status(200).send({
                success: true,
                message: "Operation created successfully",
                data: operation
            });
        } catch (error) {
            console.log(error)
        }
    }

}