import { FastifyRequest, FastifyReply } from "fastify"
import ReservationModel from "@/models/HotelReservationModel"
import VisaReservationModel from "@/models/VisaReservationModel"
import TourReservationModel from "@/models/TourReservationModel"
import ActivityReservationModel from "@/models/ActivityReservationModel"
import CarRentalReservationModel from "@/models/CarRentalReservationModel"

export default class ReservationController {
	async index(req: FastifyRequest, res: FastifyReply) {
		try {
			const reservationModel = new ReservationModel()
			const visaReservationModel = new VisaReservationModel()
			const tourReservationModel = new TourReservationModel()
			const activityReservationModel = new ActivityReservationModel()
			const carRentalReservationModel = new CarRentalReservationModel()
			let reservations: any[] = []

			const hotelReservations = await reservationModel.getUserReservation(req.user?.id as string, (req as any).language)

			const visaReservations = await visaReservationModel.getUserReservation(req.user?.id as string, (req as any).language)

			const tourReservations = await tourReservationModel.getUserReservation(req.user?.id as string, (req as any).language)

			const activityReservations = await activityReservationModel.getUserReservation(req.user?.id as string, (req as any).language)

			const carRentalReservations = await carRentalReservationModel.getUserReservation(req.user?.id as string, (req as any).language)

			// birleştir ve sırala ama bi tip ekle yani hotel mi visa mi tour mu activity mi
			reservations = [...hotelReservations, ...visaReservations, ...tourReservations, ...activityReservations, ...carRentalReservations].map(reservation => ({
				...reservation,
				type: reservation.hotel_id ? "hotel" : reservation.visa_id ? "visa" : reservation.tour_id ? "tour" : reservation.activity_id ? "activity" : reservation.car_rental_id ? "car_rental" : "other",
			}))

			reservations = reservations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

			return res.status(200).send({
				success: true,
				message: "Reservations retrieved successfully",
				data: reservations,
			})
		} catch (error) {
			return res.status(500).send({
				success: false,
				message: "Error retrieving reservations",
				data: error,
			})
		}
	}
	async mobile(req: FastifyRequest, res: FastifyReply) {
		try {
			const reservationModel = new ReservationModel()
			const visaReservationModel = new VisaReservationModel()
			const tourReservationModel = new TourReservationModel()
			const activityReservationModel = new ActivityReservationModel()
			const carRentalReservationModel = new CarRentalReservationModel()
			let reservations: any[] = []
			const id = req.user?.id as string

			const hotelReservations = await reservationModel.getUserReservation(id as string, (req as any).language)

			const visaReservations = await visaReservationModel.getUserReservation(id as string, (req as any).language)

			const tourReservations = await tourReservationModel.getUserReservation(id as string, (req as any).language)

			const activityReservations = await activityReservationModel.getUserReservation(id as string, (req as any).language)

			const carRentalReservations = await carRentalReservationModel.getUserReservation(id as string, (req as any).language)

			// birleştir ve sırala ama bi tip ekle yani hotel mi visa mi tour mu activity mi
			reservations = [...hotelReservations, ...visaReservations, ...tourReservations, ...activityReservations, ...carRentalReservations].map(reservation => ({
				...reservation,
				type: reservation.hotel_id ? "hotel" : reservation.visa_id ? "visa" : reservation.tour_id ? "tour" : reservation.activity_id ? "activity" : reservation.car_rental_id ? "car_rental" : "other",
			}))

			reservations = reservations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

			return res.status(200).send({
				success: true,
				message: "Reservations retrieved successfully",
				data: reservations.map(reservation => {
					return {
						id: reservation.id,
						module_id: reservation.hotel_id || reservation.tour_id || reservation.car_rental_id || reservation.activity_id||reservation.visa_id,
						progress_id: reservation.progress_id,
						county: reservation.hotel_country || reservation.tour_country || reservation.car_rental_country || reservation.activity_country || reservation.visa_country,
						city: reservation.hotel_city || reservation.tour_city || reservation.car_rental_city || reservation.activity_city || reservation.visa_city,
						comment: reservation.comment,
						title: reservation.hotel_name || reservation.tour_name || reservation.car_rental_name || reservation.activity_title || reservation.visa_title,
						adult: reservation.guests.filter((guest: any) => guest.type === "adult").length,
						child: reservation.guests.filter((guest: any) => guest.type === "child").length,
						baby: reservation.guests.filter((guest: any) => guest.type === "baby").length,
						type: reservation.hotel_id ? "hotel" : reservation.tour_id ? "tour" : reservation.car_rental_id ? "car_rental" : reservation.activity_id ? "activity" : reservation.visa_id ? "visa" : "other",
						start_date: reservation.start_date || reservation.package_date || reservation.car_rental_start_date || reservation.activity_start_date || null,
						end_date: reservation.end_date || reservation.car_rental_end_date || reservation.activity_end_date || null,
						image: reservation.hotel_image || reservation.tour_image || reservation.car_rental_image || reservation.activity_image || reservation.visa_image,
					}
				}),
			})
		} catch (error) {
			return res.status(500).send({
				success: false,
				message: "Error retrieving reservations",
				data: error,
			})
		}
	}

