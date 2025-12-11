// knexfile.ts
import type { Knex } from "knex"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })

const config: { [key: string]: Knex.Config } = {
	development: {
		client: "pg",
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE,
		},
		migrations: {
			directory: "./src/db/migrations",
		},
		seeds: {
			directory: "./src/db/seeds",
		},
	},
}

export default config
