import UserModel from "@/models/UserModel"
import { FastifyRequest, FastifyReply } from "fastify"
import UserNotificationModel from "@/models/UserNotificationModel"
import HashPassword from "@/utils/hashPassword"

class UserController {
	async read(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const userId = (req as any).user?.id

			// Check if authenticated user is reading their own account
			if (userId !== id) {
				return res.status(403).send({
					success: false,
					message: req.t("AUTH.UNAUTHORIZED"),
				})
			}

			const user = await new UserModel().findId(id)
			if (!user) {
				return res.status(404).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}

			// Remove sensitive information before sending
			delete user.password

			return res.status(200).send({
				success: true,
				message: "User fetched successfully",
				data: user,
			})
		} catch (error: any) {
			console.error("Read user error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const userId = (req as any).user?.id
			const updateData = req.body as any

			// Check if authenticated user is updating their own account
			if (userId !== id) {
				return res.status(403).send({
					success: false,
					message: req.t("AUTH.UNAUTHORIZED"),
				})
			}

			// Check if user exists
			const existingUser = await new UserModel().findId(id)
			if (!existingUser) {
				return res.status(404).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}

			// Clean up empty strings for date/nullable/UUID fields
			if (updateData.birthday === "") {
				updateData.birthday = null
			}
			if (updateData.phone === "") {
				updateData.phone = null
			}
			if (updateData.currency_id === "") {
				updateData.currency_id = null
			}

			// Remove sensitive fields that shouldn't be updated via this endpoint
			delete updateData.password
			delete updateData.email_verified
			delete updateData.phone_verified
			delete updateData.deleted_at

			// Update only the fields that are provided
			const updatedUser = await new UserModel().update(id, updateData)

			return res.status(200).send({
				success: true,
				message: req.t("USER.UPDATE_SUCCESS"),
				data: updatedUser[0], // BaseModel.update returns an array
			})
		} catch (error: any) {
			console.error("Update user error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}

	async getAllNotifications(req: FastifyRequest, res: FastifyReply) {
		try {
			const userId = (req as any).user?.id
			const language = (req as any).language
			if (!userId) {
				return res.status(401).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}

			const notifications = await new UserNotificationModel().userNotifications(userId, language)

			return res.status(200).send({
				success: true,
				message: "Notifications fetched successfully",
				data: notifications,
			})
		} catch (error: any) {
			console.error("Get notifications error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}

	async readNotification(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const userId = (req as any).user?.id

			if (!userId) {
				return res.status(401).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}

			const notification = await new UserNotificationModel().findId(id)

			if (!notification) {
				return res.status(404).send({
					success: false,
					message: "Notification not found",
				})
			}

			// Check if notification belongs to this user
			if (notification.target_id !== userId) {
				return res.status(403).send({
					success: false,
					message: "Unauthorized",
				})
			}

			await new UserNotificationModel().update(id, {
				is_read: true,
			})

			return res.status(200).send({
				success: true,
				message: "Notification marked as read successfully",
				data: { ...notification, is_read: true },
			})
		} catch (error: any) {
			console.error("Read notification error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}

	async changePassword(req: FastifyRequest, res: FastifyReply) {
		try {
			const { old_password, new_password } = req.body as {
				old_password: string
				new_password: string
			}
			const userId = (req as any).user?.id
			const user = await new UserModel().findId(userId)
			if (!user) {
				return res.status(404).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}
			const isPasswordValid = await new UserModel().exists({
				password: HashPassword(old_password),
				id: userId,
			})
			if (!isPasswordValid) {
				return res.status(400).send({
					success: false,
					message: req.t("AUTH.INVALID_PASSWORD"),
				})
			}
			await new UserModel().update(userId, { password: new_password })
			return res.status(200).send({
				success: true,
				message: req.t("AUTH.PASSWORD_CHANGED_SUCCESS"),
			})
		} catch (error: any) {
			console.error("Change password error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}

	async updateElectronicContactPermission(req: FastifyRequest, res: FastifyReply) {
		try {
			const { electronic_contact_permission, email_contact, phone_contact, sms_contact, push_contact } = req.body as { electronic_contact_permission: boolean; email_contact: boolean; phone_contact: boolean; sms_contact: boolean; push_contact: boolean }
			const userId = (req as any).user?.id
			const user = await new UserModel().findId(userId)
			if (!user) {
				return res.status(404).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}
			// console.log(electronic_contact_permission)

			await new UserModel().update(userId, { electronic_contact_permission, email_contact, phone_contact, sms_contact, push_contact })
			return res.status(200).send({
				success: true,
				message: req.t("AUTH.ELECTRONIC_CONTACT_PERMISSION_UPDATED_SUCCESS"),
			})
		} catch (error: any) {
			console.error("Update electronic contact permission error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}
	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const userId = (req as any).user?.id
			const user = await new UserModel().findId(userId)
			if (!user) {
				return res.status(404).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}
			await new UserModel().delete(userId)
			return res.status(200).send({
				success: true,
				message: req.t("AUTH.USER_DELETED_SUCCESS"),
			})
		} catch (error: any) {
			console.error("Delete user error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}

	async verifyEmail(req: FastifyRequest, res: FastifyReply) {
		try {
			const { email_hash } = req.body as { email_hash: string }
				const jwt = require("jsonwebtoken");
			let decoded: any;
			
			try {
				decoded = jwt.verify(email_hash, process.env.ACCESS_TOKEN_SECRET!);
			} catch (jwtError: any) {
				return res.status(200).send({
					success: false,
					message: req.t("AUTH.INVALID_TOKEN"),
					error: jwtError.message,
				})
			}

			// Verify this token is for email verification
			if (!decoded || decoded.purpose !== 'email_verification') {
				return res.status(200).send({
					success: false,
					message: req.t("AUTH.INVALID_TOKEN"),
				})
			}

			// Check expiry
			if (new Date(decoded.expires_at) < new Date()) {
				return res.status(200).send({
					success: false,
					message: req.t("AUTH.TOKEN_EXPIRED"),
				})
			}

			const user = await new UserModel().first({ email: decoded.email })

			if (!user) {
				return res.status(200).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}

			if (user.email_verified) {
				return res.status(200).send({
					success: true,
					message: req.t("AUTH.EMAIL_ALREADY_VERIFIED"),
				})
			}
			await new UserModel().update(user.id, { email_verified: true })

			return res.status(200).send({
				success: true,
				message: req.t("AUTH.EMAIL_VERIFIED_SUCCESS"),
				data: {
					email: user.email,
					name: user.name_surname
				}
			})
		} catch (error: any) {
			console.error("Verify email error:", error)
			return res.status(500).send({
				success: false,
				message: error.message,
			})
		}
	}
}

export default UserController
