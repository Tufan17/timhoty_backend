import { FastifyRequest, FastifyReply } from 'fastify';
import InsuranceTypeModel from '../../models/Admin/InsuranceTypeModel';
import knex from "../../db/knex"  ;
import LogModel from '@/models/Admin/LogModel';

export default class InsuranceTypeController {
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const insuranceType = await new InsuranceTypeModel().findId(id);
      if (!insuranceType) {
        return res.status(404).send({
          success: false,
          message: 'Insurance type not found',
        });
      }
      return res.status(200).send({
        success: true,
        message: 'Insurance type fetched successfully',
        data: insuranceType,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Insurance type fetch failed',
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, description } = req.body as { name: string; description: string };
      await new InsuranceTypeModel().create({ name, description });
      const newInsuranceType: any = await new InsuranceTypeModel().first({ name, description });
      await new LogModel().createLog(req.user, 'create', 'insurance_types', newInsuranceType);
      return res.status(200).send({
        success: true,
        message: 'Insurance type created successfully',
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Insurance type creation failed',
      });
    }
  }
  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name, description, status } = req.body as { name: string; description: string; status: boolean };
      const insuranceType = await new InsuranceTypeModel().findId(id);
      if (!insuranceType) {
        return res.status(404).send({
          success: false,
          message: 'Insurance type not found',
        });
      }
      const body = { name: name || insuranceType.name, description: description || insuranceType.description, status: status || insuranceType.status };
       await new InsuranceTypeModel().update(id, body);
       await new LogModel().createLog(req.user, 'update', 'insurance_types', insuranceType);
      return res.status(200).send({
        success: true,
        message: 'Insurance type updated successfully',
        data: body,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Insurance type update failed',
      });
    }
  }
  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const insuranceType = await new InsuranceTypeModel().findId(id);
      if (!insuranceType) {
        return res.status(404).send({
          success: false,
          message: 'Insurance type not found',
        });
      }
      await new LogModel().createLog(req.user, 'delete', 'insurance_types', insuranceType);
      await new InsuranceTypeModel().delete(id);
      return res.status(200).send({
        success: true,
        message: 'Insurance type deleted successfully',
        data: insuranceType,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Insurance type deletion failed',
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };
      const query = knex("insurance_types")
        .where(function () {
          this.where("name", "ilike", `%${search}%`)
            .orWhere("description", "ilike", `%${search}%`);
          if (search.toLowerCase() === 'true' || search.toLowerCase() === 'false') {
            this.orWhere("status", search.toLowerCase() === 'true');
          }
        });
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
    
      return res.status(200).send({
        success: true,
        message: 'Insurance types fetched successfully',
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
        message: 'Insurance types fetch failed',
      });
    }
  }

  async getCategoryList(req: FastifyRequest, res: FastifyReply) {
    try {
      const categories = await new InsuranceTypeModel().getAll(["id", "name", "description", "status", "deleted_at"],{status: true});
      return res.status(200).send({
        success: true,
        message: "Insurance types fetched successfully",
        data: categories,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Insurance types fetch failed",  
      });
    }
  }
}
