import { FastifyRequest, FastifyReply } from "fastify";
import LogModel from "../../models/Admin/LogModel";
import knex from "../../db/knex";
import AdminModel from "@/models/Admin/AdminModel";
import DealerUserModel from "@/models/Dealer/DealerUserModel";
import UserModel from "@/models/User/UserModel";

export default class LogController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as {
        page: number;
        limit: number;
        search: string;
      };

      const baseQuery = knex("logs").whereNull("deleted_at");

      // Search işlevi şimdilik devre dışı bırakıldı
      // if (search) {
      //   baseQuery.andWhere(function() {
      //     this.where("logs.content", "ilike", `%${search}%`)
      //       .orWhere("admins.name_surname", "ilike", `%${search}%`)
      //       .orWhere("dealers.name", "ilike", `%${search}%`)
      //       .orWhere("dealer_users.name_surname", "ilike", `%${search}%`);
      //   });
      // }

      // Toplam kayıt sayısı
      const countResult = await baseQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Sonuçları getir (en yeni en üstte)
      const logs = await baseQuery
        .clone()
        .orderBy("logs.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      // Sonuçları formatla
      const formattedLogs = await Promise.all(
        logs.map(async (log) => {
          let userName: string | null = null;
      
          switch (log.type) {
            case "admin":
              userName = (await new AdminModel().first({ id: log.user_id }))?.name_surname ?? null;
              break;
            case "admins":
              userName = (await new AdminModel().first({ id: log.user_id }))?.name_surname ?? null;
              break;
            case "dealer":
              userName = (await new DealerUserModel().first({ id: log.target_id }))?.name_surname ?? null;
              break;
            case "dealers":
              userName = (await new DealerUserModel().first({ id: log.target_id }))?.name_surname ?? null;
              break;
            case "user":
              userName = (await new UserModel().first({ id: log.target_id }))?.name_surname ?? null;
              break;
          }

          if(log.target_id === log.user_id){
            userName = "Kendisi";
          }


          const key={
            CommunicationPreference:"İletişim Tercihi",
            Permission:"İzinler",
            "User":"Kullanıcı",
            "Dealer":"Bayi",
            "Admin":"Yönetici",
            "DealerUser":"Bayi Kullanıcısı",
            "DealerUserPermission":"Bayi Kullanıcısı İzinleri",
            "dealers":"Bayiler",
            "landing":"Giriş Sayfası",
            "companies":"Şirketler",
            "jobs":"Meslekler",
            "districts":"İlçeler",
            "cities":"İller",
            "canceled_reasons":"İptal Nedenleri",
            "insurance_types":"Sigorta Türleri",
          }


          return {
            id: log.id,
            type:
              log.type === "admin"
                ? "Yönetici"
                : log.type === "dealer"
                ? "Bayi"
                : "Kullanıcı",
            process:
              log.process === "create"
                ? "Yeni Kayıt"
                : log.process === "update"
                ? "Güncelleme"
                : "Silme",
            target_name: key[log.target_name as keyof typeof key]??log.target_name,
            user_id: log.user_id,
            user_name: userName??"Bilinmiyor",
            content: log.content ? JSON.parse(log.content) : null,
            created_at: log.created_at,
            updated_at: log.updated_at,
          };
        })
      );
      

      return res.status(200).send({
        success: true,
        message: "Logs fetched successfully",
        data: formattedLogs,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Logs fetch failed",
      });
    }
  }
}
