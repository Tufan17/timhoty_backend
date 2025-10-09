import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"

import DiscountCodeModel from "@/models/DiscountCodeModel"
import DiscountProductModel from "@/models/DiscountProductModel"

export default class DiscountProductController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string }

			const language = req.language

			const query = knex("discount_products")
				.whereNull("discount_products.deleted_at")
				.where(function () {
					this.where("discount_products.code", "ilike", `%${search}%`)
				})
				.select("discount_products.*")
				.groupBy("discount_products.id")

			const countResult = await query.clone().count("* as total").first()
			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))
			const data = await query
				.clone()
				.orderBy("discount_products.created_at", "asc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_FETCHED_SUCCESS"),
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
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const discountProduct = await knex("discount_products").where("discount_products.id", id).whereNull("discount_products.deleted_at").first()

			if (!discountProduct) {
				return res.status(404).send({
					success: false,
					message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_NOT_FOUND"),
				})
			}
			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_FETCHED_SUCCESS"),
				data: discountProduct,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { discount_code_id, product_id, service_type } = req.body as {
				discount_code_id: string
				product_id: string
				service_type: string
			}

			// Discount code'un var olup olmadığını kontrol et
			const discountCode = await new DiscountCodeModel().first({ id: discount_code_id })
			if (!discountCode) {
				return res.status(404).send({
					success: false,
					message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_NOT_FOUND"),
				})
			}

			// Aynı product için aynı discount code zaten var mı kontrol et
			const existingProduct = await new DiscountProductModel().first({
				discount_code_id,
				product_id,
				service_type,
			})

			if (existingProduct) {
				return res.status(400).send({
					success: false,
					message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_ALREADY_EXISTS"),
				})
			}

			const discountProduct = await new DiscountProductModel().create({
				discount_code_id,
				product_id,
				service_type,
			})

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_CREATED_SUCCESS"),
				data: discountProduct,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { discount_code_id, product_id, service_type } = req.body as {
				discount_code_id: string
				product_id: string
				service_type: string
			}

			const existingDiscountProduct = await new DiscountProductModel().first({ id })

			if (!existingDiscountProduct) {
				return res.status(404).send({
					success: false,
					message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_NOT_FOUND"),
				})
			}

			// Discount code değiştiriliyorsa, yeni discount code'un var olup olmadığını kontrol et
			if (discount_code_id && discount_code_id !== existingDiscountProduct.discount_code_id) {
				const discountCode = await new DiscountCodeModel().first({ id: discount_code_id })
				if (!discountCode) {
					return res.status(404).send({
						success: false,
						message: req.t("DISCOUNT_CODE.DISCOUNT_CODE_NOT_FOUND"),
					})
				}
			}

			let body: any = {
				discount_code_id: discount_code_id || existingDiscountProduct.discount_code_id,
				product_id: product_id || existingDiscountProduct.product_id,
				service_type: service_type || existingDiscountProduct.service_type,
			}

			await new DiscountProductModel().update(id, body)
			const updatedDiscountProduct = await new DiscountProductModel().first({ id })

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_UPDATED_SUCCESS"),
				data: updatedDiscountProduct,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_UPDATED_ERROR"),
			})
		}
	}
	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingDiscountProduct = await new DiscountProductModel().first({ id })

			if (!existingDiscountProduct) {
				return res.status(404).send({
					success: false,
					message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_NOT_FOUND"),
				})
			}

			await new DiscountProductModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("DISCOUNT_PRODUCT.DISCOUNT_PRODUCT_DELETED_ERROR"),
			})
		}
	}
}
