import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import SupportDealerModel from "@/models/Dealer/SupportDealerModel";
import SupportDealerMessageModel from "@/models/Dealer/SupportDealerMessageModel";
import { saveUploadedFile } from "@/utils/fileUpload";
import UserNotification from "@/models/Admin/UserNotification";
import { sendMail } from "@/services/MailService";
export default class SupportDealerController {
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const parts = req.parts();

      const fields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "docs") {
            fields[part.fieldname] = await saveUploadedFile(
              part,
              "support_dealer"
            );
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      const { title, description, docs } = fields;


      if (!title || !description) {
        return res.status(400).send({
          success: false,
          message: "Title ve description alanları zorunludur",
        });
      }

      const supportDealer = await new SupportDealerModel().create({
        title,
        description,
        docs,
        dealer_id: (req.user as any).dealer_id,
        dealer_user_id: (req.user as any).id,
      });

      return res.status(200).send({
        success: true,
        message: "Destek talebi oluşturuldu",
        data: supportDealer,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Destek talebi oluşturulamadı",
        error: error,
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const {
        page = 1,
        limit = 10,
        search = "",
        start_date,
        end_date,
        status,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        start_date: string;
        end_date: string;
        status: string;
      };

      const query = knex("support_dealer")
        .leftJoin(
          "dealer_users",
          "support_dealer.dealer_user_id",
          "dealer_users.id"
        )
        .where("support_dealer.dealer_id", user.dealer_id)
        .where(function () {
          this.where("support_dealer.title", "ilike", `%${search}%`).orWhere(
            "support_dealer.description",
            "ilike",
            `%${search}%`
          );

          if (start_date)
            this.andWhere("support_dealer.created_at", ">=", start_date);
          if (end_date)
            this.andWhere("support_dealer.created_at", "<=", end_date);
          if (status) this.andWhere("support_dealer.status", status);
        })
        .select(
          "support_dealer.*",
          "dealer_users.name_surname as dealer_user_name"
        );

      const countQuery = knex("support_dealer")
        .leftJoin(
          "dealer_users",
          "support_dealer.dealer_user_id",
          "dealer_users.id"
        )
        .where("support_dealer.dealer_user_id", user.id)
        .where(function () {
          this.where("support_dealer.title", "ilike", `%${search}%`).orWhere(
            "support_dealer.description",
            "ilike",
            `%${search}%`
          );

          if (start_date)
            this.andWhere("support_dealer.created_at", ">=", start_date);
          if (end_date)
            this.andWhere("support_dealer.created_at", "<=", end_date);
          if (status) this.andWhere("support_dealer.status", status);
        });

      const countResult = await countQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const data = await query
        .orderBy("support_dealer.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: "Destek talebi listesi alındı",
        data: data.map((item: any) => ({
          ...item,
          status:
            item.status === "waiting"
              ? "Beklemede"
              : item.status === "pending"
              ? "İşleme Alındı"
              : item.status === "open"
              ? "Açıldı"
              : "Kapalı",
        })),
        total: total,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Destek talebi listesi alınamadı",
        error: error,
      });
    }
  }

  async findById(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const { id } = req.params as { id: string };

      const supportDealer = await new SupportDealerModel().findDealerId(id);

      return res.status(200).send({
        success: true,
        message: "Destek talebi detayı alındı",
        data: supportDealer,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Destek talebi detayı alınamadı",
        error: error,
      });
    }
  }

  async updateMessage(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const { id } = req.params as { id: string };
      const parts = req.parts();

      const fields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "docs") {
            fields[part.fieldname] = await saveUploadedFile(
              part,
              "support_dealer"
            );
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      const existMessage = await new SupportDealerModel().first({id:id});
      if(!existMessage){
        return res.status(400).send({
          success: false,
          message: "Bu destek talebi bulunamadı",
        });
      }

      if(existMessage?.dealer_user_id === null){
        await new SupportDealerModel().update(id,{
          dealer_user_id:user.id,
        });
      }
      const { message, docs } = fields;

      await new UserNotification().create({
        title: "Destek Talebi",
        message: message||"Destek talebi mesajı güncellendi",
        target_id: existMessage.admin_id,
        link: `/support/${id}`,
        target_type: "admin",
      });

      await sendMail("tufanmemisali4@gmail.com", "Destek Talebi", message||"Destek talebi mesajı güncellendi");

      const supportDealerMessage = await new SupportDealerMessageModel().create({
        ticket_id: id,  
        message,
        docs,
        sender_id: user.id,
        sender_type: "dealer_user",
      });

      return res.status(200).send({
        success: true,
        message: "Destek talebi mesajı güncellendi",
        data: supportDealerMessage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Destek talebi mesajı güncellenemedi",
        error: error,
      });
    }
  }
}
