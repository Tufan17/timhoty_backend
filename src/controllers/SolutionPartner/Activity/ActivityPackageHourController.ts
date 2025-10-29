import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import ActivityPackageHourModel from "@/models/ActivityPackageHourModel"
import ActivityPackageModel from "@/models/ActivityPackageModel"
import ActivityModel from "@/models/ActivityModel"

export default class ActivityPackageHourController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				activity_package_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				activity_package_id?: string
			}

			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Base query with JOINs
			const base = knex("activity_package_hours")
				.whereNull("activity_package_hours.deleted_at")
				.innerJoin("activity_packages", "activity_package_hours.activity_package_id", "activity_packages.id")
				.whereNull("activity_packages.deleted_at")
				.modify(qb => {
					// Filter by solution partner from authenticated user
					if (spFromUser) qb.where("activity_packages.solution_partner_id", spFromUser)

					if (activity_package_id) qb.where("activity_package_hours.activity_package_id", activity_package_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("activity_package_hours.hour", "ilike", like).orWhere("activity_package_hours.minute", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("activity_package_hours.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("activity_package_hours.id")
				.select("activity_package_hours.*", "activity_packages.location_id")
				.orderBy("activity_package_hours.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_FETCHED_SUCCESS"),
				data,
				recordsPerPageOptions: [10, 20, 50, 100],
				total,
				totalPages,
				currentPage: Number(page),
				limit: Number(limit),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_package_id } = req.query as { activity_package_id?: string }

			let query = knex("activity_package_hours").whereNull("activity_package_hours.deleted_at").select("activity_package_hours.*")

			if (activity_package_id) {
				query = query.where("activity_package_hours.activity_package_id", activity_package_id)
			}

			const activityPackageHours = await query.orderBy("created_at", "desc")

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_FETCHED_SUCCESS"),
				data: activityPackageHours,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }

			const activityPackageHour = await knex("activity_package_hours").whereNull("activity_package_hours.deleted_at").where("activity_package_hours.id", id).select("activity_package_hours.*").first()

			if (!activityPackageHour) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_FETCHED_SUCCESS"),
				data: activityPackageHour,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_package_id, hour, minute } = req.body as {
				activity_package_id: string
				hour: number
				minute: number
			}

			const existActivityPackage = await new ActivityPackageModel().first({ id: activity_package_id })
			await new ActivityModel().update(existActivityPackage?.activity_id, { admin_approval: false, status: false })
			if (!existActivityPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE.ACTIVITY_PACKAGE_NOT_FOUND"),
				})
			}

			// Validate hour and minute values
			if (hour < 0 || hour > 23) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.INVALID_HOUR_VALUE"),
				})
			}

			if (minute < 0 || minute > 59) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.INVALID_MINUTE_VALUE"),
				})
			}

			// Check if same hour/minute combination already exists for this package
			const existingHour = await knex("activity_package_hours").where("activity_package_id", activity_package_id).where("hour", hour).where("minute", minute).whereNull("deleted_at").first()

			if (existingHour) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_ALREADY_EXISTS"),
				})
			}

			// Create activity_package_hour
			const activityPackageHour = await new ActivityPackageHourModel().create({
				activity_package_id,
				hour,
				minute,
			})

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_CREATED_SUCCESS"),
				data: activityPackageHour,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { activity_package_id, hour, minute } = req.body as {
				activity_package_id?: string
				hour?: number
				minute?: number
			}

			const existingActivityPackageHour = await new ActivityPackageHourModel().first({ id })

			if (!existingActivityPackageHour) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_NOT_FOUND"),
				})
			}

			// Validate activity_package_id if provided
			if (activity_package_id) {
				const existingActivityPackage = await new ActivityPackageModel().first({
					"activity_packages.id": activity_package_id,
				})

				if (!existingActivityPackage) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY_PACKAGE.ACTIVITY_PACKAGE_NOT_FOUND"),
					})
				}
				await new ActivityModel().update(existingActivityPackage?.activity_id, { admin_approval: false, status: false })
			}

			// Validate hour and minute values if provided
			if (hour !== undefined && (hour < 0 || hour > 23)) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.INVALID_HOUR_VALUE"),
				})
			}

			if (minute !== undefined && (minute < 0 || minute > 59)) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.INVALID_MINUTE_VALUE"),
				})
			}

			// Check if updated hour/minute combination already exists for this package (excluding current record)
			const finalActivityPackageId = activity_package_id !== undefined ? activity_package_id : existingActivityPackageHour.activity_package_id
			const finalHour = hour !== undefined ? hour : existingActivityPackageHour.hour
			const finalMinute = minute !== undefined ? minute : existingActivityPackageHour.minute

			const existingHour = await knex("activity_package_hours").where("activity_package_id", finalActivityPackageId).where("hour", finalHour).where("minute", finalMinute).where("id", "!=", id).whereNull("deleted_at").first()

			if (existingHour) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_ALREADY_EXISTS"),
				})
			}

			// Update activity_package_hour
			const updateData: any = {}
			if (activity_package_id !== undefined) updateData.activity_package_id = activity_package_id
			if (hour !== undefined) updateData.hour = hour
			if (minute !== undefined) updateData.minute = minute

			const updatedActivityPackageHour = await new ActivityPackageHourModel().update(id, updateData)

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_UPDATED_SUCCESS"),
				data: updatedActivityPackageHour,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingActivityPackageHour = await new ActivityPackageHourModel().first({ id })

			if (!existingActivityPackageHour) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_NOT_FOUND"),
				})
			}

			await new ActivityPackageHourModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_HOUR.ACTIVITY_PACKAGE_HOUR_DELETED_ERROR"),
			})
		}
	}
}
