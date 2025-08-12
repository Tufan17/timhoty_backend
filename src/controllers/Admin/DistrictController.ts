import { FastifyRequest, FastifyReply } from 'fastify';
import DistrictModel from '../../models/Admin/DistrictModel';
import knex from '../../db/knex';
import LogModel from '@/models/Admin/LogModel';
export default class DistrictController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const districts = await new DistrictModel().getAll(['id', 'name'],{ "city_id": id },'name')
      return {
        success: true,
        data: districts,
        message: 'Districts fetched successfully'
      };
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const district = await new DistrictModel().findId(id);
      return res.status(200).send({
        success: true,
        message: 'District fetched successfully',
        data: district
      });
    } catch (error) {
      return res.status(500).send({
        success: false, 
        message: 'Internal server error'
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, city_id } = req.body as { name: string, city_id: number }
      const exists = await new DistrictModel().exists({ name, city_id })
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'District already exists'
        });
      }
       await new DistrictModel().create({ name, city_id })
       const newDistrict: any = await new DistrictModel().first({ name, city_id })
       await new LogModel().createLog(req.user, 'create', 'districts', newDistrict);
      return {
        success: true,
        message: 'District created successfully',
        data: newDistrict
      };
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const { name, city_id } = req.body as { name: string, city_id: number }
      const exists = await new DistrictModel().exists({ name, city_id}, { id:  id })
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'District already exists'
        });
      }
       await new DistrictModel().update(id, { name, city_id })
       const updatedDistrict: any = await new DistrictModel().first({ name, city_id })
       await new LogModel().createLog(req.user, 'update', 'districts', updatedDistrict);
      return {
        success: true,
        message: 'District updated successfully',
        data: updatedDistrict
      };
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const exists = await new DistrictModel().exists({ id })
      if(!exists) {
        return res.status(404).send({
          success: false,
          message: 'District not found'
        });
      }
      await new DistrictModel().delete(id)
      await new LogModel().createLog(req.user, 'delete', 'districts', exists);
      return {
        success: true,
        message: 'District deleted successfully'
      };
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "", city_id = "" } = req.query as { page: number; limit: number; search: string; city_id: string };
      const query = knex("districts").join("cities", "districts.city_id", "cities.id")
      .where(function () {
        this.where("districts.name", "ilike", `%${search}%`);
        if (city_id) {
          this.where("districts.city_id", city_id);
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
        message: "Districts fetched successfully",
        data: data,
        total: total,
        totalPages: totalPages, 
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error
      });
    }
  }
}
function where(arg0: () => void) {
  throw new Error('Function not implemented.');
}

