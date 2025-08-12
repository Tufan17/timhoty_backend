import { FastifyRequest, FastifyReply } from "fastify";
import CommunicationPreferenceModel from "@/models/Admin/CommunicationPreferenceModel";

export default class CommunicationPreferenceController {
  async createOrUpdate(req: FastifyRequest, res: FastifyReply) {
    try {
      const { email, sms, push } = req.body as {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized",
      });
    }

    const communicationPreference =
      await new CommunicationPreferenceModel().first({ user_id });
    if (communicationPreference) {
      await new CommunicationPreferenceModel().update(
        communicationPreference.id,
        { email, sms, push }
      );
    
    } else {
      await new CommunicationPreferenceModel().create({
        user_id,
        email,
        sms,
        push,
      });
      
    }

    return res
      .status(200)
      .send({
        success: true,
        message: "Communication preference created successfully",
        data: communicationPreference,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        return res.status(401).send({
          success: false,
          message: "Unauthorized",
        });
      }
      const communicationPreference = await new CommunicationPreferenceModel().first({user_id });
      return res.status(200).send({
        success: true,
        message: "Communication preference fetched successfully",
        data: communicationPreference??{
          email: true,
          sms: true,
          push: true,
        },
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }
}
