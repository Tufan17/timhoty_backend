import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { tapPaymentsService } from "@/services/Payment";

interface WebhookPayload {
  id: string;
  object: string;
  type: string;
  created: number;
  data: {
    object: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      customer: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
      metadata?: Record<string, any>;
    };
  };
}

class WebhookController {
  /**
   * Handle Tap Payments webhooks
   */
  async handleWebhook(req: FastifyRequest<{ Body: WebhookPayload }>, res: FastifyReply) {
    try {
      const payload = req.body;
      const signature = req.headers['x-tap-signature'] as string;

      // Verify webhook signature (implement based on Tap Payments documentation)
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        return res.status(401).send({
          success: false,
          message: "Invalid webhook signature"
        });
      }

      const { type, data } = payload;
      const charge = data.object;

      console.log(`Received webhook: ${type} for charge ${charge.id}`);

      // Handle different webhook types
      switch (type) {
        case 'charge.created':
          await this.handleChargeCreated(charge);
          break;
        
        case 'charge.captured':
          await this.handleChargeCaptured(charge);
          break;
        
        case 'charge.failed':
          await this.handleChargeFailed(charge);
          break;
        
        case 'refund.created':
          await this.handleRefundCreated(charge);
          break;
        
        case 'refund.updated':
          await this.handleRefundUpdated(charge);
          break;
        
        default:
          console.log(`Unhandled webhook type: ${type}`);
      }

      return res.status(200).send({
        success: true,
        message: "Webhook processed successfully"
      });

    } catch (error: any) {
      console.error('Webhook Error:', error);
      return res.status(500).send({
        success: false,
        message: "Webhook processing failed",
        error: error.message
      });
    }
  }

  /**
   * Handle charge created webhook
   */
  private async handleChargeCreated(charge: any) {
    console.log(`Charge created: ${charge.id} - Status: ${charge.status}`);
    
    // Update your database with the new charge
    // You can use the metadata to identify the booking type and ID
    const metadata = charge.metadata || {};
    const paymentType = metadata.payment_type;
    
    switch (paymentType) {
      case 'hotel_booking':
        await this.updateHotelBookingStatus(metadata.hotel_id, metadata.booking_id, 'payment_created');
        break;
      case 'tour_booking':
        await this.updateTourBookingStatus(metadata.tour_id, metadata.booking_id, 'payment_created');
        break;
      case 'car_rental_booking':
        await this.updateCarRentalBookingStatus(metadata.car_rental_id, metadata.booking_id, 'payment_created');
        break;
      case 'visa_application':
        await this.updateVisaApplicationStatus(metadata.visa_id, metadata.application_id, 'payment_created');
        break;
    }
  }

  /**
   * Handle charge captured webhook
   */
  private async handleChargeCaptured(charge: any) {
    console.log(`Charge captured: ${charge.id} - Status: ${charge.status}`);
    
    const metadata = charge.metadata || {};
    const paymentType = metadata.payment_type;
    
    switch (paymentType) {
      case 'hotel_booking':
        await this.updateHotelBookingStatus(metadata.hotel_id, metadata.booking_id, 'payment_completed');
        break;
      case 'tour_booking':
        await this.updateTourBookingStatus(metadata.tour_id, metadata.booking_id, 'payment_completed');
        break;
      case 'car_rental_booking':
        await this.updateCarRentalBookingStatus(metadata.car_rental_id, metadata.booking_id, 'payment_completed');
        break;
      case 'visa_application':
        await this.updateVisaApplicationStatus(metadata.visa_id, metadata.application_id, 'payment_completed');
        break;
    }
  }

  /**
   * Handle charge failed webhook
   */
  private async handleChargeFailed(charge: any) {
    console.log(`Charge failed: ${charge.id} - Status: ${charge.status}`);
    
    const metadata = charge.metadata || {};
    const paymentType = metadata.payment_type;
    
    switch (paymentType) {
      case 'hotel_booking':
        await this.updateHotelBookingStatus(metadata.hotel_id, metadata.booking_id, 'payment_failed');
        break;
      case 'tour_booking':
        await this.updateTourBookingStatus(metadata.tour_id, metadata.booking_id, 'payment_failed');
        break;
      case 'car_rental_booking':
        await this.updateCarRentalBookingStatus(metadata.car_rental_id, metadata.booking_id, 'payment_failed');
        break;
      case 'visa_application':
        await this.updateVisaApplicationStatus(metadata.visa_id, metadata.application_id, 'payment_failed');
        break;
    }
  }

  /**
   * Handle refund created webhook
   */
  private async handleRefundCreated(refund: any) {
    console.log(`Refund created: ${refund.id} - Status: ${refund.status}`);
    
    // Update your database with the refund information
    // Implementation depends on your database structure
  }

  /**
   * Handle refund updated webhook
   */
  private async handleRefundUpdated(refund: any) {
    console.log(`Refund updated: ${refund.id} - Status: ${refund.status}`);
    
    // Update your database with the refund status
    // Implementation depends on your database structure
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature verification based on Tap Payments documentation
    // This is a placeholder - you'll need to implement the actual verification logic
    return tapPaymentsService.verifyWebhookSignature(payload, signature);
  }

  // Database update methods - implement based on your database structure
  private async updateHotelBookingStatus(hotelId: string, bookingId: string, status: string) {
    // Update hotel booking status in your database
    console.log(`Updating hotel booking ${bookingId} status to ${status}`);
  }

  private async updateTourBookingStatus(tourId: string, bookingId: string, status: string) {
    // Update tour booking status in your database
    console.log(`Updating tour booking ${bookingId} status to ${status}`);
  }

  private async updateCarRentalBookingStatus(carRentalId: string, bookingId: string, status: string) {
    // Update car rental booking status in your database
    console.log(`Updating car rental booking ${bookingId} status to ${status}`);
  }

  private async updateVisaApplicationStatus(visaId: string, applicationId: string, status: string) {
    // Update visa application status in your database
    console.log(`Updating visa application ${applicationId} status to ${status}`);
  }
}

export default WebhookController;
