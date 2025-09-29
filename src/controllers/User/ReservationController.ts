import { FastifyRequest, FastifyReply } from "fastify";
import ReservationModel from "@/models/HotelReservationModel";
import VisaReservationModel from "@/models/VisaReservationModel";

export default class ReservationController {
  async index(req: FastifyRequest, res: FastifyReply) {
   try{
    const reservationModel = new ReservationModel();
    const visaReservationModel = new VisaReservationModel();


    let reservations:any[]=[];


    const hotelReservations = await reservationModel.getUserReservation(
      req.user?.id as string,
      (req as any).language
    );

    const visaReservations = await visaReservationModel.getUserReservation(
      req.user?.id as string,
      (req as any).language
    );


// birleştir ve sırala ama bi tip ekle yani hotel mi visa mi
    reservations = [...hotelReservations, ...visaReservations].map((reservation) => ({
      ...reservation,
      type: reservation.hotel_id  ? "hotel" : "visa",
    }));

    reservations = reservations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.status(200).send({
      success: true,
      message: "Reservations retrieved successfully",
      data: reservations,
    });
   }catch(error){
    return res.status(500).send({
      success: false,
      message: "Error retrieving reservations",
      data: error,
    });
   }
  }

  async show(req: FastifyRequest, res: FastifyReply) {
    try{
      const { id } = req.params as any
      const reservationModel = new ReservationModel();
      const visaReservationModel = new VisaReservationModel();

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
    }catch(error){
      return res.status(500).send({
        success: false,
        message: "Error retrieving reservation",
        data: error,
      });
    } 
  }
}
