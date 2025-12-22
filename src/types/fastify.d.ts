import "fastify";
import type { FastifyKafka } from "fastify-kafkajs";
import { google, drive_v3 } from "googleapis";


declare module "fastify" {
    interface FastifyRequest {
        user: {
            id: number;
            email: string;
        } | null;
        
    }
    interface FastifyInstance {
        kafka: FastifyKafka;
        verifyAuth(req: FastifyRequest, reply: any): Promise<void>;
        mongo: {
            client: MongoClient;
            db: Db;
        };
        drive: drive_v3.Drive;
    }
}
