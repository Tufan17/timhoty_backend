// middlewares/logMiddleware.ts
import LogModel from "@/models/LogModel";
import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../db/knex";

/**
 * Audit logger middleware factory for Fastify
 * @param {Object} opts
 * @param {string} opts.targetName - tablo/model adı (ör: "users")
 * @param {Object} opts.model - ilgili model (eski kaydı çekmek için)
 * @param {string} [opts.idParam="id"] - route parametresindeki id alanı
 * @param {(request)=>({id,type})} [opts.getUser] - kullanıcı bilgisini dönen fonksiyon
 */
export function makeAuditLogger({
  targetName,
  model,
  idParam = "id",
  getUser = (request: FastifyRequest) => (request as any).user || {},
}: {
  targetName: string;
  model: any;
  idParam?: string;
  getUser?: (request: FastifyRequest) => any;
} = {} as any) {
  if (!targetName) throw new Error("auditLog: targetName gerekli");
  if (!model) throw new Error("auditLog: model gerekli");

  const logModel = new LogModel();
  const ALLOWED_TYPES = ["user", "solution_partner", "sale_partner", "admin"];

  return async function auditLog(request: FastifyRequest, reply: FastifyReply) {
    // Hangi işlem?
    const method = request.method.toUpperCase();
    const process =
      method === "POST"
        ? "create"
        : method === "PUT" || method === "PATCH"
        ? "update"
        : method === "DELETE"
        ? "delete"
        : null;

    // CRUD dışı istekler için pas geç
    if (!process) return;

    // Kullanıcı bilgisi
    const { id: userId, type } = getUser(request) || {};
    const safeType = ALLOWED_TYPES.includes(type) ? type : "user";

    // Hedef ID'yi route paramından oku (create'de yok olabilir)
    const routeTargetId = (request.params as any)?.[idParam];

    // Update/Delete ise eski kaydı yükle (content)
    let oldRow = null;
    try {
      if (process === "update" || process === "delete") {
        if (routeTargetId) {
          oldRow = await knex(model.modelName)
          .whereNull(`${model.modelName}.deleted_at`)
          .where(`${model.modelName}.id`, routeTargetId)
          .first();
        }
      }
    } catch (e) {
      console.log(e);
      // Eski kayıt bulunamazsa logu yine de yazarız (content=null)
      oldRow = null;
    }

    // Fastify'de yanıt tamamlanınca hook ile logu yaz
    reply.raw.on('finish', async () => {
      // 2xx/3xx ise logla
      if (reply.statusCode >= 200 && reply.statusCode < 400) {
        try {
          // Create senaryosunda controller yeni ID'yi context'e bırakmalı:
          // request.auditTargetId = createdId;
          const targetId =
            (request as any).auditTargetId ||
            routeTargetId ||
            (request.body as any)?.id || // fallback
            null;

          await logModel.create({
            type: safeType,             // 'user' | 'solution_partner' | 'sale_partner' | 'admin'
            process,                    // 'create' | 'update' | 'delete'
            target_name: targetName,    // tablo adı
            target_id: targetId,        // data id
            user_id: userId || null,    // işlemi yapan
            content:
              process === "update" || process === "delete"
                ? JSON.stringify(oldRow || null)
                : null,                 // create'de null
          });
        } catch (err) {
          // Log yazımı hata verirse uygulamayı bozmayalım
          // İsteğe bağlı: console.error("auditLog error:", err);
        }
      }
    });
  };
}
