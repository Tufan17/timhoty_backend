import { FastifyRequest, FastifyReply } from 'fastify';
import LandingModel from '@/models/Admin/LandingModel';
import knex from '@/db/knex';
import { saveUploadedFile } from '../../utils/fileUpload';
import LogModel from '@/models/Admin/LogModel';

export default class LandingController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string };

      const query = knex("landing").where(function () { 
        this.where("title", "ilike", `%${search}%`);
      });

      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));  

      const rawData = await query
        .clone()
        .select("id", "title", "description", "platform", "image", "created_at", "updated_at")
        .orderBy("created_at", "desc")
        .whereNull("deleted_at")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: 'Landing fetched successfully',
        data: rawData,
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
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const parts = req.parts();
      const fields: Record<string, string> = {};
      for await (const part of parts) {
        if (part.type === 'file' ) {
          if (part.fieldname === "image") {
            fields[part.fieldname] = await saveUploadedFile(part, "landing");
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      // Validate required fields
      for (const key of ['title', 'description', 'platform', 'image'] as const) {
        if (!fields[key]) {
          return res.status(400).send({
            success: false,
            message: `${key} is required`,
          });
        }
      }

      // Create the landing record
      const landingData = {
        title: fields.title,
        description: fields.description,
        platform: fields.platform,
        image: fields.image,
      };
      await new LandingModel().create(landingData);

      // Fetch the newly created record (to get its id, timestamps, etc.)
      const newLanding: any = await new LandingModel().first(landingData);

      // Log the creation
      await new LogModel().createLog(req.user, 'create', 'landing', newLanding);

      return res.status(200).send({
        success: true,
        message: 'Landing created successfully',
        data: newLanding,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }     
  

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const { id } = req.params as { id: string };

      const landing = await new LandingModel().findId(id);
      if (!landing) {
        return res.status(404).send({
          success: false,
          message: "Landing not found",
        });
      }

      const parts = req.parts();
      const fields: Record<string, any> = {};
      let hasFileField = false;

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "image") {
            hasFileField = true;
            if (part.filename) {
              fields[part.fieldname] = await saveUploadedFile(part, "landing");
            }
          }
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      const body: Record<string, any> = {};

      if (fields.title !== undefined) body.title = fields.title;
      if (fields.description !== undefined) body.description = fields.description;
      if (fields.platform !== undefined) body.platform = fields.platform;
      
      if (hasFileField && fields.image) {
        body.image = fields.image;
      }

      await new LandingModel().update(id, body);
      await new LogModel().createLog(req.user, 'update', 'landing', landing);

      const updatedLanding = await new LandingModel().findId(id);

      return res.status(200).send({
        success: true,
        message: "Landing updated successfully",
        data: updatedLanding
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Landing update failed",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const exists = await new LandingModel().exists({ id })
      if(!exists) {
        return res.status(404).send({
          success: false,
          message: 'Landing not found'
        });
      }
      await new LandingModel().delete(id)
      await new LogModel().createLog(req.user, 'delete', 'landing', exists);
      return {
        success: true,
        message: 'Landing deleted successfully'
      };
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}