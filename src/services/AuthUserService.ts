import sendMail from "@/utils/mailer"
import UserModel from "@/models/UserModel.js"
import HashPassword from "@/utils/hashPassword"
import jwt from "jsonwebtoken"
import UserTokensModel from "@/models/UserTokensModel"

export default class AuthUserService {
	async accessTokenRenew(refreshToken: string) {
		try {
			const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any

			if (!decoded) {
				return {
					success: false,
					message: "Invalid refresh token",
				}
			}

			if (decoded.expires_at < new Date()) {
				return {
					success: false,
					message: "Refresh token expired",
				}
			}

			const userToken = await new UserTokensModel().first({
				user_id: decoded.id,
				deleted_at: null,
				revoked_at: null,
			})

			if (!userToken) {
				return {
					success: false,
					message: "Refresh token record is not found",
				}
			}

			const body = {
				id: decoded.id,
				name_surname: decoded.name_surname,
				language: decoded.language,
				email: decoded.email,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			}

			const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "1d" })
			const newRefreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" })
			return {
				success: true,
				message: "Access token renewed",
				accessToken,
				refreshToken: newRefreshToken,
			}
		} catch (error) {
			return {
				success: false,
				message: "Error in accessTokenRenew",
			}
		}
	}

	async login(email: string, password: string, t: (key: string) => string) {
		try {
			const user = await new UserModel().first({ email })
			// console.log("user", user)
			if (!user) {
				return {
					success: false,
					message: t("AUTH.USER_NOT_FOUND"),
				}
			}


			console.log("user.password", user.password)
			console.log("HashPassword(password)", HashPassword(password))

			if (user.password !== HashPassword(password)) {
				return {
					success: false,
					message: t("AUTH.INVALID_PASSWORD"),
				}
			}

			const body = {
				id: user.id,
				name_surname: user.name_surname,
				language: user.language,
				email: user.email,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			}
			const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "1d" })
			const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" })

			// Kullanıcının mevcut token kaydını bul (revoked olanlar dahil)
			const existingToken = await new UserTokensModel().first({
				user_id: user.id,
			})

			if (existingToken) {
				// Mevcut kaydı güncelle - revoked_at'i null yap ve yeni token'ı kaydet
				await new UserTokensModel().update(existingToken.id, {
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
					revoked_at: null,
				})
			} else {
				// Hiç kayıt yoksa yeni oluştur
				await new UserTokensModel().create({
					user_id: user.id,
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
					device_name: "web",
				})
			}

			user.access_token = accessToken
			user.refresh_token = refreshToken
			return {
				success: true,
				message: t("AUTH.LOGIN_SUCCESS"),
				data: user,
			}
		} catch (error) {
			return {
				success: false,
				message: t("AUTH.LOGIN_ERROR"),
			}
		}
	}

	async register(name_surname: string, email: string, password: string, language: string, t: (key: string) => string) {
		try {
			const existingUser = await new UserModel().exists({ email })
			if (existingUser) {
				return {
					success: false,
					message: "Bu email zaten kullanılıyor",
				}
			}


			const user = await new UserModel().create({
				name_surname,
				email,
				password: password,
				language,
				avatar: "/uploads/avatar.png",
			})

			const body = {
				id: user.id,
				name_surname: user.name_surname,
				language: user.language,
				email: user.email,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			}

			sendMail(user.email, t("AUTH.REGISTER_SUCCESS"), t("AUTH.REGISTER_SUCCESS_DESCRIPTION"))

			const ACCESS_TOKEN = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "1d" })
			const REFRESH_TOKEN = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" })

			await new UserTokensModel().create({
				user_id: user.id,
				token_hash: REFRESH_TOKEN,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			})
			user.access_token = ACCESS_TOKEN
			user.refresh_token = REFRESH_TOKEN

			return {
				success: true,
				message: "Kullanıcı başarıyla oluşturuldu",
				data: user,
			}
		} catch (error) {
			console.log(error)
			return {
				success: false,
				message: t("AUTH.REGISTER_ERROR"),
			}
		}
	}

	async logout(accessToken: string, t: (key: string) => string) {
		try {
			const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as any
			const user = await new UserTokensModel().first({
				user_id: decoded.id,
				deleted_at: null,
				revoked_at: null,
			})

			if (!user) {
				return {
					success: false,
					message: "User not found",
				}
			}

			await new UserTokensModel().update(user.id, {
				revoked_at: new Date(),
			})

			return {
				success: true,
				message: t("AUTH.LOGOUT_SUCCESS"),
			}
		} catch (error) {
			return {
				success: false,
				message: t("AUTH.LOGOUT_ERROR"),
			}
		}
	}
}
