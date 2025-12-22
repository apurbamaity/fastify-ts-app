import multipart from "@fastify/multipart";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const multipartPlugin = async (app: FastifyInstance)  =>{
    app.register(multipart, {
		attachFieldsToBody: false,
        limits: {
            fileSize: 100 * 1024 * 1024,
            files: 100,
        },
    });
};

export default fp(multipartPlugin);