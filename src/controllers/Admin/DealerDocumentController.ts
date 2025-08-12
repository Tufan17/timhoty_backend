import { FastifyRequest, FastifyReply } from "fastify";
import DealerModel from "../../models/Admin/DealerModel";
import DealerDocumentModel from "../../models/Admin/DealerDocumentModel";
import { MultipartFile } from "@fastify/multipart";
import { saveUploadedFile } from "../../utils/fileUpload";
import LogModel from "@/models/Admin/LogModel";
import knex from "../../db/connection";

export default class DealerDocumentController {
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const parts = req.parts();

      const fields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "document_url") {
            fields[part.fieldname] = await saveUploadedFile(
              part,
              "dealer_documents"
            );
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      const dealerDocument = {
        dealer_id: fields.dealer_id,
        name: fields.name,
        document_url: fields.document_url,
      };

      for (const field in dealerDocument) {
        if (!dealerDocument[field as keyof typeof dealerDocument]) {
          return res.status(400).send({
            success: false,
            message: `${field} is required`,
          });
        }
      }

      const existsDealer = await new DealerModel().exists({
        id: dealerDocument.dealer_id,
      });
      if (!existsDealer) {
        return res.status(400).send({
          success: false,
          message: "Dealer not found",
        });
      }

      const body = {
        dealer_id: dealerDocument.dealer_id,
        name: dealerDocument.name,
        document_url: dealerDocument.document_url,
      };

      await new DealerDocumentModel().create(body);
      const newDealerDocument: any = await new DealerDocumentModel().first({
        dealer_id: dealerDocument.dealer_id,
        name: dealerDocument.name,
        document_url: dealerDocument.document_url,
      });
      await new LogModel().createLog(
        req.user,
        "create",
        "dealer_documents",
        newDealerDocument
      );

      return res.status(201).send({
        success: true,
        message: "Dealer created successfully",
        data: dealerDocument,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer creation failed",
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const parts = req.parts();
      const { id } = req.params as { id: string };
      const fields: Record<string, string> = {};
      const dealerDocument = await new DealerDocumentModel().findId(id);
      if (!dealerDocument) {
        return res.status(404).send({
          success: false,
          message: "Dealer document not found",
        });
      }

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "document_url") {
            fields[part.fieldname] = await saveUploadedFile(
              part,
              "dealer_documents"
            );
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      const data = {
        dealer_id: fields.dealer_id || dealerDocument.dealer_id,
        name: fields.name || dealerDocument.name,
        document_url: fields.document_url || dealerDocument.document_url,
      };

      for (const field in data) {
        if (!data[field as keyof typeof data]) {
          return res.status(400).send({
            success: false,
            message: `${field} is required`,
          });
        }

        const existsDealer = await new DealerModel().exists({
          id: data.dealer_id,
        });
        if (!existsDealer) {
          return res.status(400).send({
            success: false,
            message: "Dealer not found",
          });
        }
        const body = {
          dealer_id: data.dealer_id,
          name: data.name,
          document_url: data.document_url,
        };

        await new DealerDocumentModel().update(id, body);
        await new LogModel().createLog(
          req.user,
          "update",
          "dealer_documents",
          dealerDocument
        );
      }

      return res.status(200).send({
        success: true,
        message: "Dealer document updated successfully",
        data: data,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer document update failed",
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        search = "",
        page = 1,
        limit = 10,
      } = req.query as { search: string; page: number; limit: number };
  
      // Temel sorgu
      const query = knex("dealer_documents")
        .whereNull("dealer_documents.deleted_at")
        .join("dealers", "dealer_documents.dealer_id", "dealers.id")
        .select("dealer_documents.*", "dealers.name as dealer_name")
        .orderBy("dealer_documents.created_at", "desc");
  
      // Eğer arama yapılacaksa, filtre ekliyoruz
      if (search) {
        query.where("dealer_documents.name", "ilike", `%${search}%`);
        query.orWhere("dealers.name", "ilike", `%${search}%`);
      }
  
      // 1. Toplam sayıyı çekmek için ayrı sorgu
      const countResult = await knex("dealer_documents")
        .whereNull("dealer_documents.deleted_at")
        .join("dealers", "dealer_documents.dealer_id", "dealers.id")
        .count("* as total")
        .first();
  
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
  
      // 2. Veriyi çekme
      const data = await query
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
  
      return res.status(200).send({
        success: true,
        message: "Dealer documents fetched successfully",
        data: data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Dealer documents fetch failed",
      });
    }
  }
  

  async findById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const dealerDocument = await new DealerDocumentModel().findId(id);
      if (!dealerDocument) {
        return res.status(404).send({
          success: false,
          message: "Dealer document not found",
        });
      }
      return res.status(200).send({
        success: true,
        message: "Dealer document fetched successfully",
        data: dealerDocument,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer document fetch failed",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const dealerDocument = await new DealerDocumentModel().findId(id);
      if (!dealerDocument) {
        return res.status(404).send({
          success: false,
          message: "Dealer document not found",
        });
      }
      await new DealerDocumentModel().delete(id);
      await new LogModel().createLog(
        req.user,
        "delete",
        "dealer_documents",
        dealerDocument
      );
      return res.status(200).send({
        success: true,
        message: "Dealer document deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer document delete failed",
      });
    }
  }

  async findByDealerId(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const dealerDocuments = await new DealerDocumentModel().getAll(
        ["id", "dealer_id", "name", "document_url"],
        { dealer_id: id },
        "created_at"
      );
      return res.status(200).send({
        success: true,
        message: "Dealer documents fetched successfully",
        data: dealerDocuments,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer documents fetch failed",
      });
    }
  }
}
