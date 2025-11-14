import { FastifyRequest, FastifyReply } from "fastify"
import PermissionModel from "@/models/PermissionModel"
// import UserModel from "@/models/Admin/UserModel";
import AdminModel from "@/models/Admin/AdminModel"
import SolutionPartnerModel from "@/models/SolutionPartnerModel"
import SalesPartnerModel from "@/models/SalesPartnerModel"
class PermissionController {
	async createOrUpdate(req: FastifyRequest, res: FastifyReply) {
		try {
			const { name, target, target_id, status } = req.body as {
				name: string
				target: string
				target_id: string
				status: boolean
			}
			if (!["users", "dealer_users", "admins"].includes(target)) {
				return res.status(400).send({
					success: false,
					message: req.t("PERMISSION.TARGET_INVALID"),
				})
			}

			let user

			//   if (target === "users") {
			//     user = await new UserModel().first({ id: target_id });
			//   } else if (target === "dealer_users") {
			//     user = await new DealerModel().first({ id: target_id });
			//   } else if (target === "admins") {
			user = await new AdminModel().first({ id: target_id })
			//   }

			if (!user) {
				return res.status(400).send({
					success: false,
					message: req.t("PERMISSION.USER_NOT_FOUND"),
				})
			}

			await new PermissionModel().createOrUpdate(target, target_id, name, status)
			return res.status(200).send({
				success: true,
				message: req.t("PERMISSION.PERMISSION_CREATED_SUCCESS"),
			})
		} catch (error) {
			return res.status(500).send({
				success: false,
				message: req.t("PERMISSION.PERMISSION_CREATED_ERROR"),
				error: error,
			})
		}
	}

	async totalCreateOrUpdate(req: FastifyRequest, res: FastifyReply) {
		try {
			const { permissions, target, user_id } = req.body as {
				permissions: { name: string; status: boolean }[]
				target: string
				user_id: string
			}
			console.log(req.body)
			if (!["users", "dealer_users", "admins", "solution_partner", "sale_partner"].includes(target)) {
				return res.status(400).send({
					success: false,
					message: req.t("PERMISSION.TARGET_INVALID"),
				})
			}

			let user

			if (target === "users") {
				//     user = await new UserModel().first({ id: user_id });
				//   } else if (target === "dealer_users") {
				//     user = await new DealerModel().first({ id: user_id });
			} else if (target === "admins") {
				user = await new AdminModel().first({ id: user_id })
			} else if (target === "solution_partner") {
				user = await new SolutionPartnerModel().first({ id: user_id })
			}else if (target === "sale_partner") {
				user = await new SalesPartnerModel().first({ id: user_id })
			}

			if (!user) {
				return res.status(400).send({
					success: false,
					message: req.t("PERMISSION.USER_NOT_FOUND"),
				})
			}

			for (const permission of permissions) {
				await new PermissionModel().createOrUpdate(target, user_id, permission.name, permission.status)
			}

			return res.status(200).send({
				success: true,
				message: req.t("PERMISSION.PERMISSION_CREATED_SUCCESS"),
			})
		} catch (error) {
			return res.status(500).send({
				success: false,
				message: req.t("PERMISSION.PERMISSION_CREATED_ERROR"),
				error: error,
			})
		}
	}

	async findUser(req: FastifyRequest, res: FastifyReply) {
		try {
			const { target, id } = req.params as { target: string; id: string }
			if (!["users", "admins", "solution_partner", "sale_partner"].includes(target)) {
				return res.status(400).send({
					success: false,
					message: req.t("PERMISSION.TARGET_INVALID"),
				})
			}

			let permissions
			if (target === "admins") {
				permissions = await new PermissionModel().getAdminPermissions(id)
			} else if (target === "solution_partner") {
				permissions = await new PermissionModel().getSolutionPartnerPermissions(id)
			} else if (target === "sale_partner") {
				permissions = await new PermissionModel().getSalePartnerPermissions(id)
			} else {
				permissions = await new PermissionModel().getAll([], { target: target, user_id: id })
			}

			return res.status(200).send({
				success: true,
				message: req.t("PERMISSION.PERMISSION_FETCHED_SUCCESS"),
				data: permissions,
			})
		} catch (error) {
			return res.status(500).send({
				success: false,
				message: req.t("PERMISSION.PERMISSION_FETCHED_ERROR"),
				error: error,
			})
		}
	}
}

export default PermissionController
