import { FastifyReply, FastifyRequest } from 'fastify';
import AdminModel from '../../models/Admin/AdminModel';
import knex from '../../db/knex';
import LogModel from '../../models/Admin/LogModel';
export default class AdminController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };
      const query = knex("admins")
        .whereNull("admins.deleted_at")
        .where(function () {
          this.where("name_surname", "ilike", `%${search}%`)
            .orWhere("email", "ilike", `%${search}%`);
          if (search.toLowerCase() === 'true' || search.toLowerCase() === 'false') {
            this.orWhere("status", search.toLowerCase() === 'true');
          }
        });
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
    
      return res.status(200).send({
        success: true,
        message: 'Admins fetched successfully',
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
        message: 'Admins fetch failed',
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const admin = await new AdminModel().findId(id);
      return res.status(200).send({
        success: true,
        message: 'Admin fetched successfully',
        data: admin
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Admin fetching failed',
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name_surname, email, password } = req.body as { 
        name_surname: string;
        email: string; 
        password: string;
      };
      const exists = await new AdminModel().exists({ email });
      if (exists) {
        return res.status(400).send({
          success: false,
          message: 'Admin email already exists',
        }); 
      }
      await new AdminModel().create({ name_surname, email, password });
      
      const admin: any = await new AdminModel().first({ email });

      await new LogModel().createLog(req.user, 'create', 'admins', admin);
      return res.status(200).send({
        success: true,
        message: 'Admin created successfully',
        data: admin
      }); 
    } catch (error) {
      console.log(error)
      return res.status(500).send({
        success: false,
        message: 'Admin creation failed',
      }); 
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name_surname, email, password } = req.body as { 
        name_surname?: string;
        email?: string; 
        password?: string;
      };
      const { id } = req.params as { id: string };
      const exists = await new AdminModel().findId(id);
      if (!exists) {
        return res.status(400).send({
          success: false,
          message: 'Admin not found',
        }); 
      }
    
      let body: any = {
        id: id,
        name_surname: name_surname || exists.name_surname,
        email: email || exists.email,
      };

      if (password) {
        body.password = password;
      }


      const admin = await new AdminModel().update(id, body);
      await new LogModel().createLog(req.user, 'update', 'admins', body);
      return res.status(200).send({
        success: true,
        message: 'Admin updated successfully',
        data: admin
      }); 
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Admin update failed',
      }); 
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try { 
      const { id } = req.params as { id: string };
      const exists = await new AdminModel().findId(id);
      if (!exists) {
        return res.status(400).send({
          success: false,
          message: 'Admin not found',
        }); 
      }
      const admin = await new AdminModel().delete(id);
      await new LogModel().createLog(req.user, 'delete', 'admins', exists);
      return res.status(200).send({
        success: true,
        message: 'Admin deleted successfully',
        data: admin
      }); 
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Admin deletion failed',
      }); 
    }
  }
}
