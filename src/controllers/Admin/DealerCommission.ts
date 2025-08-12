import { FastifyRequest, FastifyReply } from "fastify";
import DealerModel from "../../models/Admin/DealerModel";
import DealerCommissionModel from "src/models/Admin/DealerCommissionModel";
import InsuranceTypeModel from "src/models/Admin/InsuranceTypeModel";
import LogModel from "@/models/Admin/LogModel";
import knex from "../../db/knex";


export default class DealerCommissionController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const dealerCommissions = await new DealerCommissionModel().getAll();
      return res.status(200).send({
        success: true,
        message: "Dealer commissions fetched successfully",
        data: dealerCommissions,
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
      const { id } = req.params as { id: number };
      const dealerCommission = await new DealerCommissionModel().oneToMany(id, 'insurance_types', 'insurance_type_id');
      return res.status(200).send({
        success: true,
        message: "Dealer commission fetched successfully",
        data: dealerCommission,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { dealer_id, insurance_type_id, commission_rate } = req.body as {
        dealer_id: number;
        insurance_type_id: number;
        commission_rate: number;
      };

      const existsDealer = await new DealerModel().exists({ id: dealer_id });
      if (!existsDealer) {
        return res.status(400).send({
          success: false,
          message: "Dealer not found",
        });
      }
      const existsInsuranceType = await new InsuranceTypeModel().exists({
        id: insurance_type_id,
      });
      if (!existsInsuranceType) {
        return res.status(400).send({
          success: false,
          message: "Insurance type not found",
        });
      }

      const existsDealerCommission = await new DealerCommissionModel().exists({
        dealer_id,
        insurance_type_id,
      });
      if (existsDealerCommission) {
        return res.status(400).send({
          success: false,
          message: "Dealer commission already exists",
        });
      }

      const body = {
        dealer_id,
        insurance_type_id,
        commission_rate,
        created_by: req.user?.id,
        updated_by: req.user?.id,
      };

      const dealerCommission = await new DealerCommissionModel().create(body);
      const newDealerCommission: any = await new DealerCommissionModel().first({ dealer_id, insurance_type_id });
      await new LogModel().createLog(req.user, 'create', 'dealer_commissions', newDealerCommission);
      return res.status(200).send({
        success: true,
        message: "Dealer commission created successfully",
        data: dealerCommission,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: number };
      const { dealer_id, insurance_type_id, commission_rate } = req.body as {
        dealer_id: number;
        insurance_type_id: number;
        commission_rate: number;
      };

      const existsDealerCommission = await new DealerCommissionModel().findId(
        id
      );
      if (!existsDealerCommission) {
        return res.status(400).send({
          success: false,
          message: "Dealer commission not found",
        });
      }

      const body = {
        dealer_id: dealer_id || existsDealerCommission.dealer_id,
        insurance_type_id:
          insurance_type_id || existsDealerCommission.insurance_type_id,
        commission_rate:
          commission_rate || existsDealerCommission.commission_rate,
        updated_by: req.user?.id,
      };

      const existsDealer = await new DealerCommissionModel().exists({
        id: dealer_id,
      });
      if (existsDealer) {
        return res.status(400).send({
          success: false,
          message: "Dealer not found",
        });
      }
      const existsInsuranceType = await new InsuranceTypeModel().exists({
        id: insurance_type_id,
      });
      if (!existsInsuranceType) {
        return res.status(400).send({
          success: false,
          message: "Insurance type not found",
        });
      }

      const dealerCommission = await new DealerCommissionModel().update(
        id,
        body
      );
      await new LogModel().createLog(req.user, 'update', 'dealer_commissions', existsDealerCommission);
      return res.status(200).send({
        success: true,
        message: "Dealer commission updated successfully",
        data: dealerCommission,
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
      const { id } = req.params as { id: number };
      const existsDealerCommission = await new DealerCommissionModel().findId(id);
      if (!existsDealerCommission) {
        return res.status(400).send({
          success: false,
          message: "Dealer commission not found",
        });
      }

      await new DealerCommissionModel().delete(id);
      await new LogModel().createLog(req.user, 'delete', 'dealer_commissions', existsDealerCommission);
      return res.status(200).send({
        success: true,
        message: "Dealer commission deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        dealer_id = "",
      } = req.query as { page: number; limit: number; search: string; dealer_id: string; };
  
      const baseQuery = knex("dealer_commissions")
        .whereNull("dealer_commissions.deleted_at")
        .leftJoin("dealers", "dealer_commissions.dealer_id", "dealers.id")
        .leftJoin("insurance_types", "dealer_commissions.insurance_type_id", "insurance_types.id")
        .leftJoin("admins", "dealer_commissions.created_by", "admins.id")
        .leftJoin("admins as updated_admins", "dealer_commissions.updated_by", "updated_admins.id")
        .select(
          "dealer_commissions.id",
          "dealer_commissions.dealer_id",
          "dealer_commissions.insurance_type_id",
          "dealer_commissions.commission_rate",
          "dealer_commissions.created_at",
          "dealer_commissions.updated_at",
          "dealers.name as dealer_name",
          "insurance_types.name as insurance_type_name",
          "admins.name_surname as created_by",
          "updated_admins.name_surname as updated_by"
        )
        .modify(function (queryBuilder) {
          if (search) {
            queryBuilder.where(function () {
              this.where("dealers.name", "ilike", `%${search}%`)
                .orWhere("insurance_types.name", "ilike", `%${search}%`)
                .orWhere("admins.name_surname", "ilike", `%${search}%`);
            });
          }
        })
        .orderBy("dealer_commissions.created_at", "desc");

      if (dealer_id) {
        baseQuery.where("dealer_commissions.dealer_id", dealer_id);
      }
  
      // ✅ Hatalı sorgu düzeltildi: Eksik join'ler eklendi
      const countResult = await knex("dealer_commissions")
        .whereNull("dealer_commissions.deleted_at")
        .leftJoin("dealers", "dealer_commissions.dealer_id", "dealers.id")
        .leftJoin("insurance_types", "dealer_commissions.insurance_type_id", "insurance_types.id")
        .leftJoin("admins", "dealer_commissions.created_by", "admins.id")
        .modify(function (queryBuilder) {
          if (search) {
            queryBuilder.where(function () {
              this.where("dealers.name", "ilike", `%${search}%`)
                .orWhere("insurance_types.name", "ilike", `%${search}%`)
                .orWhere("admins.name_surname", "ilike", `%${search}%`);
            });
          }
        })
        .countDistinct("dealer_commissions.id as total")
        .first();
  
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
  
      const rawData = await baseQuery
        .clone()
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
  
      const data = rawData.map((row: any) => ({
        id: row.id,
        dealer_name: row.dealer_name,
        insurance_type_name: row.insurance_type_name,
        commission_rate: row.commission_rate,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
        dealer_id: row.dealer_id,
        insurance_type_id: row.insurance_type_id,
      }));
  
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
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Dealers fetching failed",
      });
    }
  }
  
  
}
