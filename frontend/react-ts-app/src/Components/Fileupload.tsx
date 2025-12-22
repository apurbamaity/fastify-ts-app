import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useWebSocket } from "../context/WebSocketContext";

function Fileupload() {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [images, setImages] = useState<string[]>([]);
	const [uploadStatus, setUploadStatus] = useState<string>("");
	const [uploaded, setUploaded] = useState<boolean[]>([]);


	// Get WebSocket from context
	const { ws, sessionId, isConnected } = useWebSocket();

	// Listen to WebSocket messages
	useEffect(() => {
		if (!ws) return;

		const handleMessage = (event: MessageEvent) => {
			const data = JSON.parse(event.data);

			if (data.type === 'uploading') {
				setUploadStatus(`Uploading file ${data.current}: ${data.filename}...`);
			} else if (data.type === 'uploaded') {
				let index = data.current
				console.log(index, "here uploaded")
				setUploaded(prev => {
					const next = [...prev];      // copy array
					next[index] = true;          // set this item to true
					return next;                 // return new array
				});
				setUploadStatus(`✅ Uploaded file ${data.current}: ${data.filename}`);
			} else if (data.type === 'complete') {
				setUploadStatus(`🎉 All ${data.total} files uploaded successfully!`);
				setTimeout(() => setUploadStatus(""), 3000);
			}
		};

		ws.addEventListener('message', handleMessage);

		// Cleanup function
		return () => {
			ws.removeEventListener('message', handleMessage);
		};
	}, [ws]); // Re-run when ws changes

	const handleOpenFile = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !sessionId) {
			console.error('No files or session ID');
			return;
		}

		const filesArray = Array.from(e.target.files);
		const imgUrls = filesArray.map((file) => { return URL.createObjectURL(file) });
		const uploadedFlags = filesArray.map(() => false);

		setUploaded(uploadedFlags);

		setImages((prev) => [...prev, ...imgUrls]);

		const formData = new FormData();
		filesArray.forEach((file) => {
			formData.append("files", file);
		});

		try {
			setUploadStatus("Starting upload...");
			const res = await axios.post("http://localhost:8081/api/v1/imageupload", formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'X-Session-Id': sessionId
				}
			});
			console.log("Upload success:", res.data);
		} catch (err) {
			console.error("Upload failed:", err);
			setUploadStatus("❌ Upload failed");
		}
	};

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">File upload section</h1>

			{/* Connection Status */}
			<div className="mb-4">
				<span className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
					{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
				</span>
			</div>

			{/* Upload Status */}
			{uploadStatus && (
				<div className="mb-4 p-4 bg-blue-100 rounded-lg">
					<p className="text-blue-800 font-medium">{uploadStatus}</p>
				</div>
			)}

			{/* Upload button */}
			<button
				onClick={handleOpenFile}
				disabled={!isConnected}
				className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Upload Images
			</button>

			{/* Hidden input */}
			<input
				type="file"
				accept="image/*"
				ref={fileInputRef}
				multiple
				hidden
				onChange={handleFileChange}
			/>



			{/* Preview */}
			<div className="flex flex-wrap mt-6 gap-4">
				{images.map((src, index) => (
					<div key={index} className="relative">
						{
							uploaded[index] ? (
								<div className="absolute w-6 h-6 ">
									<h6 className="text-white text-xs">✅</h6>
								</div>
							) : (
								<div className="absolute w-6 h-6 ">
									<h6 className="text-white text-xs">📂</h6>
								</div>
							)
						}

						<img
							src={src}
							width={120}
							className="rounded border shadow-sm"
							alt={`Preview ${index}`}
						/>
					</div>

				))}
			</div>
		</div>
	);
}

export default Fileupload;
