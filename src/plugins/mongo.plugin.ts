// plugins/mongo.plugin.ts
import fp from 'fastify-plugin';
import { MongoClient, Db } from 'mongodb';
import type { FastifyInstance } from 'fastify';

const mongoPlugin = async (app: FastifyInstance) => {
	const uri = 'mongodb://localhost:27017'; // from Docker
	const dbName = 'fastify_app';           // the DB you created

	const client = new MongoClient(uri);
	await client.connect();

	const db = client.db(dbName);

	app.decorate('mongo', { client, db });

	app.addHook('onClose', async () => {
		await client.close();
	});

	app.log.info('MongoDB connected');
};

export default fp(mongoPlugin);
