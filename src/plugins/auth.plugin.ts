import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function authPlugin(app: FastifyInstance) {
    // 🔹 1. Declare request decorator
    app.decorateRequest("user", null);

    // 🔹 2. Declare auth function
    app.decorate(
        "verifyAuth",
        async (req: FastifyRequest, reply: FastifyReply) => {
            const authHeader = req.headers['authorization'];
            console.log("here it comes");

            if (!authHeader) {
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Missing Authorization header",
                });
            }

            // 🔐 fake verification (later JWT)
            req.user = {
                id: 1,
                email: "test@example.com",
            };
        }
    );
}

export default fp(authPlugin);
