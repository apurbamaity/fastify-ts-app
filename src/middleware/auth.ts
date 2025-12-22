// import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// export async function authMiddleware(app: FastifyInstance) {
//     app.addHook(
//         "onRequest",
//         async (req: FastifyRequest, reply: FastifyReply) => {
//             const token = req.headers["authorization"];

//             console.log("token prints here middleware is working ====>", token);

//             if (!token) {
//                 return reply.status(401).send({
//                     error: "Unauthorized",
//                     message: "Missing Authorization header",
//                 });
//             }
//         }
//     );
// }

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function authMiddleware(app: FastifyInstance) {
    // 1️⃣ Declare decorator (startup-time)
    app.decorateRequest("user", null);

    // 2️⃣ Add hook (request-time)
    app.addHook(
        "preHandler",
        async (req: FastifyRequest, reply: FastifyReply) => {
            const token = req.headers.authorization;

            if (!token) {
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Missing Authorization header",
                }); 
            }

            // 🔥 fake verification (replace with JWT later)
            req.user = {
                id: 1,
                email: "test@example.com",
            };
        }
    );
}
