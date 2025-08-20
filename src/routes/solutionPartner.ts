import { FastifyInstance } from "fastify";
import cityRoutes from "./SolutionPartner/city";
import countryRoutes from "./SolutionPartner/country";
import hotelRoutes from "./SolutionPartner/Hotel/hotel";


export default async function solutionPartnerRoutes(fastify: FastifyInstance) {

    fastify.register(countryRoutes, { prefix: "/countries" });
    fastify.register(cityRoutes, { prefix: "/cities" });

    // ===========================================
    // HOTEL ROUTES
    // ===========================================
    fastify.register(hotelRoutes, { prefix: "/hotels" });
}

