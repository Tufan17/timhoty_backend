import UserModel from "@/models/UserModel";
import { FastifyRequest, FastifyReply } from "fastify";
import UserNotificationModel from "@/models/UserNotificationModel";

class UserController {
  async read(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const user = await new UserModel().findId(id);
      if (!user) {
        return {
          success: false,
          message: "Kullanıcı bulunamadı",
        };
      }
      return {
        success: true,
        message: "Kullanıcı başarıyla okundu",
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body as any;
      console.log(updateData);

      // Check if user exists
      const existingUser = await new UserModel().findId(id);
      if (!existingUser) {
        return {
          success: false,
          message: "Kullanıcı bulunamadı",
        };
      }

      // Update only the fields that are provided
      const updatedUser = await new UserModel().update(id, updateData);

      return {
        success: true,
        message: "Kullanıcı başarıyla güncellendi",
        data: updatedUser[0], // BaseModel.update returns an array
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getAllNotifications(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const language = (req as any).language;
      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const notifications = await new UserNotificationModel().userNotifications(userId, language);
      
      return res.status(200).send({
        success: true,
        message: "Notifications fetched successfully",
        data: notifications,
      });
    } catch (error: any) {
      console.error("Get notifications error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  async readNotification(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const notification = await new UserNotificationModel().findId(id);

      if (!notification) {
        return res.status(404).send({
          success: false,
          message: "Notification not found",
        });
      }

      // Check if notification belongs to this user
      if (notification.target_id !== userId) {
        return res.status(403).send({
          success: false,
          message: "Unauthorized",
        });
      }

      await new UserNotificationModel().update(id, {
        is_read: true,
      });
      
      return res.status(200).send({
        success: true,
        message: "Notification marked as read successfully",
        data: { ...notification, is_read: true },
      });
    } catch (error: any) {
      console.error("Read notification error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }
}

export default UserController;
