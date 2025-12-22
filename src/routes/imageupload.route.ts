import type { FastifyRequest, FastifyInstance, FastifyReply } from "fastify";
import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { getDrive } from "../libs/drive.js";

const FOLDER_ID = '153KdXWKaaw1F8WEuVMM_tXuLhTAEEEEe';

// Import broadcast function
import { broadcastProgress } from '../plugins/ws.plugin.js';
import { sendProgressToUser } from '../plugins/ws.plugin.js';


async function uploadToGoogleDrive(
	fileBuffer: Buffer,
	filename: string,
	mimetype: string,
	app : FastifyInstance
) {
	const driveClient = app.drive;

	const fileMetadata = {
		name: filename,
		parents: [FOLDER_ID],
	};

	const media = {
		mimeType: mimetype,
		body: Readable.from(fileBuffer),
	};

	const response = await driveClient.files.create({
		requestBody: fileMetadata,
		media,
		fields: "id, name, webViewLink",
	});

	return response.data; // { id, name, webViewLink }
}

export async function ImageUploadRoutes(app: FastifyInstance) {
	const producer = app.kafka.producer; // 👈 no () here
	app.post("/imageupload", async (req: FastifyRequest, reply: FastifyReply) => {

		try {
			// Get session ID from header
			const sessionId = req.headers['x-session-id'] as string;
			const files = req.files();
			if (!files) {
				return reply.code(400).send({ error: 'No file uploaded' });
			}

			const uploadedFiles = [];
			let fileCount = 0;

			for await (const file of files) {
				if (!file.mimetype.startsWith('image/')) {
					return reply.code(400).send({
						error: `File ${file.filename} is not an image`
					});
				}
				const buffer = await file.toBuffer();
				/// Send "uploaded" status to this user only
				if (sessionId) {
					sendProgressToUser(sessionId, {
						type: 'uploading',
						current: fileCount,
						filename: file.filename
					});
				}


				const fileBuffer = await file.toBuffer();
				const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.filename}`;

				const driveFile = await uploadToGoogleDrive(fileBuffer, filename, file.mimetype, app);

				uploadedFiles.push({
					filename: filename,
					originalName: file.filename,
					driveId: driveFile.id,
					driveLink: driveFile.webViewLink
				});
				/// Send "uploaded" status to this user only
				if (sessionId) {
					sendProgressToUser(sessionId, {
						type: 'uploaded',
						current: fileCount,
						filename: file.filename
					});
				}

				const meta = {
					sessionId,
					originalName: file.filename,
					storedName: filename,
					mimeType: file.mimetype,
					sizeBytes: buffer.length,
					driveId: driveFile.id,
					driveLink: driveFile.webViewLink,
					uploadedAt: Date.now(),
				};
				fileCount++;
				// 🔴 send metadata to Kafka topic
				console.log("message being send====>", meta)
				await producer.send({
					topic: "image-upload-topic",
					messages: [
						{
							key: sessionId ?? undefined,
							value: JSON.stringify(meta),
						},
					],
				});
			}

			// Send completion to this user only
			if (sessionId) {
				sendProgressToUser(sessionId, {
					type: 'complete',
					total: uploadedFiles.length
				});
			}

			return reply.code(200).send({
				message: `${uploadedFiles.length} image(s) uploaded to Google Drive`,
				files: uploadedFiles
			});

		} catch (error) {
			req.log.error(error);
			return reply.code(500).send({
				error: 'File upload failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	});
}
