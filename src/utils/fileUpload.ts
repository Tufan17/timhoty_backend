// src/utils/fileUpload.ts
import fs from "fs"
import path from "path"
import { MultipartFile } from "@fastify/multipart"
import { v4 as uuidv4 } from "uuid"

export async function saveUploadedFile(file: MultipartFile, folder: string): Promise<string> {
	const uploadDir = path.join(__dirname, "../../uploads", folder)

	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true })
	}

	const filePath = path.join(uploadDir, file.filename)

	await new Promise<void>((resolve, reject) => {
		const writeStream = fs.createWriteStream(filePath)
		file.file.pipe(writeStream)
		file.file.on("end", () => resolve())
		file.file.on("error", err => reject(err))
	})

	const fileExtension = path.extname(file.filename)
	const uniqueFileName = `${uuidv4()}${fileExtension}`
	const newFilePath = path.join(uploadDir, uniqueFileName)

	fs.rename(filePath, newFilePath, err => {
		if (err) {
			console.error("Error renaming the file:", err)
		} else {
			console.log("File renamed and saved as:", newFilePath)
		}
	})

	return "/uploads/" + folder + "/" + uniqueFileName
}
