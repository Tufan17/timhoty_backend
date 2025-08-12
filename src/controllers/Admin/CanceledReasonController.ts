import CanceledReasonModel from "../../models/Admin/CanceledReasonModel";
import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import LogModel from "@/models/Admin/LogModel";
import InsuranceTypeModel from "@/models/Admin/InsuranceTypeModel";
export default class CanceledReasonController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
  
      const baseQuery = knex("canceled_reasons")
      .whereNull("canceled_reasons.deleted_at")
      .leftJoin("insurance_types", "insurance_types.id", "canceled_reasons.insurance_type_id")
      .andWhere(function () {
        this.where("canceled_reasons.name", "ilike", `%${search}%`)
        .orWhere("insurance_types.name", "ilike", `%${search}%`)
      });
    
    const countResult = await baseQuery.clone().count("* as total").first();
    const total = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(total / Number(limit));
    
    const rawData = await baseQuery
      .clone()
      .select(
        "canceled_reasons.*",
        "insurance_types.name as insurance_type_name"
      )
      .orderBy("canceled_reasons.created_at", "asc")
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));
    
    const data = rawData.map((row) => ({
      id: row.id,
      name: row.name,
      insurance_type: {id: row.insurance_type_id, name: row.insurance_type_name},
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    
    return res.status(200).send({
      success: true,
      message: "Canceled reasons fetched successfully",
      data,
      recordsPerPageOptions: [10, 20, 50, 100],
      total,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit),
    });

    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Canceled reasons fetch failed",
        error: error,
      });
    }
  }
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const canceledReason = await new CanceledReasonModel().findId(id);
      if (!canceledReason) {
        return res.status(404).send({
          success: false,
          message: "Canceled reason not found",
        });
      }
      return res.status(200).send({
        success: true,
        message: "Canceled reason fetched successfully",
        data: canceledReason,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Canceled reason fetch failed",
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, insurance_type_id } = req.body as { name: string, insurance_type_id: string };

        const exist = await new CanceledReasonModel().first({ name });
        if(exist){
          return res.status(400).send({
            success: false,
            message: "Canceled reason already exists",
          });
        }
        const existInsuranceType = await new InsuranceTypeModel().findId(insurance_type_id);
        if(!existInsuranceType){
          return res.status(400).send({
            success: false,
            message: "Insurance type not found",
          });
        }
        

        await new CanceledReasonModel().create({ name, insurance_type_id });
        

        const canceledReason = await new CanceledReasonModel().first({ name, insurance_type_id });

        await new LogModel().createLog(req.user, 'create', 'canceled_reasons', canceledReason);

        return res.status(200).send({
          success: true,
          message: "Canceled reason created successfully",
        });

    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Campaign creation failed",
      });
    }
  }
  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const { id } = req.params as { id: string };
   
      const canceledReason = await new CanceledReasonModel().findId(id);
      if(!canceledReason){
        return res.status(404).send({
          success: false,
          message: "Canceled reason not found",
        });
      }

      const { name, insurance_type_id } = req.body as { name: string, insurance_type_id: string };
     

      
      const exist = await new CanceledReasonModel().first({ name });
      if(exist){
        return res.status(400).send({
          success: false,
          message: "Canceled reason already exists",
        });
      }
      const body: Record<string, any> = {
        name: name ?? canceledReason.name,
        insurance_type_id: insurance_type_id ?? canceledReason.insurance_type_id,
      };

      const existInsuranceType = await new InsuranceTypeModel().findId(body.insurance_type_id);
      if(!existInsuranceType){
        return res.status(400).send({
          success: false,
          message: "Insurance type not found",
        });
      }
     
      canceledReason.name = name;
      canceledReason.insurance_type_id = insurance_type_id;
      await new CanceledReasonModel().update(id, body);
      await new LogModel().createLog(req.user, 'update', 'canceled_reasons', canceledReason);
      
      return res.status(200).send({
        success: true,
        message: "Canceled reason updated successfully",
        data: canceledReason
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Canceled reason update failed",
      });
    }
  }
  
  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const canceledReason = await new CanceledReasonModel().findId(id);
      if(!canceledReason){
        return res.status(404).send({
          success: false,
          message: "Canceled reason not found",
        });
      }
      await new CanceledReasonModel().delete(id);
      await new LogModel().createLog(req.user, 'delete', 'canceled_reasons', canceledReason);
      return res.status(200).send({
        success: true,
        message: "Canceled reason deleted successfully",
        data: canceledReason,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Canceled reason deletion failed",
        error: error,
      });
    }
  }
}
