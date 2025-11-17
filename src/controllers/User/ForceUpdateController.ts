import { FastifyRequest, FastifyReply } from "fastify";

export default class ForceUpdateController {
  async checkForceUpdate(req: FastifyRequest, res: FastifyReply) {
    try {
      const { platform, version } = req.body as { 
        platform: 'ios' | 'android';
        version: number;
      };

      // Example version thresholds - these would typically come from config/DB
      const forceUpdateVersion = {
        ios: 300,
        android: 300
      };
      
      const recommendedVersion = {
        ios: 320,
        android: 320
      };

      if (version < forceUpdateVersion[platform]) {
        return res.status(200).send({
          success: true,
          data: {
            forceUpdate: true,
            message: "Uygulamanın çalışması için güncelleme yapmanız gerekmektedir."
          }
        });
      }

      if (version < recommendedVersion[platform]) {
        return res.status(200).send({
          success: true,
          data: {
            forceUpdate: false,
            message: "Yeni bir güncelleme mevcut. Güncellemek ister misiniz?"
          }
        });
      }

      return res.status(200).send({
        success: true,
        data: {
          forceUpdate: false,
          message: null
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }
}