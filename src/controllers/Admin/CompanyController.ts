import { FastifyRequest, FastifyReply } from 'fastify';
import CompanyModel from '../../models/Admin/CompanyModel';
import { saveUploadedFile } from '../../utils/fileUpload';
import LogModel from '@/models/Admin/LogModel';
import knex from '@/db/knex';

export default class JobController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };

      const query = knex("companies").where(function () {
        this.where("name", "ilike", `%${search}%`);
      });

      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      const data = await query
        .clone()
        .select(['id', 'name', 'status', 'suggested', 'logo', 'created_at', 'updated_at'])
        .orderBy("created_at", "desc")
        .whereNull("companies.deleted_at")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: 'Companies fetched successfully',
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

  async findAllList(req: FastifyRequest, res: FastifyReply) {
    try {
      const companies = await new CompanyModel().getAll();
      return res.status(200).send({
        success: true,
        message: 'Companies fetched successfully',
        data: companies
      });
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
      const company = await new CompanyModel().findId(id);
      return res.status(200).send({
        success: true,
        message: 'Company fetched successfully',
        data: company
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
      const parts = req.parts();

      const fields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "logo") {
            fields[part.fieldname] = await saveUploadedFile(part, "companies");
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      const company = {
        name: fields.name,
        suggested: fields.suggested,
        logo: fields.logo,
      }; 
      let exists = false;
       exists = await new CompanyModel().exists({ suggested: true })
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'Suggested company already exists'
        });
      }
      exists = await new CompanyModel().exists({ name: company.name })
      const newCompany: any = await new CompanyModel().first({ name: company.name })
      await new LogModel().createLog(req.user, 'create', 'companies', newCompany);
      if(exists) {
        return res.status(400).send({
          success: false,
          message: 'Company already exists'
        });
      }
       await new CompanyModel().create(company)
      return {
        success: true,
        message: 'Company created successfully'
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
      const parts = req.parts();
      const { id } = req.params as { id: string }
      const fields: Record<string, string> = {};
      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "logo") {
            fields[part.fieldname] = await saveUploadedFile(part, "companies");
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }
      const exists = await new CompanyModel().first({ id: id })
      if(!exists) {
        return res.status(404).send({
          success: false,
          message: 'Company not found'
        });
      } 
      const company = {
        name: fields.name||exists.name,
        suggested: fields.suggested||exists.suggested,
        logo: fields.logo||exists.logo,
        status: fields.status||exists.status,
      };
      const existsName = await knex('companies')
        .where({ name: company.name })
        .whereNot({ id: id })
        .whereNull('deleted_at')
        .first();
      await new LogModel().createLog(req.user, 'update', 'companies', exists);
      if(existsName) {
        return res.status(400).send({
          success: false,
          message: 'Company already exists'
        });
      } 
      
      await new CompanyModel().update(id, company)
      return {
        success: true,
        message: 'Company updated successfully'
      };
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const exists = await new CompanyModel().exists({ id })
      if(!exists) {
        return res.status(404).send({
          success: false,
          message: 'Job not found'
        });
      }
      await new CompanyModel().delete(id)
      await new LogModel().createLog(req.user, 'delete', 'companies', exists);
      return {
        success: true,
        message: 'Company deleted successfully'
      };
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  
}