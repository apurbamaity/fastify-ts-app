import fastifyKafkajs from "fastify-kafkajs";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { getDrive } from "../libs/drive.js"; // adjust path
const TMP_DIR = path.join(process.cwd(), "tmp_images");


async function downloadFromDrive(driveFileId: string, targetPath: string, app: FastifyInstance) {
	const drive = app.drive;
	if (!drive) {
		console.log(`\x1b[41m Drive client is not initialized on app \x1b[0m`);
		throw new Error("Drive client missing");
	}

	await fsp.mkdir(path.dirname(targetPath), { recursive: true });
	const dest = fs.createWriteStream(targetPath);

	await new Promise<void>((resolve, reject) => {
		drive.files.get(
			{ fileId: driveFileId, alt: "media" },
			{ responseType: "stream" },
			(err, res) => {
				if (err || !res) return reject(err);
				res.data
					.on("end", () => resolve())
					.on("error", reject)
					.pipe(dest);
			}
		);
	});
}


const kafkaPlugin = async (app: FastifyInstance) => {
	try {
		await app.register(fastifyKafkajs, {
			clientConfig: {
				brokers: ["localhost:9092"],
				clientId: "fastify-app",
			},
			producerConfig: {},
			consumers: [
				{
					consumerConfig: {
						groupId: "image-upload-consumer-group",
					},
					subscription: {
						topics: ["image-upload-topic"],
						fromBeginning: true,
					},
					runConfig: {
						eachMessage: async ({ topic, partition, message }) => {
							const raw = message.value?.toString();
							console.log(raw);
							if (!raw) return;

							try {
								const payload = JSON.parse(raw);

								// 1) build image document
								const doc = {
									userId: payload.userId,
									fileName: payload.storedName,
									originalName: payload.originalName,
									mimeType: payload.mimeType,
									sizeBytes: payload.sizeBytes,
									url: payload.driveLink,
									storage: payload.storage ?? {
										provider: "gdrive",
										driveFileId: payload.driveId,
										folder: "fastify_uploads",
									},
									metadata: payload.metadata ?? null,
									tags: payload.tags ?? [],
									createdAt: payload.uploadedAt,
									updatedAt: new Date(),
									status: payload.status ?? "processed",
								};

								const result = await app.mongo.db
									.collection("images_data")
									.insertOne(doc);

								console.log(`\x1b[44m ${JSON.stringify(doc)} \x1b[0m`);
								console.log(`\x1b[46m ${process.cwd()} \x1b[0m`);



								// 2) download image from Drive to local tmp path
								const localPath = path.join(
									TMP_DIR,
									`${result.insertedId}_${doc.fileName}`
								);

								await downloadFromDrive(payload.driveId, localPath, app);

								app.log.info(
									{ localPath },
									"Image downloaded from Drive to local temp path"
								);

								// later you’ll call the LLM here with localPath
							} catch (err) {
								app.log.error(
									{ err, raw },
									"Failed to process image-upload message"
								);
							}
						},
					},
				},
			],
		});

		const admin = app.kafka.client.admin();
		await admin.connect();
		await admin.createTopics({
			topics: [
				{
					topic: "image-upload-topic",
					numPartitions: 1,
					replicationFactor: 1,
				},
			],
			waitForLeaders: true,
		});
		await admin.disconnect();

		app.log.info('Kafka topic "image-upload-topic" ready');
	} catch (error) {
		app.log.error("Failed to initialize Kafka plugin:", error);
		throw error;
	}
};

export default fp(kafkaPlugin);
