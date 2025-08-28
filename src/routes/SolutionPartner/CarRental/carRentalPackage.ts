import { FastifyInstance } from "fastify";
import { CarRentalPackageController } from "../../../controllers/SolutionPartner/CarRental/CarRentalPackageController";
import { carRentalPackageQuerySchema, carRentalPackageSchema, carRentalPackageUpdateSchema } from "../../../validators/CarRental/carRentalPackage";
import { makeAuditLogger } from "@/middlewares/logMiddleware";
import CarRentalPackageModel from "@/models/CarRentalPackageModel";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import { validateQuery } from "@/middlewares/validateQuery";
import { validate } from "@/middlewares/validate";

export default async function (fastify: FastifyInstance) {
    const controller = new CarRentalPackageController();

    const carRentalPackageAuditLogger = makeAuditLogger({
        targetName: "car_rental_packages",
        model: new CarRentalPackageModel(),
        idParam: "id",
        getUser: (request) => (request as any).user || {}
    });

    fastify.get("/", {
        preHandler: [authSolutionPartnerMiddleware],
        preValidation: [validateQuery(carRentalPackageQuerySchema)],
        handler: controller.dataTable,
    });

    fastify.get("/all", {
        preHandler: [authSolutionPartnerMiddleware],
        handler: controller.findAll,
    });

    fastify.get("/:id", {
        preHandler: [authSolutionPartnerMiddleware],
        handler: controller.findOne,
    });

    fastify.post("/", {
        preHandler: [authSolutionPartnerMiddleware, carRentalPackageAuditLogger],
        preValidation: [validate(carRentalPackageSchema)],
        handler: controller.create,
    });

    fastify.put("/:id", {
        preHandler: [authSolutionPartnerMiddleware, carRentalPackageAuditLogger],
        preValidation: [validate(carRentalPackageUpdateSchema)],
        handler: controller.update,
    });

    fastify.delete("/:id", {
        preHandler: [authSolutionPartnerMiddleware, carRentalPackageAuditLogger],
        handler: controller.delete,
    });
}
