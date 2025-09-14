import jwt from "jsonwebtoken"
import { FastifyRequest, FastifyReply } from "fastify"
import SolutionPartnerTokenModel from "@/models/SolutionPartnerTokenModel"
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel"

export const authSolutionPartnerMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
	const authHeader = request.headers.authorization

	if (!authHeader?.startsWith("Bearer ")) {
		return reply.status(401).send({
			success: false,
			message: request.t("AUTH.TOKEN_NOT_FOUND"),
		})
	}

	const token = authHeader.split(" ")[1]

	try {
		// JWT token'ı verify et
		const payload = jwt.verify(token, process.env.JWT_SECRET!) as any

		// Token'ın süresi dolmuş mu kontrol et
		if (payload.expires_at < new Date()) {
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.TOKEN_EXPIRED"),
			})
		}

		if (!payload) {
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.TOKEN_INVALID"),
			})
		}

		// Token'ı veritabanından kontrol et
		const solutionPartnerToken = await new SolutionPartnerTokenModel().first({ token })
		if (!solutionPartnerToken) {
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.TOKEN_NOT_FOUND"),
			})
		}

		// Token'ın veritabanındaki süresi dolmuş mu kontrol et
		if (new Date() > new Date(solutionPartnerToken.expires_at)) {
			// Süresi dolmuş token'ı sil
			await new SolutionPartnerTokenModel().delete(solutionPartnerToken.id)
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.TOKEN_EXPIRED"),
				logout: true,
			})
		}

		// Solution Partner User bilgilerini al
		const solutionPartnerUser = await new SolutionPartnerUserModel().first({
			id: payload.id,
		})

		if (!solutionPartnerUser) {
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.SOLUTION_PARTNER_NOT_FOUND"),
			})
		}

		// Kullanıcının aktif olup olmadığını kontrol et
		// if (solutionPartnerUser.status === false) {
		//   return reply.status(401).send({
		//     success: false,
		//     message: request.t('AUTH.SOLUTION_PARTNER_NOT_ACTIVE')
		//   });
		// }

		// User bilgilerini request'e ekle
		;(request as any).user = {
			...payload,
			type: "solution_partner",
			dbUser: solutionPartnerUser,
		}
	} catch (err: any) {
		if (err.message === "jwt expired") {
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.TOKEN_EXPIRED"),
				logout: true,
				error: err,
			})
		}

		return reply.status(401).send({
			success: false,
			message: request.t("AUTH.TOKEN_INVALID"),
			error: err,
		})
	}
}
