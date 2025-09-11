import { FastifyRequest, FastifyReply } from "fastify";
import CampaignModel from "@/models/CampaignModel";
import BlogModel from "@/models/BlogModel";
import CityModel from "@/models/CityModel";
import HotelModel from "@/models/HotelModel";
import TourModel from "@/models/TourModel";
import CarRentalModel from "@/models/CarRentalModel";
import VisaModel from "@/models/VisaModel";
import FaqModel from "@/models/FaqModel";

export default class DashboardController {
  async index(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language || "en";
      const campaignModel = new CampaignModel();
      const blogModel = new BlogModel();
      const locationModel = new CityModel();
      const hotelModel = new HotelModel();
      const tourModel = new TourModel();
      const carRentalModel = new CarRentalModel();
      const visaModel = new VisaModel();
      const faqModel = new FaqModel();
        
      const [campaigns, blogs, locations, hotels, tours, carRentals, visas, faqs] = await Promise.all([
        campaignModel.getDashboardCampaigns(language),
        blogModel.getDashboardBlogs(language),
        locationModel.getDashboardCities(language),
        hotelModel.getDashboardHotels(language),
        tourModel.getDashboardTours(language),
        carRentalModel.getDashboardCarRentals(language),
        visaModel.getDashboardVisas(language),
        faqModel.getDashboardFaqs(language)
      ]);

      return res.status(200).send({
        success: true,
        message: "Dashboard data fetched successfully",
        data: { campaigns, blogs, locations, hotels, tours, carRentals, visas, faqs }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      return res.status(500).send({
        success: false,
        message: "Dashboard data fetch failed"
      });
    }
  }

  async campaign(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const {page = 1, limit = 4} = req.query as {page: number, limit: number};
      
      const campaignModel = new CampaignModel();
      const blogModel = new BlogModel();
      
      const [campaignData, blogs] = await Promise.all([
        campaignModel.getCampaignsPaginated(language, page, limit),
        blogModel.getDashboardBlogs(language, 5)
      ]);

      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data: {
          campaigns: campaignData.campaigns,
          blogs,
          totalPages: campaignData.totalPages,
          total: campaignData.total
        }
      });
    } catch (error) {
      console.error('Campaign error:', error);
      return res.status(500).send({
        success: false,
        message: "Campaign fetch failed"
      });
    }
  }

  async cities(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const cityModel = new CityModel();
      const cities = await cityModel.getCitiesAndCountries(language);
      return res.status(200).send({
        success: true,
        message: "Cities fetched successfully",
        data: cities
      });
    }catch(error){
      console.error('Cities error:', error);
      return res.status(500).send({
        success: false,
        message: "Cities fetch failed"
      });
    }
  } 

}
