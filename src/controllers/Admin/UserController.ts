import { FastifyRequest, FastifyReply } from "fastify"
import UserModel from "@/models/UserModel"
import CurrencyModel from "@/models/CurrencyModel"
import knex from "@/db/knex"
import CurrencyPivotModel from "@/models/CurrencyPivotModel"
export default class UserController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = req.language
			const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string }

			const query = knex("users")
				.whereNull("users.deleted_at")
				.leftJoin("currencies", "users.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function () {
					this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.where(function () {
					// Currency yoksa veya currency aktifse
					this.whereNull("users.currency_id").orWhere("currencies.is_active", true)
				})
				.where(function () {
					this.where("name_surname", "ilike", `%${search}%`).orWhere("email", "ilike", `%${search}%`).orWhere("phone", "ilike", `%${search}%`)
					if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
						this.orWhere("status", search.toLowerCase() === "true")
					}
					if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
						this.orWhere("email_verified", search.toLowerCase() === "true")
					}
					if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
						this.orWhere("sms_contact", search.toLowerCase() === "true")
					}
					if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
						this.orWhere("email_contact", search.toLowerCase() === "true")
					}
					if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
						this.orWhere("push_contact", search.toLowerCase() === "true")
					}
					if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
						this.orWhere("electronic_contact_permission", search.toLowerCase() === "true")
					}
				})
				.select("users.*", "currency_pivots.name as currency", "currencies.code as code", "currencies.symbol as symbol", "currencies.is_active as is_active")
				.groupBy("users.id", "currency_pivots.name", "currencies.code", "currencies.symbol", "currencies.is_active")

			const countResult = await query.clone().count("* as total").first()
			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))
			const data = await query
				.clone()
				.orderBy("users.created_at", "asc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("USER.USER_FETCHED_SUCCESS"),
				data: data.map(user => {
					return {
						id: user.id,
						avatar: user.avatar,
						name_surname: user.name_surname,
						email: user.email,
						phone: user.phone,
						status: user.status,
						electronic_contact_permission: user.electronic_contact_permission,
						currency: user.currency_id
							? {
									id: user.currency_id,
									name: user.currency,
									code: user.code,
									symbol: user.symbol,
									is_active: user.is_active,
							  }
							: null,
						created_at: user.created_at,
						updated_at: user.updated_at,
						deleted_at: user.deleted_at,
					}
				}),
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
				message: req.t("USER.USER_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const user = await new UserModel().findId(id)
			// const currency = await new CurrencyModel().findId(user?.currency_id)
			// const currencyPivot = await new CurrencyPivotModel().first({ currency_id: currency?.id, language_code: req.language })
			let currencyData = null

			if (user?.currency_id) {
				const currency = await new CurrencyModel().findId(user.currency_id)
				if (currency?.id) {
					const currencyPivot = await new CurrencyPivotModel().first({
						currency_id: currency.id,
						language_code: req.language,
					})
					currencyData = currencyPivot
				}
			}
			const userData = {
				...user,
				// currency: currencyPivot,
				currency: currencyData,
			}
			return res.status(200).send({
				success: true,
				message: req.t("USER.USER_FOUND_SUCCESS"),
				data: userData,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("USER.USER_FOUND_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { name_surname, email, phone, password, language, birthday, email_verified, status, sms_contact, email_contact, push_contact, electronic_contact_permission, currency_id, device_id, verification_code, verification_code_expires_at, avatar } = req.body as {
				name_surname: string
				email: string
				phone: string
				password: string
				language: string
				birthday: string
				email_verified: boolean
				status: boolean
				sms_contact: boolean
				email_contact: boolean
				push_contact: boolean
				electronic_contact_permission: boolean
				currency_id: string
				device_id: string
				verification_code: string
				verification_code_expires_at: string
				avatar: string
			}

			const existingAdmin = await new UserModel().first({ email })

			if (existingAdmin) {
				return res.status(400).send({
					success: false,
					message: req.t("ADMIN.ADMIN_ALREADY_EXISTS"),
				})
			}
			const user = await new UserModel().create({
				name_surname,
				email,
				phone,
				password,
				language,
				status,
				birthday,
				email_verified,
				sms_contact,
				email_contact,
				push_contact,
				electronic_contact_permission,
				currency_id,
				device_id,
				verification_code,
				verification_code_expires_at,
				avatar,
			})

			return res.status(200).send({
				success: true,
				message: req.t("USER.USER_CREATED_SUCCESS"),
				data: user,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("USER.USER_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { name_surname, phone, password, language, status, birthday, email_verified, sms_contact, email_contact, push_contact, electronic_contact_permission, currency_id, device_id, verification_code, verification_code_expires_at, avatar } = req.body as {
				name_surname: string
				phone: string
				password: string
				language: string
				status: boolean
				birthday: string
				email_verified: boolean
				sms_contact: boolean
				email_contact: boolean
				push_contact: boolean
				electronic_contact_permission: boolean
				currency_id: string
				device_id: string
				verification_code: string
				verification_code_expires_at: string
				avatar: string
			}

			const existingAdmin = await new UserModel().first({ id })

			if (!existingAdmin) {
				return res.status(404).send({
					success: false,
					message: req.t("USER.USER_NOT_FOUND"),
				})
			}
			if (currency_id) {
				const currency = await new CurrencyModel().findId(currency_id)
				if (!currency) {
					return res.status(404).send({
						success: false,
						message: req.t("CURRENCY.CURRENCY_NOT_FOUND"),
					})
				}
			}

			let body: any = {
				name_surname: name_surname || existingAdmin.name_surname,
				phone: phone || existingAdmin.phone,
				language: language || existingAdmin.language,
				status: status || existingAdmin.status,
				password: password,
				birthday: birthday || existingAdmin.birthday,
				email_verified: email_verified || existingAdmin.email_verified,
				sms_contact: sms_contact || existingAdmin.sms_contact,
				email_contact: email_contact || existingAdmin.email_contact,
				push_contact: push_contact || existingAdmin.push_contact,
				electronic_contact_permission: electronic_contact_permission || existingAdmin.electronic_contact_permission,
				currency_id: currency_id || existingAdmin.currency_id,
				device_id: device_id || existingAdmin.device_id,
				verification_code: verification_code || existingAdmin.verification_code,
				verification_code_expires_at: verification_code_expires_at || existingAdmin.verification_code_expires_at,
				avatar: avatar || existingAdmin.avatar,
			}

			const updatedUser = await new UserModel().update(id, body)

			return res.status(200).send({
				success: true,
				message: req.t("USER.USER_UPDATED_SUCCESS"),
				data: updatedUser,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("USER.USER_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }

			const existingAdmin = await new UserModel().first({ id })

			if (!existingAdmin) {
				return res.status(404).send({
					success: false,
					message: req.t("USER.USER_NOT_FOUND"),
				})
			}

			await new UserModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("USER.USER_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("USER.USER_DELETED_ERROR"),
			})
		}
	}
}
