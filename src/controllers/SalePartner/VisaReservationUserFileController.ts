// src/controllers/SalePartner/VisaReservationUserFileController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import VisaReservationUserFileModel from "@/models/VisaReservationUserFileModel";
import VisaReservationModel from "@/models/VisaReservationModel";

export default class VisaReservationUserFileController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { visa_reservation_id } = req.params as {
        visa_reservation_id: string;
      };
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      // Check if reservation belongs to this sales partner
      const reservation = await new VisaReservationModel().first({
        id: visa_reservation_id,
        sales_partner_id: salesPartnerId,
      });

      if (!reservation) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      const files = await new VisaReservationUserFileModel().where(
        "visa_reservation_id",
        visa_reservation_id
      );

      return res.status(200).send({
        success: true,
        message: req.t("VISA_RESERVATION_USER_FILE.FILES_FETCHED_SUCCESS"),
        data: files,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_RESERVATION_USER_FILE.FILES_FETCHED_ERROR"),
      });
    }
  }
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { visa_reservation_id, files } = req.body as {
        visa_reservation_id: string;
        files: string | string[];
      };
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      // Check if visa reservation exists and belongs to this sales partner
      const visaReservation = await new VisaReservationModel().first({
        id: visa_reservation_id,
        sales_partner_id: salesPartnerId,
      });

      if (!visaReservation) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      // Normalize files to array
      const fileUrls = Array.isArray(files) ? files : [files];
      const createdFiles = [];

      // Create files for each uploaded file
      for (const fileUrl of fileUrls) {
        // Determine file type based on extension
        let file_type = "image";
        let file_name = fileUrl.split("/").pop() || "unknown";

        if (fileUrl.includes(".pdf")) {
          file_type = "pdf";
        } else if (
          fileUrl.includes(".mp4") ||
          fileUrl.includes(".mov") ||
          fileUrl.includes(".webm") ||
          fileUrl.includes(".avi") ||
          fileUrl.includes(".wmv") ||
          fileUrl.includes(".flv") ||
          fileUrl.includes(".mkv")
        ) {
          file_type = "video";
        }

        const file = await new VisaReservationUserFileModel().create({
          visa_reservation_id,
          file_url: fileUrl,
          file_name,
          file_type,
        });

        createdFiles.push(file);
      }

      return res.status(200).send({
        success: true,
        message: req.t("VISA_RESERVATION_USER_FILE.FILES_CREATED_SUCCESS"),
        data: createdFiles,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_RESERVATION_USER_FILE.FILES_CREATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      // Check if file exists
      const file = await new VisaReservationUserFileModel().first({
        id,
      });

      if (!file) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_RESERVATION_USER_FILE.FILE_NOT_FOUND"),
        });
      }

      // Check if reservation belongs to this sales partner
      const reservation = await new VisaReservationModel().first({
        id: file.visa_reservation_id,
        sales_partner_id: salesPartnerId,
      });

      if (!reservation) {
        return res.status(403).send({
          success: false,
          message: req.t("AUTH.FORBIDDEN"),
        });
      }

      await new VisaReservationUserFileModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("VISA_RESERVATION_USER_FILE.FILE_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_RESERVATION_USER_FILE.FILE_DELETED_ERROR"),
      });
    }
  }
}
