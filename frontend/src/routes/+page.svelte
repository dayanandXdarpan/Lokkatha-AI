<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$i18n';
	import { getAllLessons, getStorageUsage } from '$db/storage';
	import { onMount } from 'svelte';
	import NetworkStatus from '$lib/components/NetworkStatus.svelte';
	import { isOnline } from '$lib/stores/network';
	
	let lessonCount = 0;
	let storagePercent = 0;
	let storageUsed = 0;
	let storageTotal = 0;
	
	onMount(async () => {
		// Load lesson count
		const lessons = await getAllLessons();
		lessonCount = lessons.length;
		
		// Load storage info
		const storage = await getStorageUsage();
		storageUsed = storage.used;
		storageTotal = storage.quota;
		storagePercent = storage.percentage;
	});
	
	function createLesson() {
		goto('/create');
	}
	
	function viewLessons() {
		goto('/lessons');
	}
	
	function openSettings() {
		goto('/settings');
	}
</script>

<svelte:head>
	<title>{$t('appName')}</title>
</svelte:head>

<div class="home">
	<!-- Header -->
	<header class="header">
		<div class="header-top">
			<NetworkStatus />
			<button class="settings-btn" on:click={openSettings} aria-label="Settings">
				<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="3"></circle>
					<path d="M12 1v6m0 6v6"></path>
					<path d="m19.07 4.93-1.41 1.41M6.34 17.66l-1.41 1.41M1 12h6m6 0h6m-14.07 7.07 1.41-1.41M17.66 6.34l1.41-1.41"></path>
				</svg>
			</button>
		</div>
		<h1 class="app-title">{$t('appName')}</h1>
		<p class="tagline">{$t('appTagline')}</p>
	</header>

	<!-- Main Content -->
	<main class="main-content">
		<!-- Welcome Message -->
		<div class="welcome-card card fade-in">
			<div class="welcome-icon">👋</div>
			<h2 class="welcome-text">{$t('homeWelcome')}</h2>
		</div>

		<!-- Create Lesson Card -->
		<button class="create-card card" class:disabled={!$isOnline} on:click={createLesson} disabled={!$isOnline}>
			<div class="create-icon">
				<svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="24" cy="24" r="20"></circle>
					<path d="M24 14v20M14 24h20"></path>
				</svg>
			</div>
			<h3 class="create-title">{$t('homeCreateNew')}</h3>
			{#if $isOnline}
				<p class="create-hint text-muted">Tap to start creating</p>
			{:else}
				<p class="create-hint" style="color: #EF4444;">Connect to internet to create lessons</p>
			{/if}
		</button>

		<!-- Quick Stats -->
		<div class="stats-grid">
			<!-- Lessons Count -->
			<button class="stat-card card" on:click={viewLessons}>
				<div class="stat-icon" style="background: #EDE9FE;">
					<svg width="32" height="32" fill="none" stroke="#7C3AED" stroke-width="2">
						<path d="M7 8l9-4 9 4M7 8l9 4 9-4M7 8v8l9 4M16 12v8"></path>
					</svg>
				</div>
				<div class="stat-content">
					<div class="stat-value">{lessonCount}</div>
					<div class="stat-label text-muted">{$t('homeMyLessons')}</div>
				</div>
			</button>

			<!-- Storage Info -->
			<div class="stat-card card">
				<div class="stat-icon" style="background: #D1FAE5;">
					<svg width="32" height="32" fill="none" stroke="#10B981" stroke-width="2">
						<path d="M3 12h18M3 6h18M3 18h18"></path>
						<path d="M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
					</svg>
				</div>
				<div class="stat-content">
					<div class="stat-value">{storagePercent}%</div>
					<div class="stat-label text-muted">{$t('homeStorage')}</div>
					<div class="storage-bar">
						<div class="storage-fill" style="width: {storagePercent}%"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Storage Warning -->
		{#if storagePercent > 80}
			<div class="alert alert-warning fade-in">
				<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
				</svg>
				<div>
					<div class="alert-title">{$t('storageWarning')}</div>
					<div class="alert-text">{$t('storageWarningHint')}</div>
				</div>
			</div>
		{/if}
	</main>

	<!-- Bottom Navigation -->
	<nav class="bottom-nav">
		<button class="nav-item active no-select">
			<svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
				<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
			</svg>
			<span class="nav-label">Home</span>
		</button>

		<button class="nav-item no-select" on:click={createLesson}>
			<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"></circle>
				<path d="M12 8v8M8 12h8"></path>
			</svg>
			<span class="nav-label">{$t('navCreate')}</span>
		</button>

		<button class="nav-item no-select" on:click={viewLessons}>
			<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 7l9-4 9 4M3 7l9 4 9-4M3 7v8l9 4M12 11v8"></path>
			</svg>
			<span class="nav-label">{$t('navLessons')}</span>
		</button>
	</nav>
</div>

<style>
	.home {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding-bottom: 80px; /* Space for bottom nav */
	}

	.header {
		position: relative;
		padding: var(--space-xl) var(--space-md) var(--space-lg);
		color: white;
		text-align: center;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-md);
	}

	.app-title {
		font-size: var(--font-2xl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.tagline {
		font-size: var(--font-base);
		opacity: 0.9;
	}

	.settings-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		transition: all 0.2s;
	}

	.settings-btn:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.95);
	}

	.main-content {
		flex: 1;
		padding: 0 var(--space-md) var(--space-md);
	}

	.welcome-card {
		text-align: center;
		margin-bottom: var(--space-lg);
		padding: var(--space-lg);
	}

	.welcome-icon {
		font-size: 3rem;
		margin-bottom: var(--space-sm);
	}

	.welcome-text {
		font-size: var(--font-xl);
		font-weight: 600;
		color: var(--text);
	}

	.create-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		margin-bottom: var(--space-lg);
		border: 3px dashed var(--primary);
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.create-card:active:not(.disabled) {
		transform: scale(0.98);
		background: var(--bg-secondary);
	}

	.create-card.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #D1D5DB;
	}

	.create-icon {
		color: var(--primary);
		margin-bottom: var(--space-sm);
	}

	.create-title {
		font-size: var(--font-xl);
		font-weight: 600;
		margin-bottom: var(--space-xs);
		color: var(--text);
	}

	.create-hint {
		font-size: var(--font-sm);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		cursor: pointer;
		transition: all 0.2s;
	}

	.stat-card:active {
		transform: scale(0.98);
	}

	.stat-icon {
		width: 56px;
		height: 56px;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-value {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--text);
	}

	.stat-label {
		font-size: var(--font-sm);
	}

	.storage-bar {
		width: 100%;
		height: 4px;
		background: var(--bg-secondary);
		border-radius: 2px;
		overflow: hidden;
		margin-top: var(--space-xs);
	}

	.storage-fill {
		height: 100%;
		background: var(--secondary);
		transition: width 0.3s;
	}

	.alert {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: white;
	}

	.alert-warning {
		color: var(--warning);
		background: #FFFBEB;
		border-left: 4px solid var(--warning);
	}

	.alert-title {
		font-weight: 600;
		margin-bottom: 0.25rem;
		color: var(--text);
	}

	.alert-text {
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		background: white;
		border-top: 1px solid var(--border);
		padding: var(--space-xs) 0;
		padding-bottom: max(var(--space-xs), env(safe-area-inset-bottom));
		z-index: var(--z-nav);
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: var(--space-xs);
		color: var(--text-secondary);
		min-height: var(--touch-target);
		transition: all 0.2s;
	}

	.nav-item.active {
		color: var(--primary);
	}

	.nav-item:active {
		background: var(--bg-secondary);
	}

	.nav-label {
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Tablet and larger */
	@media (min-width: 768px) {
		.main-content {
			max-width: 600px;
			margin: 0 auto;
			width: 100%;
		}
	}
</style>
