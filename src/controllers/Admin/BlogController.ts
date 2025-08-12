import { FastifyRequest, FastifyReply } from "fastify";
import BlogModel from "../../models/Admin/BlogModel";
import { MultipartFile } from "@fastify/multipart";
import { saveUploadedFile } from "../../utils/fileUpload";
import knex from "../../db/knex";
import LogModel from "@/models/Admin/LogModel";

export default class BlogController {

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        insurance_type_ids = "",
      } = req.query as { page: number; limit: number; search: string; insurance_type_ids: string };
  
      const baseQuery = knex("blogs")
      .join("insurance_types", "blogs.insurance_type_id", "insurance_types.id")
      .join("admins", "blogs.created_by", "admins.id")
      .whereNull("blogs.deleted_at")
      .andWhere(function () {
        this.where("blogs.title", "ilike", `%${search}%`)
          .orWhere("blogs.description", "ilike", `%${search}%`)
          .orWhere("blogs.content", "ilike", `%${search}%`)
          .orWhere("insurance_types.name", "ilike", `%${search}%`)
          .orWhere("admins.name_surname", "ilike", `%${search}%`);
    
        if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
          this.orWhere("blogs.status", search.toLowerCase() === "true");
        }
      });

      // Add insurance_type_ids filter as a separate AND condition
      if (insurance_type_ids && insurance_type_ids.trim() !== "") {
        const typeIds = insurance_type_ids.split(",").map(id => id.trim()).filter(id => id !== "");
        if (typeIds.length > 0) {
          baseQuery.whereIn("blogs.insurance_type_id", typeIds);
        }
      }

    
    const countResult = await baseQuery.clone().count("* as total").first();
    const total = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(total / Number(limit));
    
    const rawData = await baseQuery
      .clone()
      .select(
        "blogs.*",
        "insurance_types.id as insurance_type_id",
        "insurance_types.name as insurance_type_name",
        "admins.id as admin_id",
        "admins.name_surname as admin_name"
      )
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));
    
      
    const data = rawData.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      description: row.description,
      imageUrl: row.imageUrl,
      insurance_type: {
        id: row.insurance_type_id,
        name: row.insurance_type_name,
      },
      admin: {
        id: row.admin_id,
        name: row.admin_name,
      },
    }));
    
    // Get unique insurance type IDs from active blogs
    const insuranceTypeIdsResult = await knex("blogs")
      .select("insurance_type_id")
      .whereNull("deleted_at")
      .andWhere("status", true)
      .distinct();
    
    const insuranceTypeIds = insuranceTypeIdsResult.map(row => row.insurance_type_id);
    
    const insurance_types = await knex("insurance_types")
      .whereIn("id", insuranceTypeIds)
      .select("id", "name");
    
    return res.status(200).send({
      success: true,
      message: "Blogs fetched successfully",
      data,
      insurance_types: insurance_types,
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
        message: "Blogs fetch failed",
      });
    }
  }
  
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      
      // Use a more specific query to avoid ambiguous column references
      const blog = await knex("blogs")
        .join("insurance_types", "blogs.insurance_type_id", "insurance_types.id")
        .where("blogs.id", id)
        .whereNull("blogs.deleted_at")
        .select(
          "blogs.*",
          "insurance_types.id as insurance_type_id",
          "insurance_types.name as insurance_type_name"
        )
        .first();

      if (!blog) {
        return res.status(404).send({
          success: false,
          message: "Blog not found",
        });
      }

      // Format the response to match the expected structure
      const formattedBlog = {
        ...blog,
        insurance_type: {
          id: blog.insurance_type_id,
          name: blog.insurance_type_name,
        }
      };

      // Remove the redundant fields
      delete formattedBlog.insurance_type_id;
      delete formattedBlog.insurance_type_name;

      return res.status(200).send({
        success: true,
        message: "Blog fetched successfully",
        data: formattedBlog,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Blog fetch failed",
        error: error,
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const parts = req.parts();

      const fields: Record<string, string> = {};
      let image: MultipartFile | null = null;
      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "imageUrl") {
            fields[part.fieldname] = await saveUploadedFile(part, "blogs");
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }
      const blog = {
        title: fields.title,
        content: fields.content,
        imageUrl: fields.imageUrl,
        description: fields.description,
        insurance_type_id: fields.insurance_type_id,
      };

      for (const key in blog) {
        if (!blog[key as keyof typeof blog]) {
          return res.status(400).send({
            success: false,
            message: `${key} is required`,
          });
        }
      }

      const body = {
        title: fields.title,
        content: fields.content,
        imageUrl: fields.imageUrl,
        description: fields.description,
        insurance_type_id: fields.insurance_type_id,
        status: true,
        created_by: user.id,
        updated_by: user.id,
      };

      await new BlogModel().create(body);

      const newBlog: any = await new BlogModel().first({ title: body.title, description: body.description, content: body.content, imageUrl: body.imageUrl, insurance_type_id: body.insurance_type_id });

      await new LogModel().createLog(req.user, 'create', 'blogs', newBlog);

      return res.status(200).send({
        success: true,
        message: "Blog created successfully",
        data: body,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Blog creation failed",
      });
    }
  }
  
  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = req.user as any;
      const { id } = req.params as { id: string };

      const blog = await new BlogModel().findId(id);
      if (!blog) {
        return res.status(404).send({
          success: false,
          message: "Blog not found",
        });
      }

      const parts = req.parts();
      const fields: Record<string, any> = {};
      let hasFileField = false;

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "imageUrl") {
            hasFileField = true;
            if (part.filename) {
              fields[part.fieldname] = await saveUploadedFile(part, "blogs");
            }
          }
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      const body: Record<string, any> = {
        updated_by: user.id
      };

      if (fields.title !== undefined) body.title = fields.title;
      if (fields.description !== undefined) body.description = fields.description;
      if (fields.content !== undefined) body.content = fields.content;
      if (fields.insurance_type_id !== undefined) body.insurance_type_id = fields.insurance_type_id;
      
      if (hasFileField && fields.imageUrl) {
        body.imageUrl = fields.imageUrl;
      }

      if (fields.status !== undefined) {
        body.status = fields.status === 'true' || fields.status === true;
      }

      await new BlogModel().update(id, body);
      await new LogModel().createLog(req.user, 'update', 'blogs', blog);

      const updatedBlog = await new BlogModel().findId(id);

      return res.status(200).send({
        success: true,
        message: "Blog updated successfully",
        data: updatedBlog
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Blog update failed",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const blog = await new BlogModel().delete(id);
      await new LogModel().createLog(req.user, 'delete', 'blogs', blog);
      return res.status(200).send({
        success: true,
        message: "Blog deleted successfully",
        data: blog,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Blog deletion failed",
      });
    }
  }
  async findAllEndEight(req: FastifyRequest, res: FastifyReply) {
    try {
      const blogs = await knex("blogs")
        .whereNull("blogs.deleted_at")
        .andWhere("blogs.status", true)
        .orderBy("blogs.created_at", "asc")
        .select("title", "id")
        .limit(8);
      return res.status(200).send({
        success: true,
        message: "Blogs fetched successfully",
        data: blogs,
      });
    } catch (error) {
      return res.status(500).send({ 
        success: false,
        message: "Blogs fetch failed",
      });
    }
  }
  async findAllActiveFive(req: FastifyRequest, res: FastifyReply) {
    try {
      const baseQuery = knex("blogs")
        .join(
          "insurance_types",
          "blogs.insurance_type_id",
          "insurance_types.id"
        )
        .whereNull("blogs.deleted_at")
        .andWhere("blogs.status", true)
        .orderBy("blogs.created_at", "asc")
        .limit(5)
        .select("blogs.*", "insurance_types.name as insurance_type_name");

      const blogs = await baseQuery;
      return res.status(200).send({
        success: true,
        message: "Blogs fetched successfully",
        data: blogs,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Campaigns fetch failed",
      });
    }
  }
}
