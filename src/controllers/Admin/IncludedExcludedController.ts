import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"
import { translateCreate, translateUpdate } from "@/helper/translate"
import IncludedExcludedModel from "@/models/IncludedExcludedModal"

export default class IncludedExcludedController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string }

			const language = req.language

			// Base query with JOINs (no select, no groupBy)
			const base = knex("included_excluded")
				.whereNull("included_excluded.deleted_at")
				.innerJoin("included_excluded_pivot", "included_excluded.id", "included_excluded_pivot.included_excluded_id")
				.where("included_excluded_pivot.language_code", language)
				.where(function () {
					this.where("included_excluded_pivot.name", "ilike", `%${search}%`)
					this.orWhere("included_excluded.service_type", "ilike", `%${search}%`)
				})

			// Total count
			const countResult = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("included_excluded.id as total").first()
			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data with pagination
			const data = await base
				.clone()
				.select("included_excluded.*", "included_excluded_pivot.name as name")
				.orderBy("included_excluded.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_FETCHED_SUCCESS"),
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
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const includedExcluded = await new IncludedExcludedModel().oneToMany(id, "included_excluded_pivot", "included_excluded_id")

			return res.status(200).send({
				success: true,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_FETCHED_SUCCESS"),
				data: includedExcluded,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { name, service_type, type, status } = req.body as {
				name: string
				service_type: string
				type: string
				status: boolean
			}

			const includedExcluded = await new IncludedExcludedModel().create({
				service_type: service_type || "hotel",
				type,
				status,
			})
			const translateResult = await translateCreate({
				target: "included_excluded_pivot",
				target_id_key: "included_excluded_id",
				target_id: includedExcluded.id,
				data: {
					name,
				},
				language_code: req.language,
			})
			includedExcluded.included_excluded_pivot = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("FAQ.FAQ_CREATED_SUCCESS"),
				data: includedExcluded,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("FAQ.FAQ_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { name, service_type, type, status } = req.body as {
				name: string
				service_type: string
				type: string
				status: boolean
			}

			const existingIncludedExcluded = await new IncludedExcludedModel().first({ id })

			if (!existingIncludedExcluded) {
				return res.status(404).send({
					success: false,
					message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_NOT_FOUND"),
				})
			}

			let body: any = {
				service_type: service_type || existingIncludedExcluded.service_type,
				type: type || existingIncludedExcluded.type,
				status: status ?? existingIncludedExcluded.status,
			}

			await new IncludedExcludedModel().update(id, body)
			await translateUpdate({
				target: "included_excluded_pivot",
				target_id_key: "included_excluded_id",
				target_id: id,
				data: {
					name,
				},
				language_code: req.language,
			})
			const updatedIncludedExcluded = await new IncludedExcludedModel().oneToMany(id, "included_excluded_pivot", "included_excluded_id")

			return res.status(200).send({
				success: true,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_UPDATED_SUCCESS"),
				data: updatedIncludedExcluded,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingIncludedExcluded = await new IncludedExcludedModel().first({ id })

			if (!existingIncludedExcluded) {
				return res.status(404).send({
					success: false,
					message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_NOT_FOUND"),
				})
			}

			await new IncludedExcludedModel().delete(id)
			await knex("included_excluded_pivot").where("included_excluded_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_DELETED_ERROR"),
			})
		}
	}
}
