import { FastifyRequest, FastifyReply } from 'fastify';
import JobModel from '../../models/Admin/JobModel';
import LogModel from '@/models/Admin/LogModel';
import knex from '@/db/knex';

export default class JobController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const baseQuery = knex("jobs")
        .whereNull("deleted_at")
        .andWhere(function () {
          this.where("name", "ilike", `%${search}%`);
        });

      const countResult = await baseQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const rawData = await baseQuery
        .clone()
        .select("id", "name")
        .orderBy("created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const data = rawData.map((row) => ({
        id: row.id,
        name: row.name,
      }));

      return res.status(200).send({
        success: true,
        message: "Jobs fetched successfully",
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
        message: "Internal server error",
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const jobs = await new JobModel().findId(id);
      return res.status(200).send({
        success: true,
        message: 'Job fetched successfully',
        data: jobs
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
      const { name } = req.body as { name: string }
      const exists = await new JobModel().exists({ name })
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'Job already exists'
        });
      }
       await new JobModel().create({ name })
       const newJob: any = await new JobModel().first({ name })
       await new LogModel().createLog(req.user, 'create', 'jobs', newJob);
      return {
        success: true,
        message: 'Job created successfully'
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
      const { name } = req.body as { name: string }
      const exists = await new JobModel().exists({ name}, { id:  id })
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'Job already exists'
        });
      }
       await new JobModel().update(id, { name })
       const updatedJob: any = await new JobModel().first({ name })
       await new LogModel().createLog(req.user, 'update', 'jobs', updatedJob);
      return {
        success: true,
        message: 'Job updated successfully'
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
      const exists = await new JobModel().exists({ id })
      if(!exists) {
        return res.status(404).send({
          success: false,
          message: 'Job not found'
        });
      }
      await new JobModel().delete(id)
      await new LogModel().createLog(req.user, 'delete', 'jobs', exists);
      return {
        success: true,
        message: 'Job deleted successfully'
      };
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getJobList(req: FastifyRequest, res: FastifyReply) {
    try {
      const jobs = await new JobModel().getAll(["id", "name", "deleted_at"],{},"name");
      return res.status(200).send({
        success: true,
        message: 'Job list fetched successfully',
        data: jobs
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  
}