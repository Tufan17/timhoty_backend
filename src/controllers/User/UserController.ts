import UserModel from "@/models/UserModel"
import { FastifyRequest, FastifyReply } from "fastify"

class UserController {
	async read(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const user = await new UserModel().findId(id)
			if (!user) {
				return {
					success: false,
					message: "Kullanıcı bulunamadı",
				}
			}
			return {
				success: true,
				message: "Kullanıcı başarıyla okundu",
				data: user,
			}
		} catch (error: any) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const updateData = req.body as any
			console.log(updateData)

			// Check if user exists
			const existingUser = await new UserModel().findId(id)
			if (!existingUser) {
				return {
					success: false,
					message: "Kullanıcı bulunamadı",
				}
			}

			// Update only the fields that are provided
			const updatedUser = await new UserModel().update(id, updateData)

			return {
				success: true,
				message: "Kullanıcı başarıyla güncellendi",
				data: updatedUser[0], // BaseModel.update returns an array
			}
		} catch (error: any) {
			return {
				success: false,
				message: error.message,
			}
		}
	}
}

export default UserController
