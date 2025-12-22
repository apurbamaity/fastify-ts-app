// libs/drive.ts
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { google, drive_v3 } from "googleapis";
import type { FastifyInstance } from "fastify";

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

export async function initializeDrive() {
	const client = await loadOAuthClient();

	if (fs.existsSync(TOKEN_PATH)) {
		const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
		client.setCredentials(token);
		driveClient = google.drive({ version: "v3", auth: client });
		console.log("✅ Google Drive authenticated\n");
	} else {
		const authUrl = client.generateAuthUrl({
			access_type: "offline",
			scope: SCOPES,
		});

		console.log("\n========================================");
		console.log("🔐 AUTHORIZATION REQUIRED");
		console.log("========================================");
		console.log("Open this URL in your browser:\n");
		console.log(authUrl);
		console.log("\n========================================\n");
	}
}

export async function getDrive() {
	if (driveClient) return driveClient;

	const client = await loadOAuthClient();

	if (!fs.existsSync(TOKEN_PATH)) {
		throw new Error(
			"Google Drive token.json not found. Run initializeDrive() and complete auth."
		);
	}

	const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
	client.setCredentials(token);

	driveClient = google.drive({ version: "v3", auth: client });
	return driveClient;
}

export async function setupOAuthCallback(app: FastifyInstance) {
	const client = await loadOAuthClient();

	app.get("/oauth2callback", async (req, reply) => {
		const code = (req.query as any).code;

		if (!code) {
			return reply.code(400).send("No code provided");
		}

		try {
			const { tokens } = await client.getToken(code);
			client.setCredentials(tokens);
			fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
			// next getDrive() call will reuse these credentials
			driveClient = google.drive({ version: "v3", auth: client });

			return reply.type("text/html").send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            h1 { color: green; }
          </style>
        </head>
        <body>
          <h1>✅ Authorization Successful!</h1>
          <p>Token saved. You can close this window and start uploading files.</p>
          <script>setTimeout(() => window.close(), 2000)</script>
        </body>
        </html>
      `);
		} catch (error) {
			console.error("Auth error:", error);
			return reply.code(500).type("text/html").send(`
        <h1>❌ Authorization Failed</h1>
        <p>${error}</p>
      `);
		}
	});
}
