import { FastifyInstance } from "fastify";
import BlogController from "../controllers/Admin/BlogController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { blogSchema, blogUpdateSchema } from "@/validators/blog";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import BlogModel from "@/models/BlogModel";
import { validateFormData } from "@/middlewares/validateFormData";

export default async function blogRoutes(fastify: FastifyInstance) {
  const blogController = new BlogController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "blogs",
    model: new BlogModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: blogController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: blogController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(blogSchema)],
    handler: blogController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(blogUpdateSchema)],
    handler: blogController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    handler: blogController.delete,
  });
}
