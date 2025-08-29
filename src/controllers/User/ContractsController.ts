import { FastifyReply, FastifyRequest } from "fastify";

export default class UserController {
    async termsOfService(req: FastifyRequest, res: FastifyReply) {
        try {
            const htmlContent = `
                <html>
                    <head>
                        <title>Kullanıcı Sözleşmesi</title>
                    </head>
                    <body>
                        <h1>Kullanıcı Sözleşmesi</h1>
                        <p>Welcome to our service. By using our service, you agree to the following terms and conditions...</p>
                        <!-- Add more HTML content as needed -->
                    </body>
                </html>
            `;
            return res.status(200).send({
                success: true,
                message: "User agreement generated successfully",
                data: htmlContent
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                message: "Error generating user agreement"
            });
        }
    }

 

async kvkk(req: FastifyRequest, res: FastifyReply) {
    try {
        const htmlContent = `
            <html>
                <head>
                    <title>Kişisel Verilerin Korunması</title>
                </head>
                <body>
                    <h1>Kişisel Verilerin Korunmas</h1>
                    <p>Welcome to our service. By using our service, you agree to the following terms and conditions...</p>
                    <!-- Add more HTML content as needed -->
                </body>
            </html>
        `;
        return res.status(200).send({
            success: true,
            message: "Privacy policy generated successfully",
            data: htmlContent
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error generating privacy policy"
        });
    }

}
async privacyPolicy(req: FastifyRequest, res: FastifyReply) {
    try {
        const htmlContent = `
            <html>
                <head>
                    <title>Gizlilik Politikası</title>
                </head>
                <body>
                    <h1>Gizlilik Politikası</h1>
                    <p>Welcome to our service. By using our service, you agree to the following terms and conditions...</p>
                    <!-- Add more HTML content as needed -->
                </body>
            </html>
        `;
        return res.status(200).send({
            success: true,
            message: "Privacy policy generated successfully",
            data: htmlContent
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error generating privacy policy"
        });
    }

}
}