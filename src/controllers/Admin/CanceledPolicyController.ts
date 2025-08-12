import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import CanceledPolicyModel from "@/models/Admin/CanceledPolicyModel";
export default class CanceledPolicyController {
 
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { canceled_code, file_url, date, canceled_reason_id } = req.body as any;
      const canceledPolicy = await new CanceledPolicyModel().create({ canceled_code, file_url, date, canceled_reason_id });
      return res.status(200).send({
        success: true,
        message: "Canceled policy created successfully",
        data: canceledPolicy,
      });
    } catch (error) {
      return res.status(500).send({
        success: false, 
        message: "Canceled policy create failed",
        error: error,
      });
    }

  }
  
}
