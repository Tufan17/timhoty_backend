import Fastify from "fastify"
import cors from "@fastify/cors"
import multipart from "@fastify/multipart"
import app from "./app"
import dotenv from "dotenv"
dotenv.config({ path: path.resolve(__dirname, "../.env") })
import "./crone/index"

const PORT = process.env.PORT || 3005
const HOST = process.env.HOST || "0.0.0.0"
import staticPlugin from "@fastify/static"
import path from "path"
import { languageMiddleware } from "./middlewares/languageMiddleware"

const server = Fastify({ logger: false })

const start = async () => {
	try {
		await server.register(cors, {
			origin: ["http://167.71.3.100", "http://localhost:5173", "http://localhost:5174"],
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
		})

		await server.register(multipart, {
			limits: {
				fileSize: 50 * 1024 * 1024, // 50 MB
			},
		})

		server.register(staticPlugin, {
			root: path.join(__dirname, "../uploads"),
			prefix: "/uploads/",
		})
		await server.register(app)

		server.addHook("preHandler", languageMiddleware)

		await server.listen({ port: Number(PORT), host: HOST })

		console.log(`Server listening on http://${HOST}:${PORT}`)
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}

start()
