import { FastifyInstance } from 'fastify';
import JobController from '../../controllers/Admin/JobController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { jobSchema, jobUpdateSchema } from '../../validators/Admin/job';
import { validate } from '../../middlewares/validate';

export default async function jobRoutes(fastify: FastifyInstance) {
    const controller = new JobController()
    fastify.get('/list', {handler: controller.getJobList});
    fastify.get('/', controller.findAll);
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne });
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(jobSchema)], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(jobUpdateSchema)], handler: controller.update });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

