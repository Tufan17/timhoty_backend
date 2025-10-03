import { FastifyRequest, FastifyReply } from "fastify";
import CampaignModel from "@/models/CampaignModel";
import BlogModel from "@/models/BlogModel";
import CityModel from "@/models/CityModel";
import HotelModel from "@/models/HotelModel";
import TourModel from "@/models/TourModel";
import CarRentalModel from "@/models/CarRentalModel";
import VisaModel from "@/models/VisaModel";
import FaqModel from "@/models/FaqModel";
import ActivityModel from "@/models/ActivityModel";
import EmailSubscriptionModel from "@/models/EmailSubscriptionModel";
import sendMail from "@/utils/mailer";

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
      const activityModel = new ActivityModel();

      const [
        campaigns,
        blogs,
        locations,
        hotels,
        tours,
        carRentals,
        visas,
        faqs,
        activities,
      ] = await Promise.all([
        campaignModel.getDashboardCampaigns(language),
        blogModel.getDashboardBlogs(language),
        locationModel.getDashboardCities(language),
        hotelModel.getDashboardHotels(language),
        tourModel.getDashboardTours(language),
        carRentalModel.getDashboardCarRentals(language),
        visaModel.getDashboardVisas(language),
        faqModel.getDashboardFaqs(language),
        activityModel.getDashboardActivities(language),
      ]);

      return res.status(200).send({
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
          campaigns,
          blogs,
          locations,
          hotels,
          tours,
          carRentals,
          visas,
          faqs,
          activities,
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      return res.status(500).send({
        success: false,
        message: "Dashboard data fetch failed",
      });
    }
  }

  async campaigns(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const {
        page = 1,
        limit = 9,
        service_type,
      } = req.query as { page: number; limit: number; service_type: string };

      const campaignModel = new CampaignModel();
      const blogModel = new BlogModel();

      const [campaignData, blogs] = await Promise.all([
        campaignModel.getCampaignsPaginated(
          language,
          page,
          limit,
          service_type
        ),
        blogModel.getDashboardBlogs(language, 5),
      ]);

      return res.status(200).send({
        success: true,
        message: "Campaigns fetched successfully",
        data: {
          campaigns: campaignData.campaigns,
          blogs,
          totalPages: campaignData.totalPages,
          total: campaignData.total,
        },
      });
    } catch (error) {
      console.error("Campaign error:", error);
      return res.status(500).send({
        success: false,
        message: "Campaign fetch failed",
      });
    }
  }

  async campaign(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language ?? "en";
      const { id } = req.params as { id: string };

      const campaignModel = new CampaignModel();
      const campaign = await campaignModel.getCampaignById(language, id);
      return res.status(200).send({
        success: true,
        message: "Campaign fetched successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Campaign error:", error);
      return res.status(500).send({
        success: false,
        message: "Campaign fetch failed",
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
        data: cities,
      });
    } catch (error) {
      console.error("Cities error:", error);
      return res.status(500).send({
        success: false,
        message: "Cities fetch failed",
      });
    }
  }

  async blogs(req: FastifyRequest, res: FastifyReply) {
    try {
      const { service_type } = req.query as { service_type: string };
      const language = (req as any).language;
      const blogModel = new BlogModel();
      const blogs = await blogModel.getDashboardBlogs(
        language,
        8,
        service_type
      );
      return res.status(200).send({
        success: true,
        message: "Blogs fetched successfully",
        data: blogs,
      });
    } catch (error) {
      console.error("Blogs error:", error);
      return res.status(500).send({
        success: false,
        message: "Blogs fetch failed",
      });
    }
  }
  async blog(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { id } = req.params as { id: string };
      const blogModel = new BlogModel();
      const blog = await blogModel.getBlogById(language, id);
      return res.status(200).send({
        success: true,
        message: "Blog fetched successfully",
        data: blog,
      });
    } catch (error) {
      console.error("Blog error:", error);
      return res.status(500).send({
        success: false,
        message: "Blog fetch failed",
      });
    }
  }

  async subscription(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { email } = req.body as { email: string };
      const subscriptionModel = new EmailSubscriptionModel();

      const existingSubscription = await subscriptionModel.first({
        email: email,
      });

      if (existingSubscription) {
        return res.status(400).send({
          success: false,
          message: req.t(
            "EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_ALREADY_EXISTS"
          ),
        });
      }

      sendMail(
        email,
        req.t("EMAIL_SUBSCRIPTION.TITLE"),
        req.t("EMAIL_SUBSCRIPTION.DESCRIPTION")
      );
      const subscription = await subscriptionModel.create({
        email: email,
        language_code: language,
        is_canceled: false,
      });
      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_CREATED_SUCCESS"),
        data: subscription,
      });
    } catch (error) {
      console.error("Subscription error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_CREATED_ERROR"),
      });
    }
  }

  async comments(req: FastifyRequest, res: FastifyReply) {
    try {
      // 3 tane otele gelen yorm
      const language = (req as any).language;
      const hotelModel = new HotelModel();
      const carRentalModel = new CarRentalModel();
      const activityModel = new ActivityModel();
      const tourModel = new TourModel();
      const visaModel = new VisaModel();

      const [hotels, carRentals, activities, tours, visas] = await Promise.all([
        hotelModel.getComments(language, 3),
        carRentalModel.getComments(language, 3),
        activityModel.getComments(language, 3),
        tourModel.getComments(language, 3),
        visaModel.getComments(language, 3),
      ]);

      const comments = [
        ...hotels,
        ...carRentals,
        ...activities,
        ...tours,
        ...visas,
      ];

      return res.status(200).send({
        success: true,
        message: "Comments fetched successfully",
        data: comments,
      });
    } catch (error) {
      console.error("Hotels error:", error);
      return res.status(500).send({
        success: false,
        message: "Hotels fetch failed",
      });
    }
  }
}
