import { FastifyInstance } from "fastify";
import cityRoutes from "./SolutionPartner/city";
import countryRoutes from "./SolutionPartner/country";
import hotelRoutes from "./SolutionPartner/Hotel/hotel";
import hotelOpportunityRoutes from "./SolutionPartner/Hotel/hotelOpportunity";
import hotelFeatureRoutes from "./SolutionPartner/Hotel/hotelFeature";
import hotelRoomRoutes from "./SolutionPartner/Hotel/hotelRoom";
import hotelRoomOpportunityRoutes from "./SolutionPartner/Hotel/hotelRoomOpportunity";


export default async function solutionPartnerRoutes(fastify: FastifyInstance) {

    fastify.register(countryRoutes, { prefix: "/countries" });
    fastify.register(cityRoutes, { prefix: "/cities" });

    // ===========================================
    // HOTEL ROUTES
    // ===========================================
    fastify.register(hotelRoutes, { prefix: "/hotels" });
    fastify.register(hotelOpportunityRoutes, { prefix: "/hotel-opportunities" });
    fastify.register(hotelFeatureRoutes, { prefix: "/hotel-features" });
    fastify.register(hotelRoomRoutes, { prefix: "/hotel-rooms" });
    fastify.register(hotelRoomOpportunityRoutes, { prefix: "/hotel-room-opportunities" });
    
}

