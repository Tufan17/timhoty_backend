import { FastifyRequest, FastifyReply } from "fastify"
import FCMTokenModel from "@/models/FCMTokenModel"

class FCMTokenController {
	async saveToken(req: FastifyRequest, res: FastifyReply) {
		try {
			const { token } = req.body as { token: string }
			const language = (req as any).language;
			

			if (!token || typeof token !== "string" || token.trim() === "") {
				return res.status(400).send({
					success: false,
					message: "Token is required",
				})
			}

			const fcmTokenModel = new FCMTokenModel()
			const result = await fcmTokenModel.saveOrUpdateToken(token.trim(), language)

			return res.status(200).send({
				success: true,
				message: "FCM token saved successfully",
				data: result,
			})
		} catch (error: any) {
			console.error("Save FCM token error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Failed to save FCM token",
			})
		}
	}
}

export default FCMTokenController

