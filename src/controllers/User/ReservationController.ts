import { FastifyRequest, FastifyReply } from "fastify";
import ReservationModel from "@/models/HotelReservationModel";
import VisaReservationModel from "@/models/VisaReservationModel";
import TourReservationModel from "@/models/TourReservationModel";
import ActivityReservationModel from "@/models/ActivityReservationModel";
import CarRentalReservationModel from "@/models/CarRentalReservationModel";

export default class ReservationController {
  async index(req: FastifyRequest, res: FastifyReply) {
    try {
      const reservationModel = new ReservationModel();
      const visaReservationModel = new VisaReservationModel();
      const tourReservationModel = new TourReservationModel();
      const activityReservationModel = new ActivityReservationModel();
      const carRentalReservationModel = new CarRentalReservationModel();
      let reservations: any[] = [];

      const hotelReservations = await reservationModel.getUserReservation(
        req.user?.id as string,
        (req as any).language
      );

      const visaReservations = await visaReservationModel.getUserReservation(
        req.user?.id as string,
        (req as any).language
      );

      const tourReservations = await tourReservationModel.getUserReservation(
        req.user?.id as string,
        (req as any).language
      );

      const activityReservations =
        await activityReservationModel.getUserReservation(
          req.user?.id as string,
          (req as any).language
        );

      const carRentalReservations =
        await carRentalReservationModel.getUserReservation(
          req.user?.id as string,
          (req as any).language
        );

      // birleştir ve sırala ama bi tip ekle yani hotel mi visa mi tour mu activity mi
      reservations = [
        ...hotelReservations,
        ...visaReservations,
        ...tourReservations,
        ...activityReservations,
        ...carRentalReservations,
      ].map((reservation) => ({
        ...reservation,
        type: reservation.hotel_id
          ? "hotel"
          : reservation.visa_id
          ? "visa"
          : reservation.tour_id
          ? "tour"
          : reservation.activity_id
          ? "activity"
          : reservation.car_rental_id
          ? "car_rental"
          : "other",
      }));

      reservations = reservations.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return res.status(200).send({
        success: true,
        message: "Reservations retrieved successfully",
        data: reservations,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Error retrieving reservations",
        data: error,
      });
    }
  }
  async mobile(req: FastifyRequest, res: FastifyReply) {
    try {
      const reservationModel = new ReservationModel();
      const visaReservationModel = new VisaReservationModel();
      const tourReservationModel = new TourReservationModel();
      const activityReservationModel = new ActivityReservationModel();
      const carRentalReservationModel = new CarRentalReservationModel();
      let reservations: any[] = [];
      const id = req.user?.id as string;

      const hotelReservations = await reservationModel.getUserReservation(
        id as string,
        (req as any).language
      );

      const visaReservations = await visaReservationModel.getUserReservation(
        id as string,
        (req as any).language
      );

      const tourReservations = await tourReservationModel.getUserReservation(
        id as string,
        (req as any).language
      );

      const activityReservations =
        await activityReservationModel.getUserReservation(
          id as string,
          (req as any).language
        );

      const carRentalReservations =
        await carRentalReservationModel.getUserReservation(
          id as string,
          (req as any).language
        );

      // birleştir ve sırala ama bi tip ekle yani hotel mi visa mi tour mu activity mi
      reservations = [
        ...hotelReservations,
        ...visaReservations,
        ...tourReservations,
        ...activityReservations,
        ...carRentalReservations,
      ].map((reservation) => ({
        ...reservation,
        type: reservation.hotel_id
          ? "hotel"
          : reservation.visa_id
          ? "visa"
          : reservation.tour_id
          ? "tour"
          : reservation.activity_id
          ? "activity"
          : reservation.car_rental_id
          ? "car_rental"
          : "other",
      }));

      reservations = reservations.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return res.status(200).send({
        success: true,
        message: "Reservations retrieved successfully",
        data: reservations.map((reservation) => {
          return {
            id: reservation.id,
            module_id:
              reservation.hotel_id ||
              reservation.tour_id ||
              reservation.car_rental_id ||
              reservation.activity_id,
            progress_id: reservation.progress_id,
            county:
              reservation.hotel_country ||
              reservation.tour_country ||
              reservation.car_rental_country ||
              reservation.activity_country,
            city:
              reservation.hotel_city ||
              reservation.tour_city ||
              reservation.car_rental_city ||
              reservation.activity_city,
            comment: reservation.comment,
            title:
              reservation.hotel_name ||
              reservation.tour_name ||
              reservation.car_rental_name ||
              reservation.activity_name,
            adult: reservation.guests.filter(
              (guest: any) => guest.type === "adult"
            ).length,
            child: reservation.guests.filter(
              (guest: any) => guest.type === "child"
            ).length,
            baby: reservation.guests.filter(
              (guest: any) => guest.type === "baby"
            ).length,
            type: reservation.hotel_id
              ? "hotel"
              : reservation.tour_id
              ? "tour"
              : reservation.car_rental_id
              ? "car_rental"
              : reservation.activity_id
              ? "activity"
              : "other",
            start_date:
              reservation.start_date ||
              reservation.package_date ||
              reservation.car_rental_start_date ||
              reservation.activity_start_date||null,
            end_date:
              reservation.end_date ||
              reservation.car_rental_end_date ||
              reservation.activity_end_date||null,
            image:
              reservation.hotel_image ||
              reservation.tour_image ||
              reservation.car_rental_image ||
              reservation.activity_image,
          };
        }),
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Error retrieving reservations",
        data: error,
      });
    }
  }

  async show(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as any;
      const reservationModel = new ReservationModel();
      const visaReservationModel = new VisaReservationModel();
      const tourReservationModel = new TourReservationModel();
      const activityReservationModel = new ActivityReservationModel();
      const carRentalReservationModel = new CarRentalReservationModel();
      // Try to find the reservation in hotel reservations first
      let reservation = await reservationModel.getUserReservationById(
        id,
        (req as any).language
      );

      // If not found in hotel reservations, try visa reservations
      if (!reservation) {
        reservation = await visaReservationModel.getUserReservationById(
          id,
          (req as any).language
        );
      }

      // If not found in visa reservations, try tour reservations
      if (!reservation) {
        reservation = await tourReservationModel.getUserReservationById(
          id,
          (req as any).language
        );
      }

      // If not found in tour reservations, try activity reservations
      if (!reservation) {
        reservation = await activityReservationModel.getUserReservationById(
          id,
          (req as any).language
        );
      }

      // If not found in activity reservations, try car rental reservations
      if (!reservation) {
        reservation = await carRentalReservationModel.getUserReservationById(
          id,
          (req as any).language
        );
      }

      if (!reservation) {
        return res.status(404).send({
          success: false,
          message: "Reservation not found",
          data: null,
        });
      }

      return res.status(200).send({
        success: true,
        message: "Reservation retrieved successfully",
        data: reservation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Error retrieving reservation",
        data: error,
      });
    }
  }
}
