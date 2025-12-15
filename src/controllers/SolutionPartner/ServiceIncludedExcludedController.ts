import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"
import ServiceIncludedExcludedModel from "@/models/ServiceIncludedExcludedModal"

export default class ServiceIncludedExcludedController {
	// Tüm included_excluded öğelerini getir, seçili olanları işaretle
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { service_id, service_type, type } = req.query as {
				service_id: string
				service_type: string
				type: string // "normal" | "package"
			}

			const language = req.language

			// Tüm included_excluded öğelerini getir (service_type ve type'a göre filtrelenmiş)
			const allItems = await knex("included_excluded")
				.whereNull("included_excluded.deleted_at")
				.where("included_excluded.service_type", service_type)
				.where("included_excluded.type", type)
				.where("included_excluded.status", true)
				.innerJoin("included_excluded_pivot", function () {
					this.on("included_excluded.id", "included_excluded_pivot.included_excluded_id").andOn("included_excluded_pivot.language_code", knex.raw("?", [language]))
				})
				.whereNull("included_excluded_pivot.deleted_at")
				.select("included_excluded.id", "included_excluded_pivot.name", "included_excluded.service_type", "included_excluded.type")

			// Bu service için seçili olanları getir (status ile birlikte)
			const selectedItems = await knex("services_included_excluded").where("service_id", service_id).where("service_type", service_type).where("type", type).whereNull("deleted_at").select("included_excluded_id", "status")

			// id -> status map oluştur
			const selectedMap = selectedItems.reduce((acc: Record<string, boolean>, item: any) => {
				acc[item.included_excluded_id] = item.status
				return acc
			}, {} as Record<string, boolean>)

			// Her öğeye is_selected ve status ekle
			const data = allItems.map((item: any) => ({
				...item,
				is_selected: item.id in selectedMap,
				status: selectedMap[item.id] ?? null, // true=dahil, false=hariç, null=seçili değil
			}))

			return res.status(200).send({
				success: true,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_FETCHED_SUCCESS"),
				data: data,
				total: data.length,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_FETCHED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { service_id, service_type, type, included_excluded_ids } = req.body as {
				service_id: string
				service_type: string // "hotel" | "rental" | "activity" | "tour" | "visa"
				type: string // "normal" | "package"
				included_excluded_ids: { id: string; status: boolean }[] // Yeni format
			}

			// Gelen id'leri çıkar
			const incomingIds = included_excluded_ids.map(item => item.id)

			// Mevcut ilişkileri getir
			const existingRelations = await knex("services_included_excluded").where("service_id", service_id).where("service_type", service_type).where("type", type).whereNull("deleted_at").select("id", "included_excluded_id", "status")

			const existingIds = existingRelations.map((r: any) => r.included_excluded_id)

			// Silinecekler: Mevcut olup yeni listede olmayanlar
			const toDelete = existingIds.filter((id: string) => !incomingIds.includes(id))

			// Eklenecekler: Yeni listede olup mevcut olmayanlar
			const toAdd = included_excluded_ids.filter(item => !existingIds.includes(item.id))

			// Güncellenecekler: Her ikisinde de olanlar (status değişmiş olabilir)
			const toUpdate = included_excluded_ids.filter(item => existingIds.includes(item.id))

			await knex.transaction(async trx => {
				// Sil (soft delete)
				if (toDelete.length > 0) {
					await trx("services_included_excluded").where("service_id", service_id).where("service_type", service_type).where("type", type).whereIn("included_excluded_id", toDelete).whereNull("deleted_at").update({
						deleted_at: trx.fn.now(),
						updated_at: trx.fn.now(),
					})
				}

				// Ekle veya Restore
				if (toAdd.length > 0) {
					for (const item of toAdd) {
						// Önce soft-deleted kayıt var mı kontrol et
						const existingDeleted = await trx("services_included_excluded").where("service_id", service_id).where("service_type", service_type).where("type", type).where("included_excluded_id", item.id).whereNotNull("deleted_at").first()

						if (existingDeleted) {
							// Restore et
							await trx("services_included_excluded").where("id", existingDeleted.id).update({
								deleted_at: null,
								status: item.status,
								updated_at: trx.fn.now(),
							})
						} else {
							// Yeni kayıt ekle
							await trx("services_included_excluded").insert({
								included_excluded_id: item.id,
								service_id,
								service_type,
								type,
								status: item.status,
							})
						}
					}
				}

				// Güncelle (status değişikliği)
				for (const item of toUpdate) {
					await trx("services_included_excluded").where("service_id", service_id).where("service_type", service_type).where("type", type).where("included_excluded_id", item.id).whereNull("deleted_at").update({
						status: item.status,
						updated_at: trx.fn.now(),
					})
				}
			})

			// Güncellenmiş listeyi getir
			const updatedRelations = await knex("services_included_excluded")
				.where("services_included_excluded.service_id", service_id)
				.where("services_included_excluded.service_type", service_type)
				.where("services_included_excluded.type", type)
				.whereNull("services_included_excluded.deleted_at")
				.innerJoin("included_excluded", "services_included_excluded.included_excluded_id", "included_excluded.id")
				.innerJoin("included_excluded_pivot", function () {
					this.on("included_excluded.id", "included_excluded_pivot.included_excluded_id").andOn("included_excluded_pivot.language_code", knex.raw("?", [req.language]))
				})
				.whereNull("included_excluded_pivot.deleted_at")
				.select("services_included_excluded.id", "services_included_excluded.included_excluded_id", "included_excluded_pivot.name", "services_included_excluded.service_type", "services_included_excluded.type", "services_included_excluded.status")

			return res.status(200).send({
				success: true,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_UPDATED_SUCCESS"),
				data: updatedRelations,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("INCLUDED_EXCLUDED.INCLUDED_EXCLUDED_UPDATED_ERROR"),
			})
		}
	}
}
