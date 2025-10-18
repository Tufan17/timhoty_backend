import jwt from "jsonwebtoken"
import { FastifyRequest, FastifyReply } from "fastify"
import SalesPartnerTokenModel from "@/models/SalesPartnerTokenModel"
import SalesPartnerUserModel from "@/models/SalesPartnerUserModel"

export const authSalesPartnerMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
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
		const salesPartnerToken = await new SalesPartnerTokenModel().first({ token })
		if (!salesPartnerToken) {
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.TOKEN_NOT_FOUND"),
			})
		}

		// Token'ın veritabanındaki süresi dolmuş mu kontrol et
		if (new Date() > new Date(salesPartnerToken.expires_at)) {
			// Süresi dolmuş token'ı sil
			await new SalesPartnerTokenModel().delete(salesPartnerToken.id)
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.TOKEN_EXPIRED"),
				logout: true,
			})
		}

		// Sales Partner User bilgilerini al
		const salesPartnerUser = await new SalesPartnerUserModel().first({
			id: payload.id,
		})

		if (!salesPartnerUser) {
			return reply.status(401).send({
				success: false,
				message: request.t("AUTH.SALES_PARTNER_NOT_FOUND"),
			})
		}

		// Kullanıcının aktif olup olmadığını kontrol et
		// if (salesPartnerUser.status === false) {
		//   return reply.status(401).send({
		//     success: false,
		//     message: request.t('AUTH.SALES_PARTNER_NOT_ACTIVE')
		//   });
		// }

		// User bilgilerini request'e ekle
		;(request as any).user = {
			...payload,
			type: "sales_partner",
			dbUser: salesPartnerUser,
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
