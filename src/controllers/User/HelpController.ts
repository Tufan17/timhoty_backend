import { FastifyRequest, FastifyReply } from "fastify";
import FeedbackModel from "@/models/Admin/FeedbackModel";
class HelpController {
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        return res.status(401).send({
          success: false,
          message: "Unauthorized",
        });
      }
      const { insurance_type_id, message } = req.body as {
        insurance_type_id: string;
        message: string;
      };
      await new FeedbackModel().create({ user_id, insurance_type_id, message });
      const feedback = await new FeedbackModel().first({
        user_id,
        insurance_type_id,
        message,
      });
      return res.status(200).send({
        success: true,
        message: "Feedback başarıyla gönderildi.",
        data: feedback,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Feedback creation failed",
        error: error,
      });
    }
  }

}

export default HelpController;
