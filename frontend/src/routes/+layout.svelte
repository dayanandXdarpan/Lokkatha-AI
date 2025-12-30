<script lang="ts">
	import '../app.css';
	import { languageConfig } from '$i18n';
	import { onMount } from 'svelte';
	import DemoHelper from '$lib/components/DemoHelper.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { initializeStorageManagement } from '$lib/utils/storage-manager';
	
	// Apply font based on language
	$: if ($languageConfig) {
		if (typeof document !== 'undefined') {
			document.documentElement.style.setProperty('--app-font', $languageConfig.font);
			document.documentElement.dir = $languageConfig.direction;
		}
	}
	
	// Initialize app on mount
	onMount(async () => {
		// Register service worker for offline support
		if ('serviceWorker' in navigator && import.meta.env.PROD) {
			try {
				await navigator.serviceWorker.register('/service-worker.js');
				console.log('✓ Service worker registered');
			} catch (err) {
				console.error('✗ Service worker registration failed:', err);
			}
		}

		// Initialize storage management (persistent storage, cache, etc.)
		try {
			await initializeStorageManagement();
			console.log('✓ Storage management initialized');
		} catch (err) {
			console.error('✗ Storage initialization failed:', err);
		}
	});
</script>

<ErrorBoundary>
	<div class="app">
		<slot />
		<DemoHelper />
	</div>
</ErrorBoundary>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