	async show(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as any
			const reservationModel = new ReservationModel()
			const visaReservationModel = new VisaReservationModel()
			const tourReservationModel = new TourReservationModel()
			const activityReservationModel = new ActivityReservationModel()
			const carRentalReservationModel = new CarRentalReservationModel()
			// Try to find the reservation in hotel reservations first
			let reservation = await reservationModel.getUserReservationById(id, (req as any).language)

			// If not found in hotel reservations, try visa reservations
			if (!reservation) {
				reservation = await visaReservationModel.getUserReservationById(id, (req as any).language)
			}

			// If not found in visa reservations, try tour reservations
			if (!reservation) {
				reservation = await tourReservationModel.getUserReservationById(id, (req as any).language)
			}

			// If not found in tour reservations, try activity reservations
			if (!reservation) {
				reservation = await activityReservationModel.getUserReservationById(id, (req as any).language)
			}

			// If not found in activity reservations, try car rental reservations
			if (!reservation) {
				reservation = await carRentalReservationModel.getUserReservationById(id, (req as any).language)
			}

			if (!reservation) {
				return res.status(404).send({
					success: false,
					message: "Reservation not found",
					data: null,
				})
			}

			return res.status(200).send({
				success: true,
				message: "Reservation retrieved successfully",
				data: reservation,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: "Error retrieving reservation",
				data: error,
			})
		}
	}

	mobileShow = async (req: FastifyRequest, res: FastifyReply) => {
		try {
			const { id } = req.params as any

			// Modelleri dene ve ortak formata çevir
			let reservation = await this.tryGetHotelReservation(id, (req as any).language)
			if (!reservation) {
				reservation = await this.tryGetVisaReservation(id, (req as any).language)
			}
			if (!reservation) {
				reservation = await this.tryGetTourReservation(id, (req as any).language)
			}
			if (!reservation) {
				reservation = await this.tryGetActivityReservation(id, (req as any).language)
			}
			if (!reservation) {
				reservation = await this.tryGetCarRentalReservation(id, (req as any).language)
			}

			if (!reservation) {
				return res.status(404).send({
					success: false,
					message: "Reservation not found",
					data: null,
				})
			}

			// Ortak formata çevir
			const unifiedReservation = this.unifyReservationData(reservation)

			return res.status(200).send({
				success: true,
				message: "Reservation retrieved successfully",
				data: unifiedReservation,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: "Error retrieving reservation",
				data: error,
			})
		}
	}

	private async tryGetHotelReservation(id: string, language: string) {
		try {
			const reservationModel = new ReservationModel()
			const reservation = await reservationModel.getUserReservationById(id, language)
			return reservation ? { ...reservation, _type: "hotel" } : null
		} catch (error) {
			return null
		}
	}

	private async tryGetVisaReservation(id: string, language: string) {
		try {
			const visaReservationModel = new VisaReservationModel()
			const reservation = await visaReservationModel.getUserReservationById(id, language)
			return reservation ? { ...reservation, _type: "visa" } : null
		} catch (error) {
			return null
		}
	}

	private async tryGetTourReservation(id: string, language: string) {
		try {
			const tourReservationModel = new TourReservationModel()
			const reservation = await tourReservationModel.getUserReservationById(id, language)
			return reservation ? { ...reservation, _type: "tour" } : null
		} catch (error) {
			return null
		}
	}

	private async tryGetActivityReservation(id: string, language: string) {
		try {
			const activityReservationModel = new ActivityReservationModel()
			const reservation = await activityReservationModel.getUserReservationById(id, language)
			return reservation ? { ...reservation, _type: "activity" } : null
		} catch (error) {
			return null
		}
	}

	private async tryGetCarRentalReservation(id: string, language: string) {
		try {
			const carRentalReservationModel = new CarRentalReservationModel()
			const reservation = await carRentalReservationModel.getUserReservationById(id, language)
			return reservation ? { ...reservation, _type: "car_rental" } : null
		} catch (error) {
			return null
		}
	}

	private unifyReservationData(reservation: any): UnifiedReservationResponse {
		// Rezervasyon tipini belirle
		const reservationType = reservation._type || this.determineReservationType(reservation)

		return {
			// Temel bilgiler
			id: reservation.id,
			created_by: reservation.created_by,
			sales_partner_id: reservation.sales_partner_id,
			progress_id: reservation.progress_id,
			price: reservation.price,
			currency_code: reservation.currency_code,
			payment_id: reservation.payment_id,
			different_invoice: reservation.different_invoice,
			status: reservation.status,
			created_at: reservation.created_at,
			updated_at: reservation.updated_at,
			deleted_at: reservation.deleted_at,

			// Tip
			reservation_type: reservationType,

			// Lokasyon
			location: {
				city: reservation.hotel_city || reservation.visa_city || reservation.tour_city || reservation.activity_city || reservation.car_rental_city,
				country: reservation.hotel_country || reservation.visa_country || reservation.tour_country || reservation.activity_country || reservation.car_rental_country,
			},

			// Servis
			service: {
				id: reservation.hotel_id || reservation.visa_id || reservation.tour_id || reservation.activity_id || reservation.car_rental_id,
				name: reservation.hotel_name || reservation.visa_title || reservation.tour_title || reservation.activity_title || reservation.car_rental_title,
				image: reservation.hotel_image || reservation.visa_image || reservation.tour_image || reservation.activity_image || reservation.car_rental_image,
			},

			// Paket
			package: {
				id: reservation.package_id,
				name: reservation.package_name || reservation.room_name,
				description: reservation.package_description,
				refund_policy: reservation.package_refund_policy,
				room_id: reservation.room_id,
				room_name: reservation.room_name,
				hotel_refund_days: reservation.hotel_refund_days,
				room_refund_days: reservation.room_refund_days,
				package_date: reservation.package_date,
				package_discount: reservation.package_discount,
				package_return_acceptance_period: reservation.package_return_acceptance_period,
				package_constant_price: reservation.package_constant_price,
				activity_hour: reservation.activity_hour,
			},

			// Tarihler
			dates: {
				start_date: reservation.start_date,
				end_date: reservation.end_date,
				check_in_date: reservation.check_in_date,
				date: reservation.date,
				period: reservation.period,
			},

			// Misafirler
			guests: reservation.guests || [],

			// Fatura
			invoice: reservation.invoice,

			// Özel istekler
			special_requests: reservation.special_requests || [],

			// Yorum
			comment: reservation.comment,

			// Tour-specific
			tour_locations: reservation.tour_locations,
			tour_details: {
				day_count: reservation.day_count,
				night_count: reservation.night_count,
				refund_days: reservation.refund_days,
				user_count: reservation.user_count,
				average_rating: reservation.average_rating,
				comment_count: reservation.comment_count,
			},
		}
	}

	private determineReservationType(reservation: any): "hotel" | "visa" | "tour" | "activity" | "car_rental" {
		if (reservation.hotel_id) return "hotel"
		if (reservation.visa_id) return "visa"
		if (reservation.tour_id) return "tour"
		if (reservation.activity_id) return "activity"
		if (reservation.car_rental_id) return "car_rental"
		throw new Error("Unable to determine reservation type")
	}
}

