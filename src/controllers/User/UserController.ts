import UserModel from "@/models/UserModel";
import { FastifyRequest, FastifyReply } from "fastify";

class UserController {
    async read(req: FastifyRequest, res: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const user = await new UserModel().findId(id);
            if(!user){
                return {
                    success: false,
                    message: "Kullanıcı bulunamadı"
                };
            }
            return {
                success: true,
                message: "Kullanıcı başarıyla okundu", 
                data: user,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}



export default UserController;