import Fastify from 'fastify';
import { ImageUploadRoutes} from './routes/imageupload.route.js';
import { initializeDrive, getDrive,setupOAuthCallback } from './libs/drive.js';

import { userRoutes } from "./routes/user.route.js";
import { authMiddleware } from "./middleware/auth.js";
import authPlugin from "./plugins/auth.plugin.js";
import multipartPlugin from "./plugins/multipart.plugin.js";
import wsPlugin from './plugins/ws.plugin.js';
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import kafkaPlugin from './plugins/kafka.plugin.js'; // <-- Add this
import mongoPlugin from './plugins/mongo.plugin.js'; // <-- Add this
import drivePlugin from "./plugins/drive.plugin.js";



const app = Fastify({ logger: true , pluginTimeout: 60000 });

// ✅ Enable CORS
await app.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
});


// Initialize Drive FIRST
// await initializeDrive();

// Register OAuth callback at ROOT level
await setupOAuthCallback(app);

// Register Kafka plugin BEFORE other routes
await app.register(drivePlugin);
await app.register(kafkaPlugin);
await app.register(mongoPlugin);
await app.register(authPlugin);
await app.register(multipartPlugin);
await app.register(wsPlugin);




app.register(async (instance) => {
    instance.get(
        "/profile",
        { preHandler: instance.verifyAuth },
        async (req) => {
            return {
                message: "Authorized",
                user: req.user,
            };
        }
    );

    instance.get('/testmongo', async (req, reply) => {
        const doc = await instance.mongo.db
            .collection('users')
            .find({})
            .toArray();
        return { ok: true, doc };
    });

    instance.register(userRoutes, { prefix: "/api/v1" });
    instance.register(ImageUploadRoutes, { prefix: '/api/v1' });
});

// Start server
const start = async () => {
    try {
        await app.listen({ port: 8081, host: '0.0.0.0' });
        console.log('Server listening on port 8080');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