export interface UnifiedReservationResponse {
	// Temel rezervasyon bilgileri
	id: string
	created_by: string
	sales_partner_id: string | null
	progress_id: string
	price: number
	currency_code: string
	payment_id: string
	different_invoice: boolean
	status: boolean
	created_at: string
	updated_at: string
	deleted_at: string | null

	// Rezervasyon tipi
	reservation_type: "hotel" | "visa" | "tour" | "activity" | "car_rental"

	// Lokasyon bilgileri
	location: {
		city: string
		country: string
	}

	// Servis bilgileri
	service: {
		id: string
		name: string
		image: string | null
	}

	// Paket bilgileri
	package: {
		id: string
		name?: string
		description?: string
		refund_policy?: string
		// Tip-specific alanlar
		room_id?: string
		room_name?: string
		hotel_refund_days?: number
		room_refund_days?: number
		package_date?: string
		package_discount?: number
		package_return_acceptance_period?: number
		package_constant_price?: boolean
		activity_hour?: string
	}

	// Tarih bilgileri
	dates: {
		start_date?: string
		end_date?: string
		check_in_date?: string | null
		date?: string // visa için
		period?: string // tour için
	}

	// Misafir bilgileri
	guests: Array<{
		id: string
		name: string
		surname: string
		email: string
		phone: string
		type: string
		age: string
		birthday?: string | null
	}>

	// Fatura bilgileri
	invoice?: {
		id: string
		title: string
		address: string
		official: string
		tax_number: string
		tax_office: string
		created_at: string
		updated_at: string
		deleted_at: string | null
		payment_id: string
		[key: string]: any // reservation_type'a göre değişen alanlar
	}

	// Özel istekler
	special_requests?: string[]

	// Yorum
	comment?: any

	// Tour-specific alanlar
	tour_locations?: Array<{
		id: string
		location_id: string
		city_name: string
		country_name: string
		country_id: string
	}>

	// Tour-specific alanlar
	tour_details?: {
		day_count?: number
		night_count?: number
		refund_days?: number
		user_count?: number
		average_rating?: number
		comment_count?: number
	}
}
