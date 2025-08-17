import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import ContractModel from "@/models/ContractModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class ContractController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const language = req.language;

      const query = knex("contracts")
        .whereNull("contracts.deleted_at")
        .innerJoin("contract_pivots", "contracts.id", "contract_pivots.contract_id")
        .where("contract_pivots.language_code", language)
        .where(function () {
          this.where("contract_pivots.title", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("contracts.status", search.toLowerCase() === "true");
          }
        })
        .select("contracts.*", "contract_pivots.title as title","contract_pivots.description as description")
        .groupBy("contracts.id", "contract_pivots.title","contract_pivots.description");
        
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("contracts.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("CONTRACT.CONTRACT_FETCHED_SUCCESS"),
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
        message: req.t("CONTRACT.CONTRACT_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const contract = await new ContractModel().oneToMany(id, "contract_pivots", "contract_id");
      
      return res.status(200).send({
        success: true,
        message: req.t("CONTRACT.CONTRACT_FETCHED_SUCCESS"),
        data: contract,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CONTRACT.CONTRACT_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { key,title,description } = req.body as {
        key: string;
        title: string;
        description: string;
      };

      const contract = await new ContractModel().create({
        key,
      });
      const translateResult = await translateCreate({
        target: "contract_pivots",
        target_id_key: "contract_id",
        target_id: contract.id,
        data: {
          title,
          description,
        },
      });
      contract.contract_pivots = translateResult;


      return res.status(200).send({
        success: true,
        message: req.t("CONTRACT.CONTRACT_CREATED_SUCCESS"),
        data: contract,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CONTRACT.CONTRACT_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { key,title,description } = req.body as {
        key: string;
        title: string;
        description: string;
      };

      const existingContract = await new ContractModel().first({ id });

      if (!existingContract) {
        return res.status(404).send({
          success: false,
          message: req.t("CONTRACT.CONTRACT_NOT_FOUND"),
        });
      }

      let body: any = {
        key: key || existingContract.key,
      };

      await new ContractModel().update(id, body);
      await translateUpdate({
        target: "contract_pivots",
        target_id_key: "contract_id",
        target_id: id,
        data: {
          title,
          description,
        },
      });
      const updatedContract = await new ContractModel().oneToMany(id, "contract_pivots", "contract_id");

      return res.status(200).send({
        success: true,
        message: req.t("CONTRACT.CONTRACT_UPDATED_SUCCESS"),
        data: updatedContract,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CONTRACT.CONTRACT_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingContract = await new ContractModel().first({ id });

      if (!existingContract) {
        return res.status(404).send({
          success: false,
          message: req.t("CONTRACT.CONTRACT_NOT_FOUND"),
        });
      }

      await new ContractModel().delete(id);
      await knex("contract_pivots").where("contract_id", id).whereNull("deleted_at").update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("CONTRACT.CONTRACT_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CONTRACT.CONTRACT_DELETED_ERROR"),
      });
    }
  }
}
