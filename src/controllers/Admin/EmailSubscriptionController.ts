import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import EmailSubscriptionModel from "@/models/EmailSubscriptionModel";

export default class EmailSubscriptionController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
      const query = knex("email_subscriptions")
        .where(function () {
          this.where("email", "ilike", `%${search}%`)
            .orWhere("language_code", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("is_canceled", search.toLowerCase() === "true");
          }
        });
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_FETCHED_SUCCESS"),
        data: data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const emailSubscription = await new EmailSubscriptionModel().first({ id });
      
      if (!emailSubscription) {
        return res.status(404).send({
          success: false,
          message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_FETCHED_SUCCESS"),
        data: emailSubscription,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { 
        language_code,
        email,
       } = req.body as {
        language_code: string;
        email: string;
      };

      const existingEmailSubscription = await new EmailSubscriptionModel().first({ 
        email, 
        language_code,
        is_canceled: false,
      });

      if (existingEmailSubscription) {
        return res.status(400).send({
          success: false,
          message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_ALREADY_EXISTS"),
        });
      }

      const emailSubscription = await new EmailSubscriptionModel().create({
        language_code: language_code.toLowerCase(),
        email: email.toLowerCase(),
        is_canceled: false,
      });

      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_CREATED_SUCCESS"),
        data: emailSubscription,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { 
        language_code, 
        email,
        is_canceled,
      } = req.body as {
        language_code?: string;
        email?: string;
        is_canceled?: boolean;
      };

      const existingEmailSubscription = await new EmailSubscriptionModel().first({ id });

      if (!existingEmailSubscription) {
        return res.status(404).send({
          success: false,
          message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_NOT_FOUND"),
        });
      }

      // Check for duplicate email and language_code combination if updating
      if ((email && email !== existingEmailSubscription.email) || 
          (language_code && language_code !== existingEmailSubscription.language_code)) {
        const checkEmail = email || existingEmailSubscription.email;
        const checkLanguageCode = language_code || existingEmailSubscription.language_code;
        
        const existingEmailSubscriptionByCombo = await new EmailSubscriptionModel().first({ 
          email: checkEmail.toLowerCase(), 
          language_code: checkLanguageCode.toLowerCase() 
        });

        if (existingEmailSubscriptionByCombo && existingEmailSubscriptionByCombo.id !== parseInt(id)) {
          return res.status(400).send({
            success: false,
            message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_ALREADY_EXISTS"),
          });
        }
      }

      let body: any = {
        language_code: language_code ? language_code.toLowerCase() : existingEmailSubscription.language_code,
        email: email ? email.toLowerCase() : existingEmailSubscription.email,
        is_canceled: is_canceled !== undefined ? is_canceled : existingEmailSubscription.is_canceled,
      };

      const updatedEmailSubscription = await new EmailSubscriptionModel().update(id, body);

      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_UPDATED_SUCCESS"),
        data: updatedEmailSubscription[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingEmailSubscription = await new EmailSubscriptionModel().first({ id });

      if (!existingEmailSubscription) {
        return res.status(404).send({
          success: false,
          message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_NOT_FOUND"),
        });
      }

      await new EmailSubscriptionModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_DELETED_ERROR"),
      });
    }
  }

  async cancel(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingEmailSubscription = await new EmailSubscriptionModel().first({ id });

      if (!existingEmailSubscription) {
        return res.status(404).send({
          success: false,
          message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_NOT_FOUND"),
        });
      }

      const updatedEmailSubscription = await new EmailSubscriptionModel().update(id, {
        is_canceled: true,
      });

      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_CANCELED_SUCCESS"),
        data: updatedEmailSubscription[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_CANCELED_ERROR"),
      });
    }
  }

  async reactivate(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingEmailSubscription = await new EmailSubscriptionModel().first({ id });

      if (!existingEmailSubscription) {
        return res.status(404).send({
          success: false,
          message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_NOT_FOUND"),
        });
      }

      const updatedEmailSubscription = await new EmailSubscriptionModel().update(id, {
        is_canceled: false,
      });

      return res.status(200).send({
        success: true,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_REACTIVATED_SUCCESS"),
        data: updatedEmailSubscription[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("EMAIL_SUBSCRIPTION.EMAIL_SUBSCRIPTION_REACTIVATED_ERROR"),
      });
    }
  }
}
