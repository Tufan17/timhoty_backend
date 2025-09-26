import { FastifyRequest, FastifyReply } from "fastify";
import ReservationModel from "@/models/HotelReservationModel";

export default class TourController {
  async index(req: FastifyRequest, res: FastifyReply) {
   try{
    const reservationModel = new ReservationModel();
    const reservations = await reservationModel.getUserReservation(
      req.user?.id as string,
      (req as any).language
    );
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

  async show(req: FastifyRequest, res: FastifyReply) {}
}
