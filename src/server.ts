import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import app from "./app";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import "./crone/index";

const PORT = process.env.PORT || 3005;
const HOST = process.env.HOST || "0.0.0.0";
import path from "path";
import staticPlugin from "@fastify/static";
import { languageMiddleware } from "./middlewares/languageMiddleware";

const server = Fastify({ logger: false });

const start = async () => {
  try {
    await server.register(cors, {
      origin: [
        "http://167.71.3.100",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://partner.timhoty.com",
        "https://www.timhoty.com",
        "https://admin.timhoty.com",
        "https://site.timhoty.com"
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
    });

    await server.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
      },
    });

    // Register static plugin for sendFile functionality
    await server.register(staticPlugin, {
      root: path.join(__dirname, "../uploads"),
      prefix: "/static/", // Farklı bir prefix kullanıyoruz
    });

    // Custom static file handler with fallback
    server.register(async function (fastify) {
      fastify.get<{ Params: { "*": string } }>(
        "/uploads/*",
        async (request, reply) => {
          const requestedFile = request.params["*"];
          const filePath = path.join(__dirname, "../uploads", requestedFile);
          const defaultFilePath = path.join(
            __dirname,
            "../uploads/no-file.png"
          );

          try {
            // İstenen dosya var mı kontrol et
            await require("fs").promises.access(filePath);
            // Dosya varsa onu döndür
            return reply.sendFile(
              requestedFile,
              path.join(__dirname, "../uploads")
            );
          } catch (error) {
            // Dosya yoksa default dosyayı döndür
            try {
              await require("fs").promises.access(defaultFilePath);
              return reply.sendFile(
                "no-file.png",
                path.join(__dirname, "../uploads")
              );
            } catch (defaultError) {
              return reply.code(404).send({ error: "File not found" });
            }
          }
        }
      );
    });

    await server.register(app);

    server.addHook("preHandler", languageMiddleware);

    await server.listen({ port: Number(PORT), host: HOST });

    console.log(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
