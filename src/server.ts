import Fastify from "fastify";
import { userRoutes } from "./routes/user.route.ts";
import { authMiddleware } from "./middleware/auth.ts";
import authPlugin from "./plugins/auth.plugin.ts";

const app = Fastify({
    logger: true,
});

// method 1 to add routes Route example no middleware

app.register(async (instance) => {
    await instance.register(authPlugin);

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

    instance.register(userRoutes, { prefix: "/api/v1" });
});
// ---------------------------------------------------------

// Register auth plugin, and *nest* routes inside it so the hook applies
// app.register(async (instance) => {
//     await authMiddleware(instance); // adds hook to this plugin scope
//     instance.register(userRoutes, { prefix: "/api/v1/" }); // routes are children of the plugin -> hook applies
// });
//---------------------------------------------------------------

// Start server
const start = async () => {
    try {
        await app.listen({ port: 3001 });
        console.log("Server running at http://localhost:3000");
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
