import { FastifyInstance } from 'fastify';
import ForceUpdateController from '../../controllers/User/ForceUpdateController';

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new ForceUpdateController()
    fastify.post('/', { handler: controller.checkForceUpdate });
}
