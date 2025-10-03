import { FastifyRequest, FastifyReply } from "fastify";
import FavoritesModel from "@/models/FavoritesModel";

export default class FavoritesController {
  async toggleFavorite(req: FastifyRequest, res: FastifyReply) {
    try {
      const { service_type, service_id } = req.body as { service_type: string; service_id: string };
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const favoritesModel = new FavoritesModel();
      const result = await favoritesModel.toggleFavorite(service_type, service_id, userId);

      return res.status(200).send({
        success: true,
        message: result.isAdded 
          ? req.t("FAVORITES.FAVORITE_ADDED_SUCCESS")
          : req.t("FAVORITES.FAVORITE_REMOVED_SUCCESS"),
        data: { isAdded: result.isAdded }
      });
    } catch (error: any) {
      console.error("Toggle favorite error:", error);
      return res.status(500).send({
        success: false,
        message: error.message === "Service not found" 
          ? req.t("FAVORITES.SERVICE_NOT_FOUND")
          : req.t("FAVORITES.FAVORITE_TOGGLE_ERROR"),
      });
    }
  }

  async getAllFavorites(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const language = req.language || "en";
      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const favoritesModel = new FavoritesModel();
      const favorites = await favoritesModel.getAllFavorites(userId, language);

      return res.status(200).send({
        success: true,
        message: req.t("FAVORITES.FAVORITES_FETCHED_SUCCESS"),
        data: favorites,
      });
    } catch (error: any) {
      console.error("Get favorites error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("FAVORITES.FAVORITES_FETCHED_ERROR"),
      });
    }
  }
}
