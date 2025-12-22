import type { FastifyRequest, FastifyInstance, FastifyReply } from "fastify";



interface LoginBody {
    username: string;
    password: string;
}
export async function userRoutes(app: FastifyInstance) {
    app.get("/users", async () => {
        return [{ id: 1, name: "Apurba" }];
    });

    app.post<{ Body: LoginBody }>(
        "/login",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["username", "password"],
                    properties: {
                        username: { type: "string" },
                        password: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const { username, password } = request.body;
            return { recieved_username: username, password: password };
        }
    );

    app.get<{
        Params: { id: number; name: string };
    }>(
        "/user/:id/:name",

        {
            preHandler: app.verifyAuth, // ✅ correct usage
            schema: {
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: { type: "number" },
                        name: { type: "string", minLength: 0 },
                    },
                },
            },
        },
        async (req, reply) => {
            const { id, name } = req.params;
            console.log("user logged in==>", req.user)
            return { id, name };
        }
    );

    app.get("/profile", async (req) => {
        return {
            message: "User profile",
            user: req.user, // ✅ fully typed
        };
    });


}
