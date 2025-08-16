import { FastifyRequest, FastifyReply } from "fastify";
import LogsModel from "@/models/LogModel";
import knex from "../db/knex";
import AdminModel from "@/models/Admin/AdminModel";

// import UserModel from "@/models/Admin/UserModel";
class LogsController {
  
    async findAll(req: FastifyRequest, res: FastifyReply) {
        try {
            const {
              page = 1,
              limit = 10,
              search = "",
            } = req.query as { page: number; limit: number; search: string };
            const query = knex("logs")
              .whereNull("logs.deleted_at")
              .where(function () {
                this.where("name", "ilike", `%${search}%`);
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
          }}


    async findOne(req: FastifyRequest, res: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const log = await new LogsModel().first({ id });

            if (!log) {
                return res.status(404).send({ success: false, message: req.t("LOGS.LOG_FETCHED_ERROR") });
            }

            let user;
            if(log.type==="admin"){
                 user = await new AdminModel().first({ id: log.target_id });
            }

            let data;

            try {
                data = await knex(`${log.target_name}`).where("id", log.target_id).first();
            } catch (error) {
                data = log.data;
            }


            return res.status(200).send({ success: true, data: {log,user,data} });
        } catch (error) {
            return res.status(500).send({ success: false, message: req.t("LOGS.LOG_FETCHED_ERROR") });
        }
    }
 
}

export default LogsController;