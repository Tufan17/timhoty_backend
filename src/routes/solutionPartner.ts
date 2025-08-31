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
import visaGalleryRoutes from "./SolutionPartner/Visa/visaGallery";
import visaPackageFeatureRoutes from "./SolutionPartner/Visa/visaPackageFeature";
import carTypeRoutes from "./SolutionPartner/CarRental/carType";

import gearTypeRoutes from "./SolutionPartner/CarRental/gearType";
import carRentalRoutes from "./SolutionPartner/CarRental/carRental";
import carRentalGalleryRoutes from "./SolutionPartner/CarRental/carRentalGallery";
import visaPackageRoutes from "./SolutionPartner/Visa/visaPackage";
import visaPackageImageRoutes from "./SolutionPartner/Visa/visaPackageImage";
import carRentalFeatureRoutes from "./SolutionPartner/CarRental/carRentalFeature";
import stationRoutes from "./SolutionPartner/CarRental/station";
import pickUpDeliveryRoutes from "./SolutionPartner/CarRental/pickUpDelivery";
import carRentalPackageRoutes from "./SolutionPartner/CarRental/carRentalPackage";
import carRentalPackageImageRoutes from "./SolutionPartner/CarRental/carRentalPackageImage";
import carRentalPackageFeatureRoutes from "./SolutionPartner/CarRental/carRentalPackageFeature";
import tourRoutes from "./SolutionPartner/Tour/tour";
import tourGalleryRoutes from "./SolutionPartner/Tour/tourGallery";
import tourFeatureRoutes from "./SolutionPartner/Tour/tourFeature";
import tourProgramRoutes from "./SolutionPartner/Tour/tourProgram";

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
  fastify.register(hotelRoomOpportunityRoutes, {
    prefix: "/hotel-room-opportunities",
  });
  fastify.register(hotelRoomFeatureRoutes, { prefix: "/hotel-room-features" });
  fastify.register(hotelRoomImageRoutes, { prefix: "/hotel-room-images" });
  fastify.register(hotelRoomPackageRoutes, { prefix: "/hotel-room-packages" });
  fastify.register(hotelGalleryRoutes, { prefix: "/hotel-galleries" });

  // ===========================================
  // VISA ROUTES
  // ===========================================
  fastify.register(visaRoutes, { prefix: "/visas" });
  fastify.register(visaFeatureRoutes, { prefix: "/visa-features" });
  fastify.register(visaGalleryRoutes, { prefix: "/visa-galleries" });
  fastify.register(visaPackageRoutes, { prefix: "/visa-packages" });
  fastify.register(visaPackageImageRoutes, { prefix: "/visa-package-images" });
  fastify.register(visaPackageFeatureRoutes, {
    prefix: "/visa-package-features",
  });

  // ===========================================
  // CAR RENTAL ROUTES
  // ===========================================
  fastify.register(carTypeRoutes, { prefix: "/car-types" });
  fastify.register(gearTypeRoutes, { prefix: "/gear-types" });
  fastify.register(carRentalRoutes, { prefix: "/car-rentals" });
  fastify.register(carRentalGalleryRoutes, { prefix: "/car-rental-galleries" });
  fastify.register(carRentalFeatureRoutes, { prefix: "/car-rental-features" });
  fastify.register(stationRoutes, { prefix: "/stations" });
  fastify.register(pickUpDeliveryRoutes, { prefix: "/pick-up-delivery" });
  fastify.register(carRentalPackageRoutes, { prefix: "/car-rental-packages" });
  fastify.register(carRentalPackageImageRoutes, {
    prefix: "/car-rental-package-images",
  });
  fastify.register(carRentalPackageFeatureRoutes, {
    prefix: "/car-rental-package-features",
  });

  // ===========================================
  // TOUR ROUTES
  // ===========================================
  fastify.register(tourRoutes, { prefix: "/tours" });
  fastify.register(tourGalleryRoutes, { prefix: "/tour-galleries" });
  fastify.register(tourFeatureRoutes, { prefix: "/tour-features" });
  fastify.register(tourProgramRoutes, { prefix: "/tour-programs" });
}
