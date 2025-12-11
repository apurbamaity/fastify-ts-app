import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(app: FastifyInstance) {
    app.addHook(
        "onRequest",
        async (req: FastifyRequest, reply: FastifyReply) => {
            const token = req.headers["authorization"];

            console.log("token prints here middleware is working ====>", token);

            if (!token) {
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Missing Authorization header",
                });
            }
        }
    );
}
