<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { extractTextFromImage, validateOCRQuality, getLanguageCode, extractTextFromImages, type OCRResult } from '$lib/services/ocr';
	import { validateText, type ValidatedText } from '$lib/api/client';
	import { getMessage, simplifyError, getQualityMessage } from '$lib/utils/simpleMessages';
	
	export let language: string = 'English';
	export let dialect: string | undefined = undefined;
	export let onTextExtracted: (text: string) => void;
	export let onCancel: () => void;
	
	let videoRef: HTMLVideoElement;
	let canvasRef: HTMLCanvasElement;
	let fileInput: HTMLInputElement;
	let stream: MediaStream | null = null;
	let capturedImage: string | null = null;
	let uploadedFiles: File[] = [];
	let isProcessing = false;
	let ocrResult: OCRResult | null = null;
	let validatedResult: ValidatedText | null = null;
	let error: string = '';
	let step: 'selection' | 'camera' | 'preview' | 'ocr' | 'validation' | 'complete' = 'selection';
	let processingStep = '';
	let sourceType: 'camera' | 'gallery' | 'pdf' = 'camera';
	let processingProgress = 0;
	
	// Use simple language (Hindi if language contains 'hindi', else English)
	$: uiLanguage = language.toLowerCase().includes('hindi') || language.toLowerCase().includes('हिंदी') ? 'hi' : 'en';
	
	onMount(async () => {
		// Don't auto-start camera, show selection first
	});
	
	onDestroy(() => {
		stopCamera();
	});
	
	function selectSource(type: 'camera' | 'gallery' | 'pdf') {
		sourceType = type;
		if (type === 'camera') {
			step = 'camera';
			startCamera();
		} else if (type === 'gallery' || type === 'pdf') {
			// Trigger file input
			fileInput.click();
		}
	}
	
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		
		if (!files || files.length === 0) {
			return;
		}
		
		uploadedFiles = Array.from(files);
		
		// Convert first file to data URL for preview
		const reader = new FileReader();
		reader.onload = (e) => {
			capturedImage = e.target?.result as string;
			step = 'preview';
		};
		reader.readAsDataURL(uploadedFiles[0]);
	}
	
	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment', // Use back camera on mobile
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				}
			});
			
			if (videoRef) {
				videoRef.srcObject = stream;
			}
		} catch (err: any) {
			error = 'Failed to access camera. Please grant camera permissions.';
			console.error('Camera error:', err);
		}
	}
	
	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
	}
	
	function capturePhoto() {
		if (!videoRef || !canvasRef) return;
		
		const context = canvasRef.getContext('2d');
		if (!context) return;
		
		// Set canvas size to video size
		canvasRef.width = videoRef.videoWidth;
		canvasRef.height = videoRef.videoHeight;
		
		// Draw video frame to canvas
		context.drawImage(videoRef, 0, 0);
		
		// Get image data
		capturedImage = canvasRef.toDataURL('image/png');
		step = 'preview';
		
		// Stop camera to save resources
		stopCamera();
	}
	
	async function retakePhoto() {
		capturedImage = null;
		uploadedFiles = [];
		ocrResult = null;
		validatedResult = null;
		error = '';
		step = 'selection';
	}
	
	async function processImage() {
		if (!capturedImage && uploadedFiles.length === 0) return;
		
		isProcessing = true;
		error = '';
		step = 'ocr';
		processingProgress = 0;
		
		try {
			// Get language code for OCR
			const langCode = getLanguageCode(language);
			
			// Handle PDF files (multi-page)
			if (sourceType === 'pdf' && uploadedFiles.length > 0) {
				processingStep = getMessage('readingText', uiLanguage);
				processingProgress = 10;
				
				// For PDF, we'll process each page
				const blobs: Blob[] = [];
				
				for (const file of uploadedFiles) {
					// Convert file to blob
					blobs.push(file);
				}
				
				processingProgress = 20;
				
				// Extract text from all pages with progress reporting
				const results = await extractTextFromImages(blobs, {
					language: langCode,
					preprocessImage: true,
					enhanceContrast: true,
					removeNoise: true,
					onProgress: (progress) => {
						processingProgress = 20 + (progress * 0.4); // 20% to 60%
					}
				});
				
				processingProgress = 60;
				
				// Combine results
				const combinedText = results.map(r => r.text).join('\n\n');
				const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
				
				ocrResult = {
					text: combinedText,
					confidence: avgConfidence,
					detectedLanguage: langCode,
					lines: results.flatMap(r => r.lines),
					rawResult: results[0].rawResult
				};
				
			} else {
				// Single image processing
				processingStep = getMessage('readingText', uiLanguage);
				processingProgress = 10;
				
				let blob: Blob;
				
				if (uploadedFiles.length > 0) {
					blob = uploadedFiles[0];
				} else if (capturedImage) {
					const response = await fetch(capturedImage);
					blob = await response.blob();
				} else {
					throw new Error('No image to process');
				}
				
				processingProgress = 20;
				
				// Extract text using Tesseract OCR with progress
				ocrResult = await extractTextFromImage(blob, {
					language: langCode,
					preprocessImage: true,
					enhanceContrast: true,
					removeNoise: true,
					onProgress: (progress) => {
						processingProgress = 20 + (progress * 0.4); // 20% to 60%
					}
				});
				
				processingProgress = 60;
			}
			
			console.log('[Scanner] OCR complete:', {
				text: ocrResult.text.substring(0, 100) + '...',
				confidence: ocrResult.confidence,
				lines: ocrResult.lines.length
			});
			
			// Validate OCR quality
			processingProgress = 65;
			const quality = validateOCRQuality(ocrResult);
			
			if (!quality.isGoodQuality) {
				error = simplifyError(quality.suggestions.join(' '), uiLanguage);
				isProcessing = false;
				processingProgress = 0;
				return;
			}
			
			// Step 2: Validate and correct text with AI
			step = 'validation';
			processingStep = getMessage('improvingText', uiLanguage);
			processingProgress = 70;
			
			validatedResult = await validateText({
				ocrText: ocrResult.text,
				language,
				dialect,
				context: 'Educational textbook content',
				confidence: ocrResult.confidence
			});
			
			processingProgress = 90;
			
			console.log('[Scanner] Validation complete:', {
				qualityScore: validatedResult.qualityScore,
				changesMade: validatedResult.changesMade.length
			});
			
			// Check if quality is acceptable
			if (validatedResult.qualityScore < 30) {
				error = simplifyError('Text quality is too low', uiLanguage);
				isProcessing = false;
				processingProgress = 0;
				return;
			}
			
			// Success!
			step = 'complete';
			isProcessing = false;
			
		} catch (err: any) {
			console.error('[Scanner] Processing error:', err);
			error = simplifyError(err, uiLanguage);
			isProcessing = false;
			processingProgress = 0;
		}
	}
	
	function useExtractedText() {
		if (validatedResult) {
			onTextExtracted(validatedResult.correctedText);
		}
	}
	
	function handleCancel() {
		stopCamera();
		onCancel();
	}
