<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		t,
		setLanguage,
		currentLanguage,
		getAvailableLanguages,
	} from "$i18n";
	import { clearAllLessons, getStorageUsage } from "$lib/db/storage";
	import { onMount } from "svelte";

	let storageUsed = 0;
	let storagePercent = 0;
	let showClearConfirm = false;

	const languages = getAvailableLanguages();

	onMount(async () => {
		const storage = await getStorageUsage();
		storageUsed = storage.used;
		storagePercent = storage.percentage;
	});

	async function handleLanguageChange(langCode: string) {
		await setLanguage(langCode as any);
	}

	async function clearStorage() {
		try {
			await clearAllLessons();
			const storage = await getStorageUsage();
			storageUsed = storage.used;
			storagePercent = storage.percentage;
			showClearConfirm = false;
		} catch (error) {
			console.error("Failed to clear storage:", error);
		}
	}
</script>

<svelte:head>
	<title>{$t("settingsTitle")} - {$t("appName")}</title>
</svelte:head>

<div class="settings-page">
	<!-- Header -->
	<header class="header">
		<button class="back-btn" on:click={() => goto("/")} aria-label="Back">
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
		<h1 class="title">{$t("settingsTitle")}</h1>
		<div style="width: 40px;"></div>
	</header>

	<!-- Content -->
	<main class="content">
		<!-- Language Section -->
		<section class="section">
			<h2 class="section-title">{$t("settingsLanguage")}</h2>
			<div class="language-grid">
				{#each languages as lang}
					<button
						class="language-card"
						class:active={$currentLanguage === lang.code}
						on:click={() => handleLanguageChange(lang.code)}
					>
						<div class="language-native">{lang.nativeName}</div>
						<div class="language-english">{lang.name}</div>
						{#if $currentLanguage === lang.code}
							<div class="check-badge">
								<svg
									width="16"
									height="16"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</section>

		<!-- Storage Section -->
		<section class="section">
			<h2 class="section-title">{$t("storageTitle")}</h2>
			<div class="storage-card card">
				<div class="storage-info">
					<div class="storage-label">{$t("homeStorage")}</div>
					<div class="storage-value">
						{storageUsed.toFixed(1)} MB ({storagePercent}%)
					</div>
				</div>
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {storagePercent}%"
					></div>
				</div>
				<button
					class="btn btn-danger btn-large btn-full"
					on:click={() => (showClearConfirm = true)}
					disabled={storageUsed === 0}
				>
					🗑️ {$t("storageManage")}
				</button>
			</div>
		</section>

		<!-- About Section -->
		<section class="section">
			<h2 class="section-title">{$t("settingsAbout")}</h2>
			<div class="about-card card">
				<div class="app-icon">📚</div>
				<h3 class="app-name">{$t("appName")}</h3>
				<p class="app-tagline">{$t("appTagline")}</p>
				<div class="app-version">
					{$t("settingsVersion", { version: "1.0.0" })}
				</div>
				<p class="about-text">
					Create educational videos with AI. Learn anywhere, anytime,
					in your own language.
				</p>
			</div>
		</section>
	</main>

	<!-- Bottom Navigation -->
	<nav class="bottom-nav">
		<button class="nav-item" on:click={() => goto("/")}>
			<svg
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 24 24"
			>
				<path
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				></path>
			</svg>
			<span class="nav-label">{$t("navHome")}</span>
		</button>

		<button class="nav-item" on:click={() => goto("/create")}>
			<svg
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 24 24"
			>
				<path d="M12 4v16m8-8H4"></path>
			</svg>
			<span class="nav-label">{$t("navCreate")}</span>
		</button>

		<button class="nav-item" on:click={() => goto("/lessons")}>
			<svg
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 20 20"
			>
				<path
					d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"
				></path>
			</svg>
			<span class="nav-label">{$t("navLessons")}</span>
		</button>
	</nav>
</div>

<!-- Clear Storage Confirmation Modal -->
{#if showClearConfirm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		on:click={() => (showClearConfirm = false)}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div
			class="confirm-modal"
			role="dialog"
			aria-modal="true"
			on:click|stopPropagation
		>
			<div class="confirm-icon">⚠️</div>
			<h2 class="confirm-title">{$t("storageWarning")}</h2>
			<p class="confirm-message">
				This will delete all {storageUsed.toFixed(1)} MB of downloaded lessons.
				This action cannot be undone.
			</p>
			<div class="confirm-actions">
				<button
					class="btn btn-secondary btn-large"
					on:click={() => (showClearConfirm = false)}
				>
					{$t("cancel")}
				</button>
				<button
					class="btn btn-danger btn-large"
					on:click={clearStorage}
				>
					{$t("lessonsDeleteYes")}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.settings-page {
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

	.content {
		flex: 1;
		padding: var(--space-md);
		overflow-y: auto;
		max-width: 800px;
		width: 100%;
		margin: 0 auto;
	}

	.section {
		margin-bottom: var(--space-xl);
	}

	.section-title {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-md);
	}

	.language-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-sm);
	}

	.language-card {
		position: relative;
		padding: var(--space-md);
		background: white;
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		text-align: center;
		transition: all 0.2s;
		min-height: var(--touch-target);
	}

	.language-card.active {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.05);
	}

	.language-card:active {
		transform: scale(0.98);
	}

	.language-native {
		font-size: var(--font-lg);
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.language-english {
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.check-badge {
		position: absolute;
		top: var(--space-xs);
		right: var(--space-xs);
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--primary);
		color: white;
		border-radius: 50%;
	}

	.storage-card {
		padding: var(--space-lg);
	}

	.storage-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-sm);
	}

	.storage-label {
		font-weight: 500;
		color: var(--text);
	}

	.storage-value {
		font-weight: 700;
		color: var(--primary);
	}

	.progress-bar {
		height: 12px;
		background: var(--bg-secondary);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: var(--space-lg);
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--primary), var(--secondary));
		transition: width 0.3s ease;
	}

	.about-card {
		padding: var(--space-xl);
		text-align: center;
	}

	.app-icon {
		font-size: 4rem;
		margin-bottom: var(--space-md);
	}

	.app-name {
		font-size: var(--font-xl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
		color: var(--text);
	}

	.app-tagline {
		font-size: var(--font-base);
		color: var(--text-secondary);
		margin-bottom: var(--space-sm);
	}

	.app-version {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-md);
	}

	.about-text {
		color: var(--text-secondary);
		line-height: 1.6;
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
		.language-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
