import { FastifyRequest, FastifyReply } from "fastify";
import DealerModel from "../../models/Admin/DealerModel";
import DealerUserModel from "../../models/Admin/DealerUserModel";
import CityModel from "src/models/Admin/CityModel";
import DistrictModel from "src/models/Admin/DistrictModel";
import LogModel from "@/models/Admin/LogModel";
import knex from "../../db/knex";
import DealerCommissionModel from "@/models/Admin/DealerCommissionModel";
export default class DealerController {
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, city_id, district_id, address, phone, status, verify, tax_office, tax_number, bank_account_iban, bank_account_name, type } =
        req.body as {
          name?: string;
          city_id?: string;
          district_id?: string;
          address?: string;
          phone?: string;
          status?: boolean;
          verify?: boolean;
          tax_office?: string;
          tax_number?: string;
          bank_account_iban?: string;
          bank_account_name?: string;
          type: string;
        };

      const exists = await new DealerModel().exists({ name });
      if (exists) {
        return res.status(400).send({
          success: false,
          message: "Dealer name already exists",
        });
      }

      const existsCity = await new CityModel().exists({ id: city_id });
      if (!existsCity) {
        return res.status(400).send({
          success: false,
          message: "City not found",
        });
      }

      const existsDistrict = await new DistrictModel().exists({
        id: district_id,
      });
      if (!existsDistrict) {
        return res.status(400).send({
          success: false,
          message: "District not found",
        });
      }

      await new DealerModel().create({
        name,
        city_id,
        district_id,
        address,
        phone,
        status,
        verify,
        tax_office,
        tax_number,
        bank_account_iban,
        bank_account_name,
        type,
      });
      const newDealer: any = await new DealerModel().first({
        name,
        city_id,
        district_id,
        address,
        phone,
        status,
        verify,
        tax_office,
        tax_number,
        bank_account_iban,
        bank_account_name,
        type,
      });
      await new LogModel().createLog(req.user, "create", "dealers", newDealer);
      return res.status(201).send({
        success: true,
        data: newDealer,
        message: "Dealer created successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer creation failed",
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

      const baseQuery = knex("dealers")
        .leftJoin("cities", "dealers.city_id", "cities.id")
        .leftJoin("districts", "dealers.district_id", "districts.id")
        .select(
          "dealers.id",
          "dealers.name as dealer_name",
          "dealers.address",
          "dealers.status",
          "dealers.phone",
          "dealers.created_at",
          "cities.id as city_id",
          "cities.name as city_name",
          "districts.id as district_id",
          "districts.name as district_name",
          "dealers.verify",
          "dealers.tax_office",
          "dealers.tax_number",
          "dealers.bank_account_iban",
          "dealers.bank_account_name",
          "dealers.type",
        )
        .where(function () {
          this.where("dealers.name", "ilike", `%${search}%`)
            .orWhere("dealers.address", "ilike", `%${search}%`)
            .orWhere("cities.name", "ilike", `%${search}%`)
            .orWhere("districts.name", "ilike", `%${search}%`)
            .orWhere("dealers.phone", "ilike", `%${search}%`);

          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("dealers.status", search.toLowerCase() === "true");
          }
        })
        .groupBy(
          "dealers.id",
          "cities.id",
          "districts.id",
          "dealers.created_at"
        )
        .orderBy("dealers.created_at", "desc");

      const countResult = await baseQuery
        .clone()
        .clearSelect()
        .count("* as total")
        .first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const rawData = await baseQuery
        .clone()
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const data = rawData.map((row) => ({
        id: row.id,
        dealer_name: row.dealer_name,
        address: row.address,
        phone: row.phone,
        verify: row.verify,
        status: row.status,
        created_at: row.created_at,
        tax_office: row.tax_office,
        tax_number: row.tax_number,
        bank_account_iban: row.bank_account_iban,
        bank_account_name: row.bank_account_name,
        type: row.type,
        city: {
          id: row.city_id,
          name: row.city_name,
        },
        district: {
          id: row.district_id,
          name: row.district_name,
        },
      }));

      // ✅ Cevap
      return res.status(200).send({
        success: true,
        message: "Dealers fetched successfully",
        data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Dealers fetching failed",
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const dealer = await new DealerModel().getDealerWithRelations(id as `${string}-${string}-${string}-${string}-${string}`);
      return res.status(200).send({
        success: true,
        message: "Dealer fetched successfully",
        data: dealer,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer fetching failed",
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name, city_id, district_id, address, phone, status, verify, tax_office, tax_number, bank_account_iban, bank_account_name, type } =
        req.body as {
          name?: string;
          city_id?: string;
          district_id?: string;
          address?: string;
          phone?: string;
          status?: boolean;
          verify?: boolean;
          tax_office?: string;
          tax_number?: string;
          bank_account_iban?: string;
          bank_account_name?: string;
          type?: string;
        };

      const exists = await new DealerModel().findId(id);
      if (!exists) {
        return res.status(400).send({
          success: false,
          message: "Dealer not found",
        });
      }

      if (city_id) {
        const existsCity = await new CityModel().exists({ id: city_id });
        if (!existsCity) {
          return res.status(400).send({
            success: false,
            message: "City not found",
          });
        }
      }

      if (district_id) {
        const existsDistrict = await new DistrictModel().exists({
          id: district_id,
        });
        if (!existsDistrict) {
          return res.status(400).send({
            success: false,
            message: "District not found",
          });
        }
      }

      const body = {
        name: name || exists.name,
        city_id: city_id || exists.city_id,
        district_id: district_id || exists.district_id,
        address: address || exists.address,
        phone: phone || exists.phone,
        status: status,
        verify: verify,
        tax_office: tax_office || exists.tax_office,
        tax_number: tax_number || exists.tax_number,
        bank_account_iban: bank_account_iban || exists.bank_account_iban,
        bank_account_name: bank_account_name || exists.bank_account_name,
        type: type || exists.type,
      };

      await new DealerModel().update(id, body);
      await new LogModel().createLog(req.user, "update", "dealers", exists);
      return res.status(200).send({
        success: true,
        data: body,
        message: "Dealer updated successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer update failed",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const exists = await new DealerModel().findId(id);
      if (!exists) {
        return res.status(400).send({
          success: false,
          message: "Dealer not found",
        });
      }
      const dealerUser = await new DealerUserModel().where("dealer_id", id);
      if (dealerUser.length > 0) {
        await new DealerUserModel().update(dealerUser[0].id, {
          status: false,
        });
      }
      await new DealerModel().delete(id);
      await new LogModel().createLog(req.user, "delete", "dealers", exists);
      return res.status(200).send({
        success: true,
        message: "Dealer deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer deletion failed",
      });
    }
  }

  async getDealerList(req: FastifyRequest, res: FastifyReply) {
    try {
      const dealers = await new DealerModel().getAll(["id", "name", "deleted_at"]);
      return res.status(200).send({
        success: true,
        message: "Dealer list fetched successfully",
        data: dealers,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer list fetching failed", 
      });
    }
  }

  async getDealerInfo(req: FastifyRequest, res: FastifyReply) {
    try {
      const dealer = await new DealerModel().getDealerWithRelations((req.user as any).dealer_id);
      const dealerCommission = await new DealerCommissionModel().dealerCommission((req.user as any).dealer_id);



      return res.status(200).send({
        success: true,
        message: "Dealer bilgileri başarıyla alındı",
        data: {...dealer, dealerCommission},
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Dealer bilgileri alınamadı",
      });
    }
  }
}
