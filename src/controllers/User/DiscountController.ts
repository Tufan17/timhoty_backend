import DiscountCodeModel from "@/models/DiscountCodeModel";
import DiscountProductModel from "@/models/DiscountProductModel";
import DiscountUserModel from "@/models/DiscountUserModel";
import { FastifyRequest, FastifyReply } from "fastify";
export default class DiscountController {
  async index(req: FastifyRequest, res: FastifyReply) {
    try {
      const { code, service_type, service_id } = req.body as {
        code: string;
        service_type: string;
        service_id: string;
      };

      const discountCode = await new DiscountCodeModel().first({
        code,
        service_type,
      });
      if (!discountCode) {
        return res.status(404).send({
          success: false,
          message: req.t("DISCOUNT.DISCOUNT_CODE_NOT_FOUND"),
        });
      }

      const discountProduct = await new DiscountProductModel().first({
        discount_code_id: discountCode.id,
        service_type,
        product_id:service_id,
      });
      if (!discountProduct) {
        return res.status(404).send({
          success: false,
          message: req.t("DISCOUNT.DISCOUNT_PRODUCT_NOT_FOUND"),
        });
      }

      const discountUser = await new DiscountUserModel().getAll([],{
        discount_code_id: discountCode.id,
        status: true,
      });

      const totalDiscount = discountUser.length;
      if(totalDiscount >= discountCode.amount){
        return res.status(404).send({
          success: false,
          message: req.t("DISCOUNT.DISCOUNT_LIMIT_REACHED"),
        });
      }

      res.status(200).send({
        success: true,
        message: req.t("DISCOUNT.DISCOUNT_ADDED_SUCCESS"),
        data: discountCode,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("DISCOUNT.DISCOUNT_ADD_ERROR"),
      });
    }
  }
}
