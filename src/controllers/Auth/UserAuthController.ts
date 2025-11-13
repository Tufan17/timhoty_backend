import { FastifyRequest, FastifyReply } from "fastify"
import AuthUserService from "../../services/AuthUserService"
import UserModel from "@/models/UserModel"

export default class UserAuthController {
	async accessTokenRenew(req: FastifyRequest, res: FastifyReply) {
		try {
			const { refresh_token } = req.body as { refresh_token: string }
			const user = await new AuthUserService().accessTokenRenew(refresh_token)
			if (!user.success) {
				return res.status(400).send({
					success: false,
					message: user.message,
				})
			}
			return {
				success: true,
				message: user.message,
				data: {
					access_token: user.accessToken,
					refresh_token: user.refreshToken,
				},
			}
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User login
	async login(req: FastifyRequest, res: FastifyReply) {
		try {
			const { email, password } = req.body as {
				email: string
				password: string
			}
			// console.log(email, password)
			const user = await new AuthUserService().login(email, password, req.t)
			if (!user.success) {
				return res.status(400).send({
					success: false,
					message: user.message,
				})
			}
			return user
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User register
	async register(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				name_surname,
				email,
				password,
				language = "en",
			} = req.body as {
				name_surname: string
				email: string
				password: string
				language: string
			}
			const user = await new AuthUserService().register(name_surname, email, password, language, req.t)
			if (!user.success) {
				return res.status(400).send({
					success: false,
					message: user.message,
				})
			}
			return user
		} catch (error: any) {
			return res.status(400).send({
				success: false,
				message: error.message,
			})
		}
	}

	// User logout
	async logout(req: FastifyRequest, res: FastifyReply) {
		try {
			const accessToken = req.headers.authorization?.split(" ")[1]!
			const user = await new AuthUserService().logout(accessToken, req.t)
			return user
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User forgot password
	async forgotPassword(req: FastifyRequest, res: FastifyReply) {
		try {
			const { email, language = "en" } = req.body as { email: string; language: string }
			const user = await new AuthUserService().forgotPassword(email, language, req.t)
			return user
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User verify code
	async verifyCode(req: FastifyRequest, res: FastifyReply) {
		try {
			const { email, code } = req.body as { email: string; code: string }
			const exists = await new UserModel().first({ email })
			if (!exists) {
				return res.status(400).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}

			if (new Date() > new Date(exists.verification_code_expires_at)) {
				return res.status(400).send({
					success: false,
					message: req.t("AUTH.VERIFICATION_CODE_EXPIRED"),
				})
			}

			if (exists.verification_code !== code) {
				return res.status(400).send({
					success: false,
					message: req.t("AUTH.INVALID_VERIFICATION_CODE"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("AUTH.VERIFICATION_CODE_VERIFIED"),
			})
		} catch (error: any) {
			return res.status(400).send({
				success: false,
				message: error.message,
				error: error,
			})
		}
	}

	// User reset password
	async resetPassword(req: FastifyRequest, res: FastifyReply) {
		try {
			const { email, code, password } = req.body as {
				email: string
				code: string
				password: string
			}
			const user = await new AuthUserService().resetPassword(email, code, password, req.t)
			if (!user.success) {
				return res.status(400).send({
					success: false,
					message: user.message,
				})
			}
			return user
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User google login
	async googleLogin(req: FastifyRequest, res: FastifyReply) {
		try {
			const { credential } = req.body as { credential: string }
			const user = await new AuthUserService().googleLogin(credential, req.t)
			if (!user.success) {
				return res.status(400).send({
					success: false,
					message: user.message,
				})
			}
			return user
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User facebook login
	async facebookLogin(req: FastifyRequest, res: FastifyReply) {
		try {
			const { accessToken, userID } = req.body as { accessToken: string; userID: string }
			const user = await new AuthUserService().facebookLogin(accessToken, userID, req.t)
			if (!user.success) {
				return res.status(400).send({
					success: false,
					message: user.message,
				})
			}
			return user
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User apple login
	async appleLogin(req: FastifyRequest, res: FastifyReply) {
		try {
			const { identityToken, userIdentifier, email, givenName, familyName } = req.body as {
				identityToken: string
				userIdentifier: string
				email?: string
				givenName?: string
				familyName?: string
			}
			const user = await new AuthUserService().appleLogin(
				identityToken,
				userIdentifier,
				email,
				givenName,
				familyName,
				req.t
			)
			if (!user.success) {
				return res.status(400).send({
					success: false,
					message: user.message,
				})
			}
			return user
		} catch (error: any) {
			return res.status(400).send(error.message)
		}
	}

	// User verify email with hash
	async verifyEmail(req: FastifyRequest, res: FastifyReply) {
		try {
			const { emailHash } = req.body as { emailHash: string }

			// Find user by hashing all emails and comparing
			const crypto = require("node:crypto")
			const users = await new UserModel().getAll()

			let foundUser = null
			for (const user of users) {
				const userEmailHash = crypto.createHash("sha256").update(user.email).digest("hex")
				if (userEmailHash === emailHash) {
					foundUser = user
					break
				}
			}

			if (!foundUser) {
				return res.status(400).send({
					success: false,
					message: req.t("AUTH.USER_NOT_FOUND"),
				})
			}

			// Update email_verified status
			await new UserModel().update(foundUser.id, {
				email_verified: true,
			})

			return res.status(200).send({
				success: true,
				message: req.t("AUTH.EMAIL_VERIFIED_SUCCESS"),
				data: {
					email: foundUser.email,
					name: foundUser.name_surname,
				},
			})
		} catch (error: any) {
			return res.status(400).send({
				success: false,
				message: error.message,
				error: error,
			})
		}
	}
}
