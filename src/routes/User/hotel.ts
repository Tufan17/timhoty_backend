import { FastifyInstance } from 'fastify'
import HotelController from '@/controllers/User/HotelController'

export default async function hotelRoutes(fastify: FastifyInstance) {
    const hotelController = new HotelController()
    fastify.get('/', {
        handler: hotelController.index,
    })

    fastify.get('/:id', {
        handler: hotelController.show,
    })

    
}
