import { FastifyInstance } from 'fastify';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware';
import OfferController from '@/controllers/Admin/OfferController';


export default async function offerRoutes(fastify: FastifyInstance) {
    const controller = new OfferController();
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.dataTable });
}