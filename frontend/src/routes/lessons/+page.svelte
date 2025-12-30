<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$i18n';
	import { getAllLessons, deleteLesson, type LessonData, getStorageUsage } from '$lib/db/storage';
	import NetworkStatus from '$lib/components/NetworkStatus.svelte';
	import { isOnline } from '$lib/stores/network';
	
	let lessons: LessonData[] = [];
	let isLoading = true;
	let storageUsed = 0;
	let storagePercent = 0;
	let selectedLesson: LessonData | null = null;
	let videoUrl: string | null = null;
	let showDeleteConfirm = false;
	let lessonToDelete: string | null = null;
	
	onMount(async () => {
		await loadLessons();
	});
	
	async function loadLessons() {
		isLoading = true;
		try {
			lessons = await getAllLessons();
			const storage = await getStorageUsage();
			storageUsed = storage.used;
			storagePercent = storage.percentage;
		} catch (error) {
			console.error('Failed to load lessons:', error);
		} finally {
			isLoading = false;
		}
	}
	
	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
	
	function formatFileSize(bytes: number): string {
		const mb = (bytes / 1024 / 1024).toFixed(1);
		return `${mb} MB`;
	}
	
	function formatDate(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		
		if (days === 0) return $t('lessonsToday');
		if (days === 1) return $t('lessonsYesterday');
		if (days < 7) return $t('lessonsDaysAgo', { days: days.toString() });
		
		return new Date(date).toLocaleDateString();
	}
	
	function playLesson(lesson: LessonData) {
		selectedLesson = lesson;
		if (videoUrl) {
			URL.revokeObjectURL(videoUrl);
		}
		videoUrl = URL.createObjectURL(lesson.videoBlob);
	}
	
	function closePlayer() {
		if (videoUrl) {
			URL.revokeObjectURL(videoUrl);
			videoUrl = null;
		}
		selectedLesson = null;
	}
	
	function confirmDelete(lessonId: string) {
		lessonToDelete = lessonId;
		showDeleteConfirm = true;
	}
	
	async function handleDelete() {
		if (!lessonToDelete) return;
		
		try {
			await deleteLesson(lessonToDelete);
			await loadLessons();
			showDeleteConfirm = false;
			lessonToDelete = null;
			
			// If the deleted lesson was being played, close player
			if (selectedLesson?.id === lessonToDelete) {
				closePlayer();
			}
		} catch (error) {
			console.error('Failed to delete lesson:', error);
		}
	}
	
	function cancelDelete() {
		showDeleteConfirm = false;
		lessonToDelete = null;
	}
</script>

<svelte:head>
	<title>{$t('lessonsTitle')} - {$t('appName')}</title>
</svelte:head>

