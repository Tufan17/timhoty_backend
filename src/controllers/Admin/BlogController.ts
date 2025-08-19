import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import BlogModel from "@/models/BlogModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class BlogController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const language = req.language;

      const query = knex("blogs")
        .whereNull("blogs.deleted_at")
        .innerJoin("blog_pivots", "blogs.id", "blog_pivots.blog_id")
        .where("blog_pivots.language_code", language)
        .where(function () {
          this.where("blog_pivots.title", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("blogs.status", search.toLowerCase() === "true");
          }
        })
        .select("blogs.*", "blog_pivots.title as title","blog_pivots.description as description")
        .groupBy("blogs.id", "blog_pivots.title","blog_pivots.description");
        
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("blogs.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("BLOG.BLOG_FETCHED_SUCCESS"),
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
        message: req.t("BLOG.BLOG_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const blog = await new BlogModel().oneToMany(id, "blog_pivots", "blog_id");
      
      return res.status(200).send({
        success: true,
        message: req.t("BLOG.BLOG_FETCHED_SUCCESS"),
        data: blog,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("BLOG.BLOG_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { title, description, photo_url, service_type, status, highlight } = req.body as {
        title: string;
        description: string;
        photo_url: string;
        service_type: string;
        status?: boolean;
        highlight?: boolean;
      };

      const blog = await new BlogModel().create({
        photo_url,
        service_type,
        status: status || true,
        highlight: highlight || false,
      });
      const translateResult = await translateCreate({
        target: "blog_pivots",
        target_id_key: "blog_id",
        target_id: blog.id,
        data: {
          title,
          description,
        },
      });
      blog.blog_pivots = translateResult;


      return res.status(200).send({
        success: true,
        message: req.t("BLOG.BLOG_CREATED_SUCCESS"),
        data: blog,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("BLOG.BLOG_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { title, description, photo_url, service_type, status, highlight } = req.body as {
        title: string;
        description: string;
        photo_url: string;
        service_type: string;
        status?: boolean;
        highlight?: boolean;
      };

      const existingBlog = await new BlogModel().first({ id });

      if (!existingBlog) {
        return res.status(404).send({
          success: false,
          message: req.t("BLOG.BLOG_NOT_FOUND"),
        });
      }

      let body: any = {
        photo_url: photo_url || existingBlog.photo_url,
        service_type: service_type || existingBlog.service_type,
        status,
        highlight,
      };

      await new BlogModel().update(id, body);
      await translateUpdate({
        target: "blog_pivots",
        target_id_key: "blog_id",
        target_id: id,
        data: {
          title,
          description,
        },
      });
      const updatedBlog = await new BlogModel().oneToMany(id, "blog_pivots", "blog_id");

      return res.status(200).send({
        success: true,
        message: req.t("BLOG.BLOG_UPDATED_SUCCESS"),
        data: updatedBlog,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("BLOG.BLOG_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingBlog = await new BlogModel().first({ id });

      if (!existingBlog) {
        return res.status(404).send({
          success: false,
          message: req.t("BLOG.BLOG_NOT_FOUND"),
        });
      }

      await new BlogModel().delete(id);
      await knex("blog_pivots").where("blog_id", id).whereNull("deleted_at").update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("BLOG.BLOG_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("BLOG.BLOG_DELETED_ERROR"),
      });
    }
  }
}
