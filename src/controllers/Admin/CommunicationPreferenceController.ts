import { FastifyRequest, FastifyReply } from "fastify";
import CityModel from "../../models/Admin/CityModel";
import LogModel from "@/models/Admin/LogModel";
import CommunicationPreferenceModel from "@/models/Admin/CommunicationPreferenceModel";

export default class CommunicationPreferenceController {
  async createOrUpdate(req: FastifyRequest, res: FastifyReply) {
    try {
      const { user_id, email, sms, push } = req.body as {
        user_id: string;
        email: boolean;
        sms: boolean;
        push: boolean;
    };

    const communicationPreference =
      await new CommunicationPreferenceModel().first({ user_id });
    if (communicationPreference) {
      await new CommunicationPreferenceModel().update(
        communicationPreference.id,
        { email, sms, push }
      );
      await new LogModel().createLog(
        req.user,
        "update",
        "CommunicationPreference",
        communicationPreference
      );
    } else {
      await new CommunicationPreferenceModel().create({
        user_id,
        email,
        sms,
        push,
      });
      const newCommunicationPreference =
        await new CommunicationPreferenceModel().first({ user_id });
      await new LogModel().createLog(
        req.user,
        "create",
        "CommunicationPreference",
        newCommunicationPreference
      );
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
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
        const communicationPreferences = await new CommunicationPreferenceModel().manyToOne("users", "user_id");
      return res.status(200).send({
        success: true,
        message: "Communication preferences fetched successfully",
        data: communicationPreferences,
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
        const { id } = req.params as { id: string };
      const communicationPreference = await new CommunicationPreferenceModel().first({user_id:id });
      return res.status(200).send({
        success: true,
        message: "Communication preference fetched successfully",
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
}
