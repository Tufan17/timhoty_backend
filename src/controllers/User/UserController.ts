import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import UserModel from "@/models/User/UserModel";

export default class UserController {



  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name_surname, email, job_id } = req.body as {
        name_surname: string;
        email: string;
        job_id: string;
      };

      const user = await new UserModel().first({ id });
      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }
      if(user.email !== email){
        const exitUser = await new UserModel().first({ email });
        if (exitUser) {
          return res.status(200).send({
            success: false,
            message: "Bu mail adresiyle başka bir hesap tarafından kullanılıyor.",
          });
        }
      }

      await new UserModel().update(id, {
        name_surname,
        email,
        job_id,
      });

      return res.status(200).send({
        success: true,
        message: "User updated successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const user = await new UserModel().first({ id });
      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }
      await new UserModel().delete(id);

      return res.status(200).send({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }



  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
        const user = await new UserModel().userDetail(id);

        if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not found",
        });
      }
      return res.status(200).send({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
