import "fastify";

declare module "fastify" {
    interface FastifyRequest {
        user: {
            id: number;
            email: string;
        } | null;
    }

    interface FastifyInstance {
        verifyAuth(req: FastifyRequest, reply: any): Promise<void>;
    }
}
