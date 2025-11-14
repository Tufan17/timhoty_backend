import sendMail from "@/utils/mailer"
import UserModel from "@/models/UserModel.js"
import HashPassword from "@/utils/hashPassword"
import jwt from "jsonwebtoken"
import UserTokensModel from "@/models/UserTokensModel"
import { OAuth2Client } from "google-auth-library"
import axios from "axios"
const jwksClient = require("jwks-rsa")

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

			const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
				expiresIn: "1d",
			})
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
			// console.log(HashPassword(password), user.password)
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
			const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
				expiresIn: "1d",
			})
			const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
				expiresIn: "7d",
			})

			// Kullanıcının mevcut token kaydını bul (revoked olanlar dahil)
			const existingToken = await new UserTokensModel().first({
				user_id: user.id,
			})

			if (existingToken) {
				// Mevcut kaydı güncelle - revoked_at'i null yap ve yeni token'ı kaydet
				await new UserTokensModel().update(existingToken.id, {
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					revoked_at: null,
				})
			} else {
				// Hiç kayıt yoksa yeni oluştur
				await new UserTokensModel().create({
					user_id: user.id,
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

			welcomeEmail(email, name_surname, language)

			verificationEmail(email, name_surname, language)

			const body = {
				id: user.id,
				name_surname: user.name_surname,
				language: user.language,
				email: user.email,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			}

			const ACCESS_TOKEN = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
				expiresIn: "1d",
			})
			const REFRESH_TOKEN = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
				expiresIn: "7d",
			})

			await new UserTokensModel().create({
				user_id: user.id,
				token_hash: REFRESH_TOKEN,
				expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

	async forgotPassword(email: string, language: string = "en", t: (key: string) => string) {
		try {
			console.log("email", email)
			const user = await new UserModel().first({ email })
			if (!user) {
				return {
					success: false,
					message: t("AUTH.USER_NOT_FOUND"),
				}
			}
			// 6 haneli rastgele bir sayı oluştur
			const verificationCode = Math.floor(100000 + Math.random() * 900000)

			// Send HTML email with template
			try {
				const path = require("path")
				const fs = require("fs")
				const templateFileName = language === "en" ? "forgot_pass-en.html" : "forgot_pass-tr.html"
				const emailTemplatePath = path.join(process.cwd(), "emails", templateFileName)
				const emailHtml = fs.readFileSync(emailTemplatePath, "utf8")

				const uploadsUrl = process.env.UPLOADS_URL
				let html = emailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)
				html = html.replace(/\{\{name\}\}/g, user.name_surname)
				html = html.replace(/\{\{code\}\}/g, verificationCode.toString())

				const emailSubject = language === "en" ? "Timhoty - Password Reset" : "Timhoty - Şifre Sıfırlama"

				await sendMail(user.email, emailSubject, html)
			} catch (error) {
				console.error("Forgot password email error:", error)
				// Fallback to simple text email
				sendMail(user.email, t("AUTH.FORGOT_PASSWORD_SUCCESS"), verificationCode.toString())
			}

			// 15 dakika sonra verification_code_expires_at'i null yap
			user.verification_code_expires_at = new Date(Date.now() + 15 * 60 * 1000)

			await new UserModel().update(user.id, {
				verification_code: verificationCode,
				verification_code_expires_at: user.verification_code_expires_at,
			})
			return {
				success: true,
				message: t("AUTH.FORGOT_PASSWORD_SUCCESS"),
			}
		} catch (error) {
			return {
				success: false,
				message: t("AUTH.FORGOT_PASSWORD_ERROR"),
			}
		}
	}

	async resetPassword(email: string, code: string, password: string, t: (key: string) => string) {
		try {
			const user = await new UserModel().first({
				email,
				verification_code: code,
			})
			if (!user) {
				return {
					success: false,
					message: t("AUTH.USER_NOT_FOUND"),
				}
			}
			await new UserModel().update(user.id, {
				password: password,
			})
			return {
				success: true,
				message: t("AUTH.RESET_PASSWORD_SUCCESS"),
			}
		} catch (error) {
			return {
				success: false,
				message: t("AUTH.RESET_PASSWORD_ERROR"),
			}
		}
	}

	async googleLogin(credential: string, t: (key: string) => string) {
		try {
			// Google OAuth2Client oluştur
			const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

			// Token'ı verify et ve decode et
			const ticket = await client.verifyIdToken({
				idToken: credential,
				audience: process.env.GOOGLE_CLIENT_ID,
			})

			const payload = ticket.getPayload()

			if (!payload || !payload.email) {
				return {
					success: false,
					message: t("AUTH.GOOGLE_LOGIN_ERROR"),
				}
			}

			// Kullanıcı bilgileri
			const googleEmail = payload.email
			const googleName = payload.name || ""
			const googlePicture = payload.picture || "/uploads/avatar.png"
			const emailVerified = payload.email_verified || false

			// Kullanıcı zaten kayıtlı mı kontrol et
			let user = await new UserModel().first({ email: googleEmail })

			if (!user) {
				// Yeni kullanıcı oluştur
				user = await new UserModel().create({
					name_surname: googleName,
					email: googleEmail,
					password: HashPassword(Math.random().toString(36).substring(2, 15)), // Random password
					language: "tr",
					avatar: googlePicture,
					email_verified: emailVerified,
				})

				welcomeEmail(googleEmail, googleName)
			}

			if (!user) {
				return {
					success: false,
					message: t("AUTH.GOOGLE_LOGIN_ERROR"),
				}
			}

			// JWT token oluştur
			const body = {
				id: user.id,
				name_surname: user.name_surname,
				language: user.language,
				email: user.email,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			}

			const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
				expiresIn: "1d",
			})
			const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
				expiresIn: "7d",
			})

			// Token kaydını güncelle veya oluştur
			const existingToken = await new UserTokensModel().first({
				user_id: user.id,
			})

			if (existingToken) {
				await new UserTokensModel().update(existingToken.id, {
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					revoked_at: null,
				})
			} else {
				await new UserTokensModel().create({
					user_id: user.id,
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
			console.error("Google login error:", error)
			return {
				success: false,
				message: t("AUTH.GOOGLE_LOGIN_ERROR"),
			}
		}
	}

	async facebookLogin(token: string, userID: string, t: (key: string) => string) {
		try {
			let email: string
			let name: string
			let picture: any
			let id: string

			// Token türünü kontrol et
			if (token.startsWith('ey')) {
				// JWT ID Token (Mobil) - OpenID Connect
				console.log("Facebook JWT Token detected (Mobile)")
				const payload = await verifyFacebookJWT(token) as any
				email = payload.email
				name = payload.name
				id = payload.sub // JWT'de user ID 'sub' alanında
				picture = null // JWT'de genellikle resim yok
			} else {
				// Access Token (Web) - Graph API
				console.log("Facebook Access Token detected (Web)")
				const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`)
				const data = response.data
				id = data.id
				name = data.name
				email = data.email
				picture = data.picture
			}

			if (!email) {
				return {
					success: false,
					message: t("AUTH.FACEBOOK_EMAIL_REQUIRED"),
				}
			}

			// Kullanıcı bilgileri
			const facebookEmail = email
			const facebookName = name || ""
			const facebookPicture = picture?.data?.url || "/uploads/avatar.png"

			// Kullanıcı zaten kayıtlı mı kontrol et
			let user = await new UserModel().first({ email: facebookEmail })

			if (!user) {
				// Yeni kullanıcı oluştur
				user = await new UserModel().create({
					name_surname: facebookName,
					email: facebookEmail,
					password: HashPassword(Math.random().toString(36).substring(2, 15)), // Random password
					language: "tr",
					avatar: facebookPicture,
					email_verified: true, // Facebook'tan gelen email'ler verify edilmiş kabul ediyoruz
				})

				welcomeEmail(facebookEmail, facebookName)
			}

			if (!user) {
				return {
					success: false,
					message: t("AUTH.FACEBOOK_LOGIN_ERROR"),
				}
			}

			// JWT token oluştur
			const body = {
				id: user.id,
				name_surname: user.name_surname,
				language: user.language,
				email: user.email,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			}

			const jwtAccessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
				expiresIn: "1d",
			})
			const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
				expiresIn: "7d",
			})

			// Token kaydını güncelle veya oluştur
			const existingToken = await new UserTokensModel().first({
				user_id: user.id,
			})

			if (existingToken) {
				await new UserTokensModel().update(existingToken.id, {
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					revoked_at: null,
				})
			} else {
				await new UserTokensModel().create({
					user_id: user.id,
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				})
			}

			user.access_token = jwtAccessToken
			user.refresh_token = refreshToken

			return {
				success: true,
				message: t("AUTH.LOGIN_SUCCESS"),
				data: user,
			}
		} catch (error) {
			console.error("Facebook login error:", error)
			return {
				success: false,
				message: t("AUTH.FACEBOOK_LOGIN_ERROR"),
			}
		}
	}

	async appleLogin(
		identityToken: string,
		userIdentifier: string,
		email?: string,
		givenName?: string,
		familyName?: string,
		t?: (key: string) => string
	) {
		try {
			// Apple JWT token'ını doğrula
			const payload = await verifyAppleJWT(identityToken) as any

			console.log("Apple JWT payload:", payload)

			// Apple'dan gelen bilgiler
			const appleEmail = email || payload.email
			const appleName = givenName && familyName
				? `${givenName} ${familyName}`
				: givenName || familyName || "Apple User"
			const appleUserId = payload.sub

			if (!appleEmail) {
				return {
					success: false,
					message: t ? t("AUTH.APPLE_EMAIL_REQUIRED") : "Email is required",
				}
			}

			// Kullanıcı zaten kayıtlı mı kontrol et
			let user = await new UserModel().first({ email: appleEmail })

			if (!user) {
				// Yeni kullanıcı oluştur
				user = await new UserModel().create({
					name_surname: appleName,
					email: appleEmail,
					password: HashPassword(Math.random().toString(36).substring(2, 15)), // Random password
					language: "tr",
					avatar: "/uploads/avatar.png",
					email_verified: payload.email_verified || true, // Apple'dan gelen email'ler verify edilmiş
				})

				if (t) {
					welcomeEmail(appleEmail, appleName, "tr")
				}
			}

			if (!user) {
				return {
					success: false,
					message: t ? t("AUTH.APPLE_LOGIN_ERROR") : "Apple login failed",
				}
			}

			// JWT token oluştur
			const body = {
				id: user.id,
				name_surname: user.name_surname,
				language: user.language,
				email: user.email,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
			}

			const jwtAccessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
				expiresIn: "1d",
			})
			const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
				expiresIn: "7d",
			})

			// Token kaydını güncelle veya oluştur
			const existingToken = await new UserTokensModel().first({
				user_id: user.id,
			})

			if (existingToken) {
				await new UserTokensModel().update(existingToken.id, {
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					revoked_at: null,
				})
			} else {
				await new UserTokensModel().create({
					user_id: user.id,
					token_hash: refreshToken,
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				})
			}

			user.access_token = jwtAccessToken
			user.refresh_token = refreshToken

			return {
				success: true,
				message: t ? t("AUTH.LOGIN_SUCCESS") : "Login successful",
				data: user,
			}
		} catch (error) {
			console.error("Apple login error:", error)
			return {
				success: false,
				message: t ? t("AUTH.APPLE_LOGIN_ERROR") : "Apple login failed",
			}
		}
	}
}
// async function welcomeEmail(email: string, name: string) {
// 	try {
// 		const sendMail = (await import("@/utils/mailer")).default
// 		const path = require("path")
// 		const fs = require("fs")
// 		const emailTemplatePath = path.join(process.cwd(), "emails", "register.html")
// 		const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8")

// 		const uploadsUrl = process.env.UPLOADS_URL
// 		let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)

// 		html = html.replace(/\{\{name\}\}/g, name)

// 		await sendMail(email, "Timhoty'ye Hoş Geldiniz", html)
// 	} catch (error) {
// 		console.error("Register email error:", error)
// 	}
// }
async function welcomeEmail(email: string, name: string, language: string = "tr") {
	try {
		const sendMail = (await import("@/utils/mailer")).default
		const path = require("path")
		const fs = require("fs")

		// Dil bazlı template dosyası seçimi
		const templateFileName = language === "en" ? "register-en.html" : "register-tr.html"
		const emailTemplatePath = path.join(process.cwd(), "emails", templateFileName)
		const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8")

		const uploadsUrl = process.env.UPLOADS_URL
		let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)
		html = html.replace(/\{\{name\}\}/g, name)

		// Dil bazlı email başlığı
		const emailSubject = language === "en" ? "Welcome to Timhoty" : "Timhoty'ye Hoş Geldiniz"

		await sendMail(email, emailSubject, html)
	} catch (error) {
		console.error("Register email error:", error)
	}
}

async function verificationEmail(email: string, name: string, language: string = "tr") {
	try {
		const sendMail = (await import("@/utils/mailer")).default
		const path = require("path")
		const fs = require("fs")
		const templateFileName = language === "en" ? "email-verification-en.html" : "email-verification-tr.html"
		const emailTemplatePath = path.join(process.cwd(), "emails", templateFileName)
		const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8")
		const uploadsUrl = process.env.UPLOADS_URL
		let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)

		// Create JWT token for verification with 10 minute expiry
		const verificationPayload = {
			email: email,
			purpose: "email_verification",
			expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
		}

		const verificationToken = jwt.sign(verificationPayload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "10m" })

		const verificationUrl = `${process.env.FRONTEND_URL}#${verificationToken}`
		html = html.replace(/\{\{url\}\}/g, verificationUrl)
		html = html.replace(/\{\{name\}\}/g, name)

		console.log("Verification token created:", verificationToken.substring(0, 50) + "...")
		console.log("Verification URL:", verificationUrl)
		const emailSubject = language === "en" ? "Timhoty - Email Verification" : "Timhoty - E-posta Doğrulama"

		await sendMail(email, emailSubject, html)
	} catch (error) {
		console.error("Verification email error:", error)
	}
}

// Facebook JWT doğrulama fonksiyonu
const facebookIssuer = "https://www.facebook.com"
const facebookJwksUri = `${facebookIssuer}/.well-known/oauth/openid/jwks/`

async function verifyFacebookJWT(idToken: string) {
	try {
		const { data } = await axios.get(facebookJwksUri)
		const decodedToken = jwt.decode(idToken, { complete: true })

		if (!decodedToken || !decodedToken.header.kid) {
			throw new Error("Invalid token structure")
		}

		const key = data.keys.find((k: any) => k.kid === decodedToken.header.kid)

		if (!key) {
			throw new Error("Signing key not found")
		}

		const client = jwksClient({ jwksUri: facebookJwksUri })
		const signingKey = await client.getSigningKey(key.kid)
		const publicKey = signingKey.getPublicKey()

		const payload = jwt.verify(idToken, publicKey, {
			algorithms: ["RS256"],
			issuer: facebookIssuer,
		})

		return payload
	} catch (error) {
		console.error("Facebook JWT verification error:", error)
		throw error
	}
}

// Apple JWT doğrulama fonksiyonu
const appleIssuer = "https://appleid.apple.com"
const appleJwksUri = `${appleIssuer}/auth/keys`

async function verifyAppleJWT(idToken: string) {
	try {
		const { data } = await axios.get(appleJwksUri)
		const decodedToken = jwt.decode(idToken, { complete: true })

		if (!decodedToken || !decodedToken.header.kid) {
			throw new Error("Invalid token structure")
		}

		const key = data.keys.find((k: any) => k.kid === decodedToken.header.kid)

		if (!key) {
			throw new Error("Signing key not found")
		}

		const client = jwksClient({ jwksUri: appleJwksUri })
		const signingKey = await client.getSigningKey(key.kid)
		const publicKey = signingKey.getPublicKey()

		const payload = jwt.verify(idToken, publicKey, {
			algorithms: ["RS256"],
			issuer: appleIssuer,
		})

		return payload
	} catch (error) {
		console.error("Apple JWT verification error:", error)
		throw error
	}
}
