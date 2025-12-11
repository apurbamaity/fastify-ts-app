import { FastifyInstance } from "fastify";

export async function userRoutes(app: FastifyInstance) {
    app.get("/users", async () => {
        return [{ id: 1, name: "Apurba" }];
    });
}
