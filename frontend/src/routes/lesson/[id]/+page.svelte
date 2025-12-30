<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { getLesson, deleteLesson, type LessonData } from "$lib/db/storage";
	import { t } from "$lib/i18n";
	import ShareButton from "$lib/components/ShareButton.svelte";

	let lesson: LessonData | null = null;
	let videoElement: HTMLVideoElement;
	let videoSrc: string | null = null;
	let posterUrl: string | null = null;
	let subtitleUrl: string | null = null;
	let loading = true;
	let error = "";
	let showDeleteConfirm = false;
	let deleting = false;
	let isPublic = false;
	let viewTracked = false;

	const lessonId = $page.params.id;

	onMount(async () => {
		try {
			if (!lessonId) throw new Error("Lesson ID is missing");
			lesson = (await getLesson(lessonId)) || null;
			if (!lesson) {
				error = "Lesson not found";
			}
			// Create object URLs for blobs so <video> can play them (works offline)
			if (lesson) {
				if ((lesson as any).videoBlob) {
					videoSrc = URL.createObjectURL((lesson as any).videoBlob);
				}
				if ((lesson as any).thumbnailBlob) {
					posterUrl = URL.createObjectURL(
						(lesson as any).thumbnailBlob,
					);
				} else if ((lesson as any).thumbnailUrl) {
					posterUrl = (lesson as any).thumbnailUrl;
				}
				// Optional subtitle blob support
				if ((lesson as any).subtitleBlob) {
					subtitleUrl = URL.createObjectURL(
						(lesson as any).subtitleBlob,
					);
				} else if ((lesson as any).subtitleUrl) {
					subtitleUrl = (lesson as any).subtitleUrl;
				}

				// Load video metadata to check if it's published
				try {
					const response = await fetch(`/api/videos/${lessonId}`);
					const data = await response.json();
					if (data.success && data.data) {
						isPublic = data.data.isPublic || false;
					}
				} catch (err) {
					console.log("Video not in explore system yet");
				}
			}
			loading = false;
		} catch (err: any) {
			error = err.message || "Failed to load lesson";
			loading = false;
		}
	});

	onDestroy(() => {
		// Clean up video blob URLs
		if (
			videoElement &&
			videoElement.src &&
			videoElement.src.startsWith("blob:")
		) {
			URL.revokeObjectURL(videoElement.src);
		}
		if (videoSrc && videoSrc.startsWith("blob:")) {
			URL.revokeObjectURL(videoSrc);
		}
		if (posterUrl && posterUrl.startsWith("blob:")) {
			URL.revokeObjectURL(posterUrl);
		}
		if (subtitleUrl && subtitleUrl.startsWith("blob:")) {
			URL.revokeObjectURL(subtitleUrl);
		}
	});

	function goBack() {
		goto("/lessons");
	}

	async function handleDelete() {
		if (!lesson) return;

		deleting = true;
		try {
			await deleteLesson(lesson.id);
			goto("/lessons");
		} catch (err: any) {
			error = err.message || "Failed to delete lesson";
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	function formatDate(date: string | Date): string {
		const d = typeof date === "string" ? new Date(date) : date;
		return d.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	function trackVideoView() {
		if (!viewTracked) {
			fetch(`/api/videos/${lessonId}/view`, { method: "POST" })
				.then(() => (viewTracked = true))
				.catch((err) => console.error("Failed to track view:", err));
		}
	}

	function handleVideoPlay() {
		trackVideoView();
	}

	function handlePublishStatusChanged(
		event: CustomEvent<{ isPublic: boolean }>,
	) {
		isPublic = event.detail.isPublic;
	}

	async function handleDownload() {
		if (!lesson) return;

		try {
			// Download the video file
			const videoUrl = videoSrc || lesson.videoUrl;
			if (!videoUrl) {
				alert("Video not available for download");
				return;
			}

			const response = await fetch(videoUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${lesson.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (err: any) {
			console.error("Download failed:", err);
			alert("Failed to download video. Please try again.");
		}
	}
</script>

<svelte:head>
	<title>{lesson?.title || "Lesson"} - LokKatha AI</title>
</svelte:head>

<div class="lesson-page">
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading lesson...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h2>Oops!</h2>
			<p>{error}</p>
			<button class="btn btn-primary" on:click={goBack}> Go Back </button>
		</div>
	{:else if lesson}
		<!-- Header -->
		<header class="lesson-header">
			<button class="btn-back" on:click={goBack}>
				<svg
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M19 12H5M12 19l-7-7 7-7"></path>
				</svg>
			</button>
			<h1 class="lesson-title-header">{lesson.title}</h1>
			<div class="header-actions">
				<button
					class="btn-download"
					on:click={handleDownload}
					title="Download Video"
				>
					<svg
						width="24"
						height="24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						></path>
					</svg>
				</button>
				<ShareButton
					videoId={lessonId || ""}
					title={lesson.title}
					bind:isPublic
					on:publishStatusChanged={handlePublishStatusChanged}
				/>
				<button
					class="btn-delete"
					on:click={() => (showDeleteConfirm = true)}
				>
					<svg
						width="24"
						height="24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						></path>
					</svg>
				</button>
			</div>
		</header>

		<!-- Video Player -->
		<div class="video-container">
			<video
				bind:this={videoElement}
				controls
				controlsList="nodownload"
				class="video-player"
				poster={posterUrl}
				on:play={handleVideoPlay}
			>
				{#if videoSrc}
					<source src={videoSrc} type="video/mp4" />
				{:else if lesson?.videoUrl}
					<source src={lesson.videoUrl} type="video/mp4" />
				{/if}
				{#if subtitleUrl}
					<track
						kind="subtitles"
						src={subtitleUrl}
						srclang={lesson?.language.toLowerCase()}
						label={lesson?.language}
						default
					/>
				{:else if lesson?.subtitleUrl}
					<track
						kind="subtitles"
						src={lesson.subtitleUrl}
						srclang={lesson.language.toLowerCase()}
						label={lesson.language}
						default
					/>
				{/if}
				Your browser does not support the video tag.
			</video>
		</div>

		<!-- Lesson Info -->
		<div class="lesson-info">
			<h2 class="lesson-title">{lesson.title}</h2>

			<div class="lesson-meta">
				<div class="meta-item">
					<span class="meta-label">Grade</span>
					<span class="meta-value">{lesson.gradeLevel}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Language</span>
					<span class="meta-value">{lesson.language}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Duration</span>
					<span class="meta-value"
						>{Math.floor((lesson.duration || 0) / 60)}:{Math.floor(
							(lesson.duration || 0) % 60,
						)
							.toString()
							.padStart(2, "0")}</span
					>
				</div>
			</div>

			{#if lesson.description}
				<div class="lesson-description">
					<h3>Description</h3>
					<p>{lesson.description}</p>
				</div>
			{/if}

			<div class="lesson-details">
				<p class="detail-text">
					<svg
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="8" cy="8" r="7"></circle>
						<path d="M8 4v4l3 3"></path>
					</svg>
					Created on {formatDate(lesson.createdAt)}
				</p>
				<p class="detail-text">
					<svg
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M3 12h18M3 6h18M3 18h18"></path>
						<path
							d="M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
						></path>
					</svg>
					Size: {((lesson.size || 0) / 1024 / 1024).toFixed(2)} MB
				</p>
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="modal-overlay" on:click={() => (showDeleteConfirm = false)}>
			<div class="modal" on:click|stopPropagation>
				<h3>Delete Lesson?</h3>
				<p>
					This will permanently delete "{lesson?.title}" from your
					device.
				</p>
				<div class="modal-actions">
					<button
						class="btn btn-secondary"
						on:click={() => (showDeleteConfirm = false)}
						disabled={deleting}
					>
						Cancel
					</button>
					<button
						class="btn btn-danger"
						on:click={handleDelete}
						disabled={deleting}
					>
						{deleting ? "Deleting..." : "Delete"}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.lesson-page {
		min-height: 100vh;
		background: var(--bg);
		padding-bottom: var(--space-xl);
	}

	.lesson-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: white;
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.lesson-title-header {
		flex: 1;
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.btn-back,
	.btn-download,
	.btn-delete {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		transition: all 0.2s;
	}

	.btn-back {
		color: var(--text);
		background: var(--bg-secondary);
	}

	.btn-download {
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
	}

	.btn-delete {
		color: var(--danger);
		background: rgba(239, 68, 68, 0.1);
	}

	.btn-back:active {
		background: var(--border);
		transform: scale(0.95);
	}

	.btn-download:active {
		background: rgba(16, 185, 129, 0.2);
		transform: scale(0.95);
	}

	.btn-delete:active {
		background: rgba(239, 68, 68, 0.2);
		transform: scale(0.95);
	}

	.video-container {
		position: relative;
		width: 100%;
		background: #000;
	}

	.video-player {
		width: 100%;
		max-height: 70vh;
		display: block;
	}

	.lesson-info {
		padding: var(--space-lg) var(--space-md);
	}

	.lesson-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--text);
		margin-bottom: var(--space-md);
	}

	.lesson-meta {
		display: flex;
		gap: var(--space-lg);
		margin-bottom: var(--space-lg);
		padding: var(--space-md);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-label {
		font-size: var(--font-xs);
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.meta-value {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text);
	}

	.lesson-description {
		margin-bottom: var(--space-lg);
	}

	.lesson-description h3 {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text);
		margin-bottom: var(--space-sm);
	}

	.lesson-description p {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.lesson-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.detail-text {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-xl);
		text-align: center;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid var(--border);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: var(--space-md);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: var(--space-md);
	}

	.error-state h2 {
		font-size: var(--font-xl);
		font-weight: 600;
		color: var(--text);
		margin-bottom: var(--space-sm);
	}

	.error-state p {
		color: var(--text-secondary);
		margin-bottom: var(--space-lg);
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		z-index: 1000;
		animation: fadeIn 0.2s;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: white;
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		max-width: 400px;
		width: 100%;
		animation: slideUp 0.3s;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal h3 {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text);
		margin-bottom: var(--space-sm);
	}

	.modal p {
		color: var(--text-secondary);
		margin-bottom: var(--space-lg);
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.btn {
		flex: 1;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: var(--font-base);
		transition: all 0.2s;
		min-height: var(--touch-target);
	}

	.btn-primary {
		background: var(--primary);
		color: white;
	}

	.btn-secondary {
		background: var(--bg-secondary);
		color: var(--text);
	}

	.btn-danger {
		background: var(--danger);
		color: white;
	}

	.btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Tablet and larger */
	@media (min-width: 768px) {
		.lesson-info {
			max-width: 800px;
			margin: 0 auto;
		}
	}
</style>
