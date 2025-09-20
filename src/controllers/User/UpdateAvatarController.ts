import { FastifyRequest, FastifyReply } from "fastify"
import UserModel from "@/models/UserModel"

class UpdateAvatarController {
	async updateAvatar(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { avatar } = req.body as { avatar?: string }

			// Mevcut kullanıcıyı kontrol et
			const existingUser = await new UserModel().first({ id })

			if (!existingUser) {
				return res.status(404).send({
					success: false,
					message: req.t("USER.USER_NOT_FOUND"),
				})
			}

			const updateData = {
				avatar: avatar || existingUser.avatar,
			}

			await new UserModel().update(id, updateData)
			const updatedUser = await new UserModel().first({ id })

			return res.status(200).send({
				success: true,
				message: req.t("USER.AVATAR_UPDATED_SUCCESS"),
				data: {
					id: updatedUser?.id,
					name_surname: updatedUser?.name_surname,
					email: updatedUser?.email,
					avatar: updatedUser?.avatar,
				},
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("USER.AVATAR_UPDATED_ERROR"),
			})
		}
	}
}

export default UpdateAvatarController