<div class="lessons-page">
	<!-- Header -->
	<header class="header">
		<button class="back-btn" on:click={() => goto('/')} aria-label="Back">
			<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M19 12H5M12 19l-7-7 7-7"></path>
			</svg>
		</button>
		<h1 class="title">{$t('lessonsTitle')}</h1>
		<NetworkStatus />
	</header>

	<!-- Offline Banner -->
	{#if !$isOnline}
		<div class="offline-banner">
			<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
			</svg>
			<span>{$t('networkOfflineMessage')}</span>
		</div>
	{/if}

	<!-- Storage Bar -->
	{#if !isLoading && lessons.length > 0}
		<div class="storage-bar">
			<div class="storage-info">
				<span>{$t('homeStorage')}: {storageUsed.toFixed(1)} MB</span>
				<span>{storagePercent}%</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {storagePercent}%"></div>
			</div>
		</div>
	{/if}

	<!-- Content -->
	<main class="content">
		{#if isLoading}
			<div class="empty-state">
				<div class="spinner"></div>
				<p>{$t('lessonsLoading')}</p>
			</div>
		{:else if lessons.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📚</div>
				<h2>{$t('lessonsEmpty')}</h2>
				<p class="text-muted">{$t('lessonsEmptyHint')}</p>
				<button class="btn btn-primary btn-large" on:click={() => goto('/create')}>
					+ {$t('navCreate')}
				</button>
			</div>
		{:else}
			<div class="lessons-grid">
				{#each lessons as lesson (lesson.id)}
					<div class="lesson-card fade-in">
						<!-- Thumbnail -->
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="thumbnail" role="button" tabindex="0" on:click={() => playLesson(lesson)}>
							{#if lesson.thumbnailBlob}
								<img src={URL.createObjectURL(lesson.thumbnailBlob)} alt={lesson.title} />
							{:else}
								<div class="thumbnail-placeholder">
									<svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20">
										<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
									</svg>
								</div>
							{/if}
							<div class="play-overlay">
								<svg width="64" height="64" fill="white" viewBox="0 0 20 20">
									<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
								</svg>
							</div>
						</div>
						
						<!-- Details -->
						<div class="lesson-info">
							<h3 class="lesson-title">{lesson.title}</h3>
							<div class="lesson-meta">
								<span class="meta-badge">{$t('createGrade', { grade: lesson.gradeLevel })}</span>
								<span class="meta-badge">{lesson.language}</span>
							</div>
							<div class="lesson-stats">
								<span>⏱️ {formatDuration(lesson.duration)}</span>
								<span>💾 {formatFileSize(lesson.fileSize)}</span>
								<span class="text-muted">{formatDate(lesson.createdAt)}</span>
							</div>
						</div>
						
						<!-- Actions -->
						<div class="lesson-actions">
							<button class="action-btn action-play" on:click={() => playLesson(lesson)}>
								<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
									<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
								</svg>
								<span>{$t('lessonsPlay')}</span>
							</button>
							<button class="action-btn action-delete" on:click={() => confirmDelete(lesson.id)}>
								<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<!-- Bottom Navigation -->
	<nav class="bottom-nav">
		<button class="nav-item" on:click={() => goto('/')}>
			<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
			</svg>
			<span class="nav-label">{$t('navHome')}</span>
		</button>
		
		<button class="nav-item" on:click={() => goto('/create')}>
			<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path d="M12 4v16m8-8H4"></path>
			</svg>
			<span class="nav-label">{$t('navCreate')}</span>
		</button>
		
		<button class="nav-item active">
			<svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
				<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
			</svg>
			<span class="nav-label">{$t('navLessons')}</span>
		</button>
	</nav>
</div>

<!-- Video Player Modal -->
{#if selectedLesson && videoUrl}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" role="button" tabindex="0" on:click={closePlayer}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div class="player-modal" role="dialog" aria-modal="true" on:click|stopPropagation>
			<button class="close-btn" on:click={closePlayer} aria-label="Close video player">
				<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
			
			<h2 class="player-title">{selectedLesson.title}</h2>
			
			<video 
				src={videoUrl} 
				controls 
				autoplay 
				playsinline
				class="video-player"
			>
				<track kind="captions" src="" label="No captions available" />
			</video>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" role="button" tabindex="0" on:click={cancelDelete}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div class="confirm-modal" role="dialog" aria-modal="true" on:click|stopPropagation>
			<div class="confirm-icon">🗑️</div>
			<h2 class="confirm-title">{$t('lessonsDeleteConfirm')}</h2>
			<p class="confirm-message">{$t('lessonsDeleteMessage')}</p>
			<div class="confirm-actions">
				<button class="btn btn-secondary btn-large" on:click={cancelDelete}>
					{$t('lessonsDeleteCancel')}
				</button>
				<button class="btn btn-danger btn-large" on:click={handleDelete}>
					{$t('lessonsDeleteYes')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.lessons-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-secondary);
		padding-bottom: calc(64px + env(safe-area-inset-bottom));
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		background: white;
		border-bottom: 1px solid var(--border);
	}

	.back-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text);
		border-radius: 50%;
		transition: all 0.2s;
	}

	.back-btn:active {
		background: var(--bg-secondary);
	}

	.title {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text);
	}

	.offline-banner {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: #FEF2F2;
		border-bottom: 2px solid #EF4444;
		color: #991B1B;
		font-size: var(--font-sm);
		font-weight: 500;
		animation: slide-down 0.3s ease;
	}

	@keyframes slide-down {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.storage-bar {
		padding: var(--space-md);
		background: white;
		border-bottom: 1px solid var(--border);
	}

	.storage-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--space-xs);
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.progress-bar {
		height: 8px;
		background: var(--bg-secondary);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--primary), var(--secondary));
		transition: width 0.3s ease;
	}

	.content {
		flex: 1;
		padding: var(--space-md);
		overflow-y: auto;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		padding: var(--space-xl);
	}

	.empty-icon {
		font-size: 5rem;
		margin-bottom: var(--space-md);
	}

	.empty-state h2 {
		font-size: var(--font-xl);
		font-weight: 700;
		margin-bottom: var(--space-sm);
		color: var(--text);
	}

	.empty-state p {
		margin-bottom: var(--space-xl);
	}

	.lessons-grid {
		display: grid;
		gap: var(--space-md);
	}

	.lesson-card {
		background: white;
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.thumbnail {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: var(--bg-secondary);
		cursor: pointer;
		overflow: hidden;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumbnail-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
	}

	.play-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.thumbnail:hover .play-overlay,
	.thumbnail:active .play-overlay {
		opacity: 1;
	}

	.lesson-info {
		padding: var(--space-md);
	}

	.lesson-title {
		font-size: var(--font-lg);
		font-weight: 600;
		margin-bottom: var(--space-sm);
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.lesson-meta {
		display: flex;
		gap: var(--space-xs);
		margin-bottom: var(--space-sm);
	}

	.meta-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.lesson-stats {
		display: flex;
		gap: var(--space-md);
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.lesson-actions {
		display: flex;
		gap: var(--space-xs);
		padding: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		font-size: var(--font-sm);
		font-weight: 500;
		min-height: var(--touch-target);
		transition: all 0.2s;
	}

	.action-play {
		background: var(--primary);
		color: white;
	}

	.action-play:active {
		background: color-mix(in srgb, var(--primary) 90%, black);
	}

	.action-delete {
		background: var(--bg-secondary);
		color: var(--danger);
		max-width: 64px;
	}

	.action-delete:active {
		background: color-mix(in srgb, var(--danger) 10%, white);
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		background: white;
		border-top: 1px solid var(--border);
		padding-bottom: env(safe-area-inset-bottom);
		z-index: var(--z-nav);
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: var(--space-sm);
		color: var(--text-secondary);
		transition: all 0.2s;
		min-height: var(--touch-target);
	}

	.nav-item.active {
		color: var(--primary);
	}

	.nav-item:active {
		background: var(--bg-secondary);
	}

	.nav-label {
		font-size: 0.75rem;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		z-index: var(--z-modal);
		animation: fade-in 0.2s;
	}

	.player-modal {
		position: relative;
		width: 100%;
		max-width: 800px;
		background: white;
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
	}

	.close-btn {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-sm);
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		border-radius: 50%;
		z-index: 1;
	}

	.close-btn:active {
		background: rgba(0, 0, 0, 0.7);
	}

	.player-title {
		font-size: var(--font-lg);
		font-weight: 600;
		margin-bottom: var(--space-md);
		color: var(--text);
	}

	.video-player {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: black;
		border-radius: var(--radius-md);
	}

	.confirm-modal {
		width: 100%;
		max-width: 400px;
		background: white;
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		text-align: center;
	}

	.confirm-icon {
		font-size: 4rem;
		margin-bottom: var(--space-md);
	}

	.confirm-title {
		font-size: var(--font-xl);
		font-weight: 700;
		margin-bottom: var(--space-sm);
		color: var(--text);
	}

	.confirm-message {
		color: var(--text-secondary);
		margin-bottom: var(--space-xl);
	}

	.confirm-actions {
		display: flex;
		gap: var(--space-sm);
	}

	@media (min-width: 768px) {
		.lessons-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.lessons-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
