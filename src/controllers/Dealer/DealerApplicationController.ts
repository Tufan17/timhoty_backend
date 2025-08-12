import { FastifyRequest, FastifyReply } from "fastify";
import CityModel from "@/models/Admin/CityModel";
import DistrictModel from "@/models/Admin/DistrictModel";
import DealerApplicationModel from "@/models/Dealer/DealerApplicationModel";
import { saveUploadedFile } from "../../utils/fileUpload";
import { sendMail } from "@/services/MailService";
import knex from "@/db/knex"; 
import DealerModel from "@/models/Dealer/DealerModel";
import DealerUserModel from "@/models/Admin/DealerUserModel";
import validateTCKimlikNo  from "../../utils/isValidTC";
import { sendSms } from "@/services/SmsService";
import LogModel from "@/models/Admin/LogModel";

export default class DealerApplicationController {


  async createDealerUser(req: FastifyRequest, res: FastifyReply) {
    try {
      console.log("bende")
      const { name_surname, tc_no, gsm, email, password, dealer_id, type, status, verify } =
        req.body as {
          name_surname: string;
          tc_no: string;
          gsm: string;
          email: string;
          password: string;
          dealer_id: string;
          type: string;
          status?: boolean;
          verify?: boolean;
        };

      if (!["manager", "user"].includes(type)) {
        return res.status(400).send({
          success: false, 
          message: "Invalid type",
        });
      }

     
      const dealerUser = await new DealerUserModel().exists({ email: email });

      if (dealerUser) {
        return res.status(400).send({
          success: false,
          message: "Dealer user already exists",
        });
      }

      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

       sendSms(gsm, smsCode);
       sendMail(email, "Dealer user created", smsCode);

      await new DealerUserModel().create({
        name_surname,
        tc_no,
        gsm,
        email,
        password,
        status: status || true,
        dealer_id,
        type,
        verify: verify || false,
        otp_code: smsCode,
        otp_code_expires_at: new Date(Date.now() + 1000 * 60 * 5),
      });

      const newDealerUser: any = await new DealerUserModel().first({
        name_surname,
        tc_no,
        gsm,
        email,
        dealer_id,
        type,
      });
      await new LogModel().createLog(
        req.user,
        "create",
        "dealer_users",
        newDealerUser
      );
      return res.status(201).send({
        success: true,
        message: "Dealer user created successfully",
        data: newDealerUser,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Dealer user creation failed",
      });
    }
  }


  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const parts = req.parts();
      const fields: Record<string, string> = {};
      const documentUrls: string[] = [];
  
      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "documents") {
          const savedPath = await saveUploadedFile(part, "dealer_documents");
          documentUrls.push(savedPath);
        } else if (part.type === "field") {
          fields[part.fieldname] = part.value as string;
        }
      }
  
      const {
        name_surname,
        email,
        phone,
        dealer_name,
        city_id,
        district_id,
        address,
        type,
        identity_number,
        tax_office,
        tax_number,
        bank_account_name,
        bank_account_iban,
      } = fields;

  
      // Zorunlu alanlar kontrolü
      const requiredFields = [name_surname, email, phone, dealer_name, city_id, district_id, address, type, bank_account_name, bank_account_iban];
      if (requiredFields.some(field => !field)) {
        return res.status(400).send({ success: false, message: "Zorunlu alanlar eksik" });
      }
  
      if (!["individual", "company"].includes(type)) {
        return res.status(400).send({ success: false, message: "Geçersiz başvuru türü" });
      }
  
      if (type === "individual" && !identity_number) {
        return res.status(400).send({ success: false, message: "Bireysel başvurular için T.C. kimlik numarası zorunludur" });
      }
  
      if (type === "company" && (!tax_office || !tax_number)) {
        return res.status(400).send({ success: false, message: "Şirket başvuruları için vergi bilgileri zorunludur" });
      }
  
      // Sorguları paralel çalıştır
      const [exitEmail, exitDealer, existsCity, existsDistrict] = await Promise.all([
        new DealerUserModel().exists({ email }),
        new DealerModel().exists({ name: dealer_name }),
        new CityModel().exists({ id: city_id }),
        new DistrictModel().exists({ id: district_id }),
      ]);
  
      if (exitEmail) {
        return res.status(400).send({ success: false, message: "Bu email ile bir kullanıcı zaten mevcut" });
      }
  
      if (exitDealer) {
        return res.status(400).send({ success: false, message: "Bu bayi adı ile bir bayi zaten mevcut" });
      }
  
      if (!existsCity) {
        return res.status(400).send({ success: false, message: "Şehir bulunamadı" });
      }
  
      if (!existsDistrict) {
        return res.status(400).send({ success: false, message: "İlçe bulunamadı" });
      }
  
      const applicationData = {
        name_surname,
        email,
        phone,
        dealer_name,
        city_id,
        district_id,
        address,
        type,
        identity_number: type === "individual" ? identity_number : null,
        tax_office: type === "company" ? tax_office : null,
        tax_number: type === "company" ? tax_number : null,
        bank_account_name,
        bank_account_iban,
        document_urls: documentUrls,
      };
  
      // Aynı başvuru daha önce yapılmış mı?
      const exitApplication = await new DealerApplicationModel().first({
        name_surname: applicationData.name_surname,
        email: applicationData.email,
        phone: applicationData.phone,
        dealer_name: applicationData.dealer_name,
        city_id: applicationData.city_id,
        district_id: applicationData.district_id,
        type: applicationData.type,
        identity_number: applicationData.identity_number,
        tax_office: applicationData.tax_office,
        tax_number: applicationData.tax_number,
      });
  
      if (exitApplication) {
        return res.status(400).send({ success: false, message: "Bu başvuruyu daha önce gönderdiniz" });
      }
  
      const created = await new DealerApplicationModel().create(applicationData);
  
      // Mail gönderimini await etmiyoruz, hata olursa logluyoruz
      sendMail(email, "Bayi Başvurusu", "Bayi başvurunuz incelemeye alındı. En kısa sürede size geri dönüş yapacağız.")
        .catch((err) => console.error("Mail gönderimi başarısız:", err));
  
      return res.status(201).send({
        success: true,
        data: created,
        message: "Bayi başvurusu başarıyla gönderildi",
      });
    } catch (error) {
      console.error("Başvuru sırasında hata:", error);
      return res.status(500).send({
        success: false,
        message: "Bayi başvurusu sırasında bir hata oluştu",
      });
    }
  }
  

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const baseQuery = knex("dealer_application")
        .leftJoin("cities", "dealer_application.city_id", "cities.id")
        .leftJoin("districts", "dealer_application.district_id", "districts.id")
        .whereNull("dealer_application.deleted_at")
        .where("dealer_application.status", true)
        .andWhere(function () {
          this.where("dealer_application.name_surname", "ilike", `%${search}%`)
            .orWhere("dealer_application.dealer_name", "ilike", `%${search}%`)
            .orWhere("dealer_application.email", "ilike", `%${search}%`)
            .orWhere("dealer_application.phone", "ilike", `%${search}%`)
            .orWhere("dealer_application.address", "ilike", `%${search}%`)
            .orWhere("cities.name", "ilike", `%${search}%`)
            .orWhere("districts.name", "ilike", `%${search}%`);
        });

      const countResult = await baseQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const rawData = await baseQuery
        .clone()
        .select(
          "dealer_application.*",
          "cities.id as city_id",
          "cities.name as city_name",
          "districts.id as district_id",
          "districts.name as district_name"
        )
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit))
        .orderBy("dealer_application.created_at", "desc");

      const data = rawData.map((row) => ({
        id: row.id,
        name_surname: row.name_surname,
        dealer_name: row.dealer_name,
        email: row.email,
        phone: row.phone,
        type: row.type,
        status: row.status,
        verify: row.verify,
        address: row.address,
        created_at: row.created_at,
        identity_number: row.identity_number,
        tax_office: row.tax_office,
        tax_number: row.tax_number,
        bank_account_name: row.bank_account_name,
        bank_account_iban: row.bank_account_iban,
        document_urls: row.document_urls,
        city: {
          id: row.city_id,
          name: row.city_name,
        },
        district: {
          id: row.district_id,
          name: row.district_name,
        },
      }));

      return res.status(200).send({
        success: true,
        message: "Dealer applications fetched successfully",
        data,
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
        message: "Dealer applications fetch failed",
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      
      // Check if application exists and get its data
      const existingApplication = await new DealerApplicationModel().findId(id);
      if (!existingApplication) {
        return res.status(404).send({ success: false, message: "Dealer application not found" });
      }

      const { status, verify, rejection_reason, identity_number } = req.body as { 
        status?: boolean, 
        verify?: boolean,
        rejection_reason?: string 
        identity_number?: string
      };

      // Build update data
      const updateData: Record<string, any> = {};

      // Handle status update
      if (status !== undefined) {
        updateData.status = status;
        updateData.verify = status;

        // If application is approved (status is true), create dealer record
        if (status === true) {
          const dealerExists = await new DealerModel().exists({ name: existingApplication.dealer_name });
          if (dealerExists) {
            return res.status(400).send({
              success: false,
              message: "Dealer name already exists",
            });
          }

          // Create new dealer from approved application
          await new DealerModel().create({
            name: existingApplication.dealer_name,
            city_id: existingApplication.city_id,
            district_id: existingApplication.district_id,
            address: existingApplication.address,
            phone: existingApplication.phone,
            status: true,
            verify: true,
            tax_office: existingApplication.tax_office,
            tax_number: existingApplication.tax_number,
            bank_account_iban: existingApplication.bank_account_iban,
            bank_account_name: existingApplication.bank_account_name,
            type: existingApplication.type
          });

          const createdDealer = await new DealerModel().first({ name: existingApplication.dealer_name });
          
          // Create manager user automatically
          const smsCode = Math.floor(100000 + Math.random() * 900000).toString();
            await new DealerUserModel().create({
              name_surname: existingApplication.name_surname,
              tc_no: identity_number ? identity_number : "0",
              gsm: existingApplication.phone,
              email: existingApplication.email,
              password: Math.floor(100000 + Math.random() * 900000).toString(),
              status: true,
              dealer_id: createdDealer?.id,
              type: "manager", 
              verify: true,
              otp_code: smsCode,
              otp_code_expires_at: new Date(Date.now() + 1000 * 60 * 5),
            });


          // Mark application as deleted since it's now a dealer
          updateData.deleted_at = new Date().toISOString();
        }
        updateData.rejection_reason = rejection_reason;
        updateData.deleted_at = new Date().toISOString();
      }

      // Handle verify update if status is not defined
      if (status === undefined && verify !== undefined) {
        console.log("bana girdi su an");
        updateData.verify = verify;
      }

      // Handle rejection reason
      if (rejection_reason !== undefined) {
         sendMail(existingApplication.email, "Üzgünüz", rejection_reason ?? "Dealer application rejected");
        updateData.rejection_reason = rejection_reason;
      }

      const updated = await new DealerApplicationModel().update(id, updateData);

      return res.status(200).send({
        success: true,
        data: updated,
        message: "Dealer application updated successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer application update failed",
      });
    }
  }
}
