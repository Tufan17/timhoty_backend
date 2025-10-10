import { FastifyInstance } from "fastify";
import { HotelRoomPackageController } from "../../../controllers/SolutionPartner/Hotel/HotelRoomPackageController";
import { hotelRoomPackageQuerySchema, hotelRoomPackageSchema, hotelRoomPackageUpdateSchema } from "../../../validators/Hotel/hotelRoomPackage";
import { makeAuditLogger } from "@/middlewares/logMiddleware";
import HotelRoomPackageModel from "@/models/HotelRoomPackageModel";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import { validateQuery } from "@/middlewares/validateQuery";
import { validate } from "@/middlewares/validate";

export default async function (fastify: FastifyInstance) {
    const controller = new HotelRoomPackageController();

    const hotelRoomPackageAuditLogger = makeAuditLogger({
        targetName: "hotel_room_packages",
        model: new HotelRoomPackageModel(),
        idParam: "id",
        getUser: (request) => (request as any).user || {}
      });
      fastify.get("/", {
        preHandler: [authSolutionPartnerMiddleware],
        preValidation: [validateQuery(hotelRoomPackageQuerySchema)],
        handler: controller.dataTable,
      });
    
      fastify.get("/all/:hotel_room_id", {
        preHandler: [authSolutionPartnerMiddleware],
        handler: controller.findAll,
      });
        
      fastify.get("/:id", {
        // preHandler: [authSolutionPartnerMiddleware],
        handler: controller.findOne,
      });
      
      fastify.post("/", {
        preHandler: [authSolutionPartnerMiddleware, hotelRoomPackageAuditLogger],
        preValidation: [validate(hotelRoomPackageSchema)],
        handler: controller.create,
      });
    
      fastify.put("/:id", {
        preHandler: [authSolutionPartnerMiddleware, hotelRoomPackageAuditLogger],
        preValidation: [validate(hotelRoomPackageUpdateSchema)],
        handler: controller.update,
      });
    
      fastify.delete("/:id", {
        preHandler: [authSolutionPartnerMiddleware, hotelRoomPackageAuditLogger],
        handler: controller.delete,
      });
}
