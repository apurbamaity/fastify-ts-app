import Fastify from "fastify";
import { userRoutes } from "./routes/user.route.ts";
import { authMiddleware } from "./middleware/auth.ts";

const app = Fastify({
    logger: true,
});

// Route example no middleware
// app.register(userRoutes);

// Register auth plugin, and *nest* routes inside it so the hook applies
app.register(async (instance) => {
    await authMiddleware(instance); // adds hook to this plugin scope
    instance.register(userRoutes); // routes are children of the plugin -> hook applies
});

// Start server
const start = async () => {
    try {
        await app.listen({ port: 3000 });
        console.log("Server running at http://localhost:3000");
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