</script>

<div class="book-scanner">
	<!-- Hidden file input -->
	<input
		type="file"
		bind:this={fileInput}
		on:change={handleFileSelect}
		accept={sourceType === 'pdf' ? 'application/pdf,image/*' : 'image/*'}
		multiple={sourceType === 'pdf'}
		style="display: none;"
	/>
	
	{#if step === 'selection'}
		<!-- Source Selection Screen -->
		<div class="selection-view">
			<div class="selection-header">
				<button class="btn-back" on:click={handleCancel}>
					<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M19 12H5M12 19l-7-7 7-7"></path>
					</svg>
				</button>
				<h2>Scan Textbook</h2>
				<div></div>
			</div>
			
			<div class="selection-content">
				<p class="selection-hint">{getMessage('pleaseWait', uiLanguage)}</p>
				
				<div class="source-options">
					<button class="source-btn" on:click={() => selectSource('camera')}>
						<div class="source-icon">📷</div>
						<div class="source-label">{getMessage('takePhoto', uiLanguage)}</div>
						<div class="source-desc">
							{uiLanguage === 'hi' ? 'कैमरा से पेज की फोटो लें' : 'Use camera to capture page'}
						</div>
					</button>
					
					<button class="source-btn" on:click={() => selectSource('gallery')}>
						<div class="source-icon">🖼️</div>
						<div class="source-label">{getMessage('fromGallery', uiLanguage)}</div>
						<div class="source-desc">
							{uiLanguage === 'hi' ? 'पुरानी फोटो चुनें' : 'Select existing image'}
						</div>
					</button>
					
					<button class="source-btn" on:click={() => selectSource('pdf')}>
						<div class="source-icon">📄</div>
						<div class="source-label">{getMessage('uploadPDF', uiLanguage)}</div>
						<div class="source-desc">
							{uiLanguage === 'hi' ? 'कई पन्नों वाली फाइल' : 'Multi-page document'}
						</div>
					</button>
				</div>
			</div>
		</div>
	{:else if step === 'camera'}
		<!-- Camera View -->
		<div class="camera-view">
			<!-- svelte-ignore a11y-media-has-caption -->
			<video
				bind:this={videoRef}
				autoplay
				playsinline
				class="camera-feed"
			></video>
			
			<div class="camera-overlay">
				<div class="scan-frame"></div>
				<div class="scan-hint">
					Position the book page within the frame
				</div>
			</div>
			
			<canvas bind:this={canvasRef} style="display: none;"></canvas>
			
			<div class="camera-controls">
				<button class="btn-cancel" on:click={handleCancel}>
					Cancel
				</button>
				<button class="btn-capture" on:click={capturePhoto}>
					<span class="capture-circle"></span>
				</button>
				<div class="btn-spacer"></div>
			</div>
		</div>
	{:else if step === 'preview'}
		<!-- Image Preview -->
		<div class="preview-view">
			<img src={capturedImage} alt="Captured" class="preview-image" />
			
			<div class="preview-controls">
				<button class="btn btn-secondary" on:click={retakePhoto}>
					Retake
				</button>
				<button class="btn btn-primary" on:click={processImage}>
					Extract Text
				</button>
			</div>
		</div>
	{:else if step === 'ocr' || step === 'validation'}
		<!-- Processing View -->
		<div class="processing-view">
			<div class="processing-content">
				<!-- Large circular progress indicator -->
				<div class="progress-circle-container">
					<svg class="progress-circle" width="120" height="120">
						<circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" stroke-width="8" />
						<circle 
							cx="60" 
							cy="60" 
							r="54" 
							fill="none" 
							stroke="#4F46E5" 
							stroke-width="8"
							stroke-dasharray="339.292"
							stroke-dashoffset="{339.292 * (1 - processingProgress / 100)}"
							transform="rotate(-90 60 60)"
							style="transition: stroke-dashoffset 0.5s ease;"
						/>
					</svg>
					<div class="progress-emoji">{step === 'ocr' ? '📖' : '✨'}</div>
					<div class="progress-percent">{processingProgress}%</div>
				</div>
				
				<h3 class="processing-title">{processingStep}</h3>
				
				<p class="processing-hint">
					{getMessage('pleaseWait', uiLanguage)}
				</p>
			</div>
		</div>
	{:else if step === 'complete'}
		<!-- Results View -->
		<div class="results-view">
			{#if error}
				<div class="error-message">
					<span class="error-icon">⚠️</span>
					<p>{error}</p>
					<button class="btn btn-primary" on:click={retakePhoto}>
						Retake Photo
					</button>
				</div>
			{:else if validatedResult}
				<div class="success-content">
					<div class="success-icon">✓</div>
					<h3>{getMessage('textExtracted', uiLanguage)}</h3>
					
					<div class="quality-score">
						<div class="score-label">{getQualityMessage(validatedResult.qualityScore, uiLanguage)}</div>
						<div class="score-value" class:high={validatedResult.qualityScore >= 80} class:medium={validatedResult.qualityScore >= 60 && validatedResult.qualityScore < 80} class:low={validatedResult.qualityScore < 60}>
							{validatedResult.qualityScore}/100
						</div>
					</div>
					
					<div class="extracted-text">
						<strong>{uiLanguage === 'hi' ? 'आपका पाठ:' : 'Your Text:'}</strong>
						<div class="text-box">
							{validatedResult.correctedText}
						</div>
					</div>
					
					<div class="result-controls">
						<button class="btn btn-secondary" on:click={retakePhoto}>
							{getMessage('retake', uiLanguage)}
						</button>
						<button class="btn btn-primary btn-large" on:click={useExtractedText}>
							{getMessage('useThis', uiLanguage)}
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
	
	{#if error && step !== 'complete'}
		<div class="error-banner">
			{error}
		</div>
	{/if}
</div>

<style>
	.book-scanner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #000;
		z-index: 1000;
	}
	
	/* Selection Screen Styles */
	.selection-view {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.selection-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		color: white;
	}
	
	.selection-header h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
	}
	
	.btn-back {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 8px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		cursor: pointer;
		transition: background 0.2s;
	}
	
	.btn-back:hover {
		background: rgba(255, 255, 255, 0.3);
	}
	
	.selection-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 20px;
		overflow-y: auto;
	}
	
	.selection-hint {
		color: rgba(255, 255, 255, 0.9);
		font-size: 16px;
		text-align: center;
		margin-bottom: 32px;
	}
	
	.source-options {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 500px;
		margin: 0 auto;
		width: 100%;
	}
	
	.source-btn {
		background: rgba(255, 255, 255, 0.95);
		border: none;
		border-radius: 16px;
		padding: 28px 24px; /* Increased padding for larger touch target */
		min-height: 100px; /* Minimum height for finger-friendly tapping */
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		gap: 16px;
		text-align: left;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	
	.source-btn:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
		background: white;
	}
	
	.source-btn:active {
		transform: translateY(-2px);
	}
	
	.source-icon {
		font-size: 48px;
		flex-shrink: 0;
	}
	
	.source-label {
		font-size: 18px;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 4px;
	}
	
	.source-desc {
		font-size: 14px;
		color: #666;
	}
	
	.camera-view {
		position: relative;
		width: 100%;
		height: 100%;
	}
	
	.camera-feed {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.camera-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
	}
	
	.scan-frame {
		width: 90%;
		max-width: 600px;
		aspect-ratio: 1.414; /* A4 ratio */
		border: 3px dashed white;
		border-radius: 8px;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
	}
	
	.scan-hint {
		position: absolute;
		bottom: 120px;
		color: white;
		font-size: 16px;
		text-align: center;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
	}
	
	.camera-controls {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
	}
	
	.btn-cancel {
		color: white;
		font-size: 18px; /* Larger text */
		padding: 14px 28px; /* Larger touch target */
		min-height: 56px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 28px;
		backdrop-filter: blur(10px);
	}
	
	.btn-capture {
		width: 80px; /* Larger capture button */
		height: 80px;
		background: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	
	.capture-circle {
		width: 68px; /* Proportionally larger */
		height: 68px;
		background: #4F46E5;
		border-radius: 50%;
		transition: transform 0.2s;
	}
	
	.btn-capture:active .capture-circle {
		transform: scale(0.9);
	}
	
	.btn-spacer {
		width: 80px;
	}
	
	.preview-view,
	.processing-view,
	.results-view {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: white;
	}
	
	.preview-image {
		flex: 1;
		object-fit: contain;
		background: #000;
	}
	
	.preview-controls {
		display: flex;
		gap: 12px;
		padding: 20px;
		background: white;
		border-top: 1px solid #E5E7EB;
	}
	
	.preview-controls .btn {
		flex: 1;
		padding: 18px; /* Larger touch target */
		min-height: 56px;
		font-size: 18px;
		font-weight: 600;
	}
	
	.processing-view {
		align-items: center;
		justify-content: center;
		padding: 24px;
	}
	
	.processing-content {
		text-align: center;
		max-width: 400px;
	}
	
	/* New circular progress indicator */
	.progress-circle-container {
		position: relative;
		width: 120px;
		height: 120px;
		margin: 0 auto 24px;
	}
	
	.progress-circle {
		transform: rotate(-90deg);
	}
	
	.progress-emoji {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 40px;
	}
	
	.progress-percent {
		position: absolute;
		bottom: -24px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 16px;
		font-weight: 600;
		color: #4F46E5;
	}
	
	.processing-title {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 8px;
		color: #1a1a1a;
	}
	
	.processing-hint {
		font-size: 14px;
		color: #6B7280;
	}
	
	/* Old spinner - keep as fallback */
	.spinner {
		width: 60px;
		height: 60px;
		border: 4px solid #E5E7EB;
		border-top-color: #4F46E5;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 24px;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.ocr-preview {
		margin-top: 24px;
		padding: 16px;
		background: #F9FAFB;
		border-radius: 8px;
		text-align: left;
	}
	
	.text-preview {
		margin: 8px 0;
		font-family: monospace;
		font-size: 14px;
		color: #4B5563;
	}
	
	.results-view {
		padding: 24px;
		overflow-y: auto;
	}
	
	.success-content {
		max-width: 600px;
		margin: 0 auto;
	}
	
	.success-icon {
		width: 80px;
		height: 80px;
		background: #10B981;
		color: white;
		font-size: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 16px;
	}
	
	.quality-score {
		text-align: center;
		margin: 24px 0;
	}
	
	.score-label {
		font-size: 14px;
		color: #6B7280;
		margin-bottom: 8px;
	}
	
	.score-value {
		font-size: 48px;
		font-weight: 700;
	}
	
	.score-value.high {
		color: #10B981;
	}
	
	.score-value.medium {
		color: #F59E0B;
	}
	
	.score-value.low {
		color: #EF4444;
	}
	
	.changes-summary {
		margin: 24px 0;
		padding: 16px;
		background: #F9FAFB;
		border-radius: 8px;
	}
	
	.changes-summary ul {
		list-style: none;
		padding: 0;
		margin: 8px 0 0 0;
	}
	
	.changes-summary li {
		padding: 8px 0;
		font-size: 14px;
	}
	
	.change-type {
		display: inline-block;
		padding: 2px 8px;
		background: #4F46E5;
		color: white;
		border-radius: 4px;
		font-size: 12px;
		text-transform: capitalize;
	}
	
	.extracted-text {
		margin: 24px 0;
	}
	
	.text-box {
		margin-top: 8px;
		padding: 16px;
		background: #F9FAFB;
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		max-height: 300px;
		overflow-y: auto;
		white-space: pre-wrap;
		font-size: 14px;
		line-height: 1.6;
	}
	
	.result-controls {
		display: flex;
		gap: 12px;
		margin-top: 24px;
	}
	
	.result-controls .btn {
		flex: 1;
		padding: 18px; /* Larger touch target */
		min-height: 56px;
		font-size: 18px;
		font-weight: 600;
	}
	
	.btn-large {
		font-size: 20px !important;
		padding: 20px !important;
		min-height: 64px !important;
	}
	
	.error-banner {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		background: #EF4444;
		color: white;
		padding: 16px;
		text-align: center;
		animation: slideDown 0.3s ease-out;
	}
	
	@keyframes slideDown {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	.error-message {
		text-align: center;
		padding: 48px 24px;
	}
	
	.error-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}
</style>
