import { FastifyRequest, FastifyReply } from 'fastify';
import knex from '@/db/knex';
import NotificationModel from '@/models/Admin/NotificationModel';
export default class NotificationController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
      const baseQuery = knex("notifications")
        .whereNull("deleted_at")
        .andWhere(function () {
          this.where("title", "ilike", `%${search}%`)
            .orWhere("content", "ilike", `%${search}%`);
        });

      const countResult = await baseQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const rawData = await baseQuery
        .clone()
        .select("*")
        .orderBy("created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: "Notifications fetched successfully",
        data: rawData,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { title, content, type } = req.body as { title: string; content: string, type: string };

      const notification = await new NotificationModel().create({ title, content, type });

      return res.status(200).send({
        success: true,
        message: "Notification created successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async findById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const notification = await new NotificationModel().findId(id);
      return res.status(200).send({
        success: true,
        message: "Notification fetched successfully",
        data: notification,
      });
    } catch (error) {
    }
  }
}