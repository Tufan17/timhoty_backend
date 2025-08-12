import { FastifyRequest, FastifyReply } from "fastify";
import PermissionModel from "@/models/Admin/PermissionModel";
import LogModel from "@/models/Admin/LogModel";
import UserModel from "@/models/Admin/UserModel";
import DealerModel from "@/models/Admin/DealerModel";
import AdminModel from "@/models/Admin/AdminModel";
import DealerUserModel from "@/models/Dealer/DealerUserModel";
class PermissionController {
  
  async createOrUpdate(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, target, target_id, status } = req.body as {
        name: string;
        target: string;
        target_id: string;
        status: boolean;
      };
      if (!["users", "dealer_users", "admins"].includes(target)) {
        return res.status(400).send({
          success: false,
          message: "Target is invalid",
        });
      }

      let user;

      if (target === "users") {
        user = await new UserModel().first({ id: target_id });
      } else if (target === "dealer_users") {
        user = await new DealerModel().first({ id: target_id });
      } else if (target === "admins") {
        user = await new AdminModel().first({ id: target_id });
      }

      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }

      await new PermissionModel().createOrUpdate(
        target,
        target_id,
        name,
        status
      );
      await new LogModel().createLog(req.user, "create", "Permission", {
        name,
        target,
        target_id,
        status,
      });

      return res.status(200).send({
        success: true,
        message: "Permission created successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Permission creation failed",
        error: error,
      });
    }
  }
  
  async totalCreateOrUpdate(req: FastifyRequest, res: FastifyReply) {
    try {
      const { permissions,  user_id } = req.body as {
        permissions: { name: string; status: boolean }[];
        user_id: string;
      };
     

      let user;

        user = await new DealerUserModel().first({ id: user_id });

        if(user && user?.type === "manager") {
          return res.status(400).send({
            success: false,
            message: "Yöneticinin yetkilerini güncelleyemezsiniz",
          });
        }

      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }

      for (const permission of permissions) {
        await new PermissionModel().createOrUpdate("dealer_users", user_id, permission.name, permission.status);
        await new LogModel().createLog(req.user, "create", "Permission", {
          name: permission.name,
          target: "dealer_users",
          target_id: user_id,
          status: permission.status,
        });
      }


      return res.status(200).send({
        success: true,
        message: "Permissions total data created successfully",
      });

    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Permission total data creation failed",
        error: error,
      });
    }
  }

  async findUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const { target, id } = req.params as { target: string, id: string };
      if (!["users", "dealer_users", "admins"].includes(target)) {
        return res.status(400).send({
          success: false,
          message: "Target is invalid",
        });
      }

      let permissions;
      if(target === "admins") {
        permissions = await new PermissionModel().getAdminPermissions(id);
      } else {
        permissions = await new PermissionModel().getAll([],{ target: target, user_id: id });
      }

      return res.status(200).send({
        success: true,
        message: "Permissions fetched successfully",
        data: permissions,
      });

    } catch (error) {

        return res.status(500).send({
        success: false,
        message: "Permission total data fetching failed",
        error: error,
      });

    }
  }
}

export default PermissionController;
