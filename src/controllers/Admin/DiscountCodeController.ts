import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"

import DiscountCodeModel from "@/models/DiscountCodeModel"

export default class DiscountCodeController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string }

			const language = req.language

			const query = knex("discount_codes")
				.whereNull("discount_codes.deleted_at")
				.where(function () {
					this.where("discount_codes.code", "ilike", `%${search}%`)
				})
				.select("discount_codes.*")
				.groupBy("discount_codes.id")

			const countResult = await query.clone().count("* as total").first()
			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))
			const data = await query
				.clone()
				.orderBy("discount_codes.created_at", "asc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_FETCHED_SUCCESS"),
				data: data,
				recordsPerPageOptions: [10, 20, 50, 100],
				total: total,
				totalPages: totalPages,
				currentPage: Number(page),
				limit: Number(limit),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const discountCode = await knex("discount_codes").where("discount_codes.id", id).whereNull("discount_codes.deleted_at").first()

			if (!discountCode) {
				return res.status(404).send({
					success: false,
					message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_NOT_FOUND"),
				})
			}
			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_FETCHED_SUCCESS"),
				data: discountCode,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { code, service_type, amount, percentage, validity_period } = req.body as {
				code: string
				service_type: string
				amount: number
				percentage: number
				validity_period: string
			}
			// console.log(req.body)

			const discountCode = await new DiscountCodeModel().create({
				code,
				service_type,
				amount,
				percentage,
				validity_period,
			})

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_CREATED_SUCCESS"),
				data: discountCode,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { code, service_type, amount, percentage, validity_period } = req.body as {
				code: string
				service_type: string
				amount: number
				percentage: number
				validity_period: string
			}

			const existingDiscountCode = await new DiscountCodeModel().first({ id })

			if (!existingDiscountCode) {
				return res.status(404).send({
					success: false,
					message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_NOT_FOUND"),
				})
			}

			let body: any = {
				code: code || existingDiscountCode.code,
				service_type: service_type || existingDiscountCode.service_type,
				amount: amount || existingDiscountCode.amount,
				percentage: percentage || existingDiscountCode.percentage,
				validity_period: validity_period || existingDiscountCode.validity_period,
			}

			await new DiscountCodeModel().update(id, body)
			const updatedDiscountCode = await new DiscountCodeModel().first({ id })

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_UPDATED_SUCCESS"),
				data: updatedDiscountCode,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_UPDATED_ERROR"),
			})
		}
	}
	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingDiscountCode = await new DiscountCodeModel().first({ id })

			if (!existingDiscountCode) {
				return res.status(404).send({
					success: false,
					message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_NOT_FOUND"),
				})
			}

			await new DiscountCodeModel().delete(id)
			await knex("discount_products").where("discount_code_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })
			await knex("discount_users").where("discount_code_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_DELETED_ERROR"),
			})
		}
	}
}
