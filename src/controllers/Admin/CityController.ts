import { FastifyRequest, FastifyReply } from 'fastify';
import CityModel from '../../models/Admin/CityModel';
import knex from '../../db/knex';
import LogModel from '@/models/Admin/LogModel';
export default class CityController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };

      const query = knex("cities").where(function () {
        this.where("name", "ilike", `%${search}%`);
        if (!isNaN(Number(search))) {
          this.orWhere("number_plate", Number(search));
        }
      });

      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const data = await query
        .clone()
        .orderBy("created_at", "asc")
        .whereNull("cities.deleted_at")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: 'Cities fetched successfully',
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
        message: 'Internal server error',
        error: error
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const city = await new CityModel().findId(id);
      return res.status(200).send({
        success: true,
        message: 'City fetched successfully',
        data: city
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
      const { name, number_plate } = req.body as { name: string, number_plate: number }
      const exists = await new CityModel().exists({ number_plate })
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'City already exists'
        });
      }
       await new CityModel().create({ name, number_plate })
       const newCity: any = await new CityModel().first({ name, number_plate })
       await new LogModel().createLog(req.user, 'create', 'cities', newCity);
      return {
        success: true,
        message: 'City created successfully',
        data: [newCity]
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
      const { name, number_plate } = req.body as { name: string, number_plate: number }
      const exists = await new CityModel().exists({ number_plate}, { id:  id })
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'City already exists'
        });
      }
       await new CityModel().update(id, { name, number_plate })
       await new LogModel().createLog(req.user, 'update', 'cities', exists);
      return {
        success: true,
        message: 'City updated successfully'
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
      const exists = await new CityModel().exists({ id })
      if(!exists) {
        return res.status(404).send({
          success: false,
          message: 'City not found'
        });
      }
      await new CityModel().delete(id)
      await new LogModel().createLog(req.user, 'delete', 'cities', exists);
      return {
        success: true,
        message: 'City deleted successfully'
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
      const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };
  
      const query = knex("cities").where(function () {
        this.where("name", "ilike", `%${search}%`);
        if (!isNaN(Number(search))) {
          this.orWhere("number_plate", Number(search));
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
        message: 'Cities fetched successfully',
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
        message: 'Internal server error',
        error: error
      });
    }
  }
}