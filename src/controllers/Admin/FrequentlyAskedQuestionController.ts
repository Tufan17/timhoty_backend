import { FastifyRequest, FastifyReply } from "fastify";
import InsuranceTypeModel from "../../models/Admin/InsuranceTypeModel";
import knex from "../../db/knex";
import LogModel from "@/models/Admin/LogModel";
import FrequentlyAskedQuestionModel from "@/models/Admin/FrequentlyAskedQuestionModel";

export default class FrequentlyAskedQuestionController {
  async dataTables(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        search = "",
        page = 1,
        limit = 10,
      } = req.query as { search: string; page: number; limit: number };
      const query = knex("frequently_asked_questions as faq")
        .whereNull("faq.deleted_at")
      .join("insurance_types as it", "faq.insurance_type_id", "it.id")
      .where(function () {
        if (search) {
          this.where("faq.title", "ilike", `%${search}%`)
            .orWhere("faq.content", "ilike", `%${search}%`)
            .orWhere("it.name", "ilike", `%${search}%`);
        }
      });
    
    const countResult = await query.clone().count("* as total").first();
    const total = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(total / Number(limit));
    
    const data = await query
      .clone()
      .select(
        "faq.id",
        "faq.order",
        "faq.title",
        "faq.content",
        "faq.status",
        "faq.insurance_type_id",
        "faq.created_at",
        "faq.updated_at",
        "faq.deleted_at",
        "it.name as insurance_name",
        "it.description as insurance_description"
      )
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit))
      .orderBy("faq.order", "asc");
    
    return res.status(200).send({
      success: true,
      message: "Frequently asked questions fetched successfully",
      data: data.map((item: any) => ({
        id: item.id,
        order: item.order,
        title: item.title,
        content: item.content,
        status: item.status,
        insurance_type_id: item.insurance_type_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        insurance: {
          name: item.insurance_name,
          description: item.insurance_description,
        },
      })),
      total,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit),
    });
    
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { order, title, content, status, insurance_type_id } = req.body as {
        order: number;
        title: string;
        content: string;
        status: boolean;
        insurance_type_id: string;
      };

      const insuranceType = await new InsuranceTypeModel().findId(
        insurance_type_id
      );

      if (!insuranceType) {
        return res.status(404).send({
          success: false,
          message: "Insurance type not found",
        });
      }
      await new FrequentlyAskedQuestionModel().create({
        order,
        title,
        content,
        status,
        insurance_type_id,
      });

      const frequentlyAskedQuestion =
        await new FrequentlyAskedQuestionModel().first({
          order,
          title,
          content,
          status,
          insurance_type_id,
        });

      await new LogModel().createLog(
        req.user,
        "create",
        "frequently_asked_questions",
        frequentlyAskedQuestion
      );

      return res.status(200).send({
        success: true,
        message: "Frequently asked question created successfully",
        data: frequentlyAskedQuestion,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { order, title, content, status, insurance_type_id } = req.body as {
        order: number;
        title: string;
        content: string;
        status: boolean;
        insurance_type_id: string;
      };

      const frequentlyAskedQuestion = await new FrequentlyAskedQuestionModel().findId(id);
      
      if (!frequentlyAskedQuestion) {
        return res.status(404).send({
          success: false,
          message: "Frequently asked question not found",
        });
      }

      await new FrequentlyAskedQuestionModel().update(id, {
        order,
        title,
        content,
        status,
        insurance_type_id,
      });

      await new LogModel().createLog(
        req.user,
        "update",
        "frequently_asked_questions",
        frequentlyAskedQuestion 
      );

      return res.status(200).send({
        success: true,
        message: "Frequently asked question updated successfully",
        data: frequentlyAskedQuestion,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const frequentlyAskedQuestion = await new FrequentlyAskedQuestionModel().findId(id);
      
      if (!frequentlyAskedQuestion) {
        return res.status(404).send({
          success: false,
          message: "Frequently asked question not found",
        });
      }

      await new FrequentlyAskedQuestionModel().delete(id);

      await new LogModel().createLog(
        req.user,
        "delete",
        "frequently_asked_questions",
        frequentlyAskedQuestion
      );
      return res.status(200).send({
        success: true,
        message: "Frequently asked question deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const frequentlyAskedQuestions = await new FrequentlyAskedQuestionModel().getAll();
      const insurance_type_ids = frequentlyAskedQuestions.map((item: any) => item.insurance_type_id);
      const insuranceTypes = await new InsuranceTypeModel().findByIds(insurance_type_ids);

     
      return res.status(200).send({
        success: true,
        message: "Frequently asked questions fetched successfully",
        data: frequentlyAskedQuestions.sort((a: any, b: any) => a.order - b.order),
        insuranceTypes,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }
}