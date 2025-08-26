import { FastifyInstance } from "fastify";
import cityRoutes from "./SolutionPartner/city";
import countryRoutes from "./SolutionPartner/country";
import hotelRoutes from "./SolutionPartner/Hotel/hotel";
import hotelOpportunityRoutes from "./SolutionPartner/Hotel/hotelOpportunity";
import hotelFeatureRoutes from "./SolutionPartner/Hotel/hotelFeature";
import hotelRoomRoutes from "./SolutionPartner/Hotel/hotelRoom";
import hotelRoomOpportunityRoutes from "./SolutionPartner/Hotel/hotelRoomOpportunity";
import hotelRoomFeatureRoutes from "./SolutionPartner/Hotel/hotelRoomFeature";
import hotelRoomImageRoutes from "./SolutionPartner/Hotel/hotelRoomImage";
import hotelRoomPackageRoutes from "./SolutionPartner/Hotel/hotelRoomPackage";
import hotelGalleryRoutes from "./SolutionPartner/Hotel/hotelGallery";
import currencyRoutes from "./SolutionPartner/currency";
import visaRoutes from "./SolutionPartner/Visa/visa";
import visaFeatureRoutes from "./SolutionPartner/Visa/visaFeature";

export default async function solutionPartnerRoutes(fastify: FastifyInstance) {

    fastify.register(countryRoutes, { prefix: "/countries" });
    fastify.register(cityRoutes, { prefix: "/cities" });

    fastify.register(currencyRoutes, { prefix: "/currencies" });


    // ===========================================
    // HOTEL ROUTES
    // ===========================================
    fastify.register(hotelRoutes, { prefix: "/hotels" });
    fastify.register(hotelOpportunityRoutes, { prefix: "/hotel-opportunities" });
    fastify.register(hotelFeatureRoutes, { prefix: "/hotel-features" });
    fastify.register(hotelRoomRoutes, { prefix: "/hotel-rooms" });
    fastify.register(hotelRoomOpportunityRoutes, { prefix: "/hotel-room-opportunities" });
    fastify.register(hotelRoomFeatureRoutes, { prefix: "/hotel-room-features" });
    fastify.register(hotelRoomImageRoutes, { prefix: "/hotel-room-images" });
    fastify.register(hotelRoomPackageRoutes, { prefix: "/hotel-room-packages" });
    fastify.register(hotelGalleryRoutes, { prefix: "/hotel-galleries" });

    // ===========================================
    // VISA ROUTES
    // ===========================================
    fastify.register(visaRoutes, { prefix: "/visas" });
    fastify.register(visaFeatureRoutes, { prefix: "/visa-features" });

}

