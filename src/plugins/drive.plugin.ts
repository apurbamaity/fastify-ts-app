// plugins/drive.plugin.ts
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { google, drive_v3 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

let oAuth2Client: any;
let driveClient: drive_v3.Drive | null = null;

async function loadOAuthClient() {
	if (oAuth2Client) return oAuth2Client;

	const credentials = JSON.parse(
		await fsp.readFile(CREDENTIALS_PATH, "utf-8")
	);
	const { client_secret, client_id, redirect_uris } = credentials.web;

	oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0]
	);

	return oAuth2Client;
}

const drivePlugin = fp(async (app: FastifyInstance) => {
	const client = await loadOAuthClient();

	if (fs.existsSync(TOKEN_PATH)) {
		const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
		client.setCredentials(token);
		driveClient = google.drive({ version: "v3", auth: client });
		app.decorate("drive", driveClient);
		app.log.info("✅ Google Drive authenticated");
	} else {
		const authUrl = client.generateAuthUrl({
			access_type: "offline",
			scope: SCOPES,
		});

		app.log.warn("🔐 Google Drive token.json not found");
		app.log.warn("Open this URL in your browser to authorize:\n" + authUrl);

		throw new Error(
			"Google Drive not authorized. Complete OAuth flow and create token.json."
		);
	}
});

export default drivePlugin;
