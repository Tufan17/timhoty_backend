// src/models/VisaReservationUserFileModel.ts
import BaseModel from "@/models/BaseModel"

class VisaReservationUserFileModel extends BaseModel {
	constructor() {
		super("visa_reservation_user_files")
	}

	static columns = [
		"id",
		"visa_reservation_id",
		"file_url",
		"file_name",
		"file_type",
		// 'document_type',
		// 'file_size',
		"created_at",
		"updated_at",
		"deleted_at",
	]
}

export default VisaReservationUserFileModel
