<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		completeOnboardingFlow,
		saveDialectPreference,
		markOnboardingCompleted,
		type DialectOption
	} from '$lib/services/location';

	let loading = true;
	let step: 'permission' | 'detecting' | 'selection' = 'permission';
	let detectedState: string | null = null;
	let availableDialects: DialectOption[] = [];
	let selectedDialect: DialectOption | null = null;
	let error: string = '';

	onMount(async () => {
		// Start onboarding flow
		await startOnboarding();
	});

	async function startOnboarding() {
		loading = true;
		error = '';
		step = 'permission';

		setTimeout(async () => {
			step = 'detecting';

			try {
				const result = await completeOnboardingFlow();

				detectedState = result.state;
				availableDialects = result.dialects;

				// If we have a saved preference, use it
				if (result.selectedDialect) {
					selectedDialect = result.selectedDialect;
				}

				step = 'selection';
				loading = false;
			} catch (err: any) {
				console.error('Onboarding error:', err);
				error = 'Unable to detect location. Please select your preferred language below.';
				availableDialects = [
					{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' },
					{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
				];
				step = 'selection';
				loading = false;
			}
		}, 1500);
	}

	function selectDialect(dialect: DialectOption) {
		selectedDialect = dialect;
	}

	async function completeOnboarding() {
		if (!selectedDialect) {
			error = 'Please select a language';
			return;
		}

		loading = true;

		try {
			// Save preference
			await saveDialectPreference(selectedDialect);
			await markOnboardingCompleted();

			// Navigate to home
			goto('/');
		} catch (err) {
			console.error('Error completing onboarding:', err);
			error = 'Failed to save preferences. Please try again.';
			loading = false;
		}
	}

	function skipLocationDetection() {
		availableDialects = [
			{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' },
			{ id: 'english', name: 'English', language: 'English', nativeName: 'English' },
			{ id: 'tamil', name: 'Tamil', language: 'Tamil', nativeName: 'தமிழ்' },
			{ id: 'telugu', name: 'Telugu', language: 'Telugu', nativeName: 'తెలుగు' },
			{ id: 'kannada', name: 'Kannada', language: 'Kannada', nativeName: 'ಕನ್ನಡ' },
			{ id: 'malayalam', name: 'Malayalam', language: 'Malayalam', nativeName: 'മലയാളം' },
			{ id: 'bengali', name: 'Bengali', language: 'Bengali', nativeName: 'বাংলা' },
			{ id: 'gujarati', name: 'Gujarati', language: 'Gujarati', nativeName: 'ગુજરાતી' },
			{ id: 'marathi', name: 'Marathi', language: 'Marathi', nativeName: 'मराठी' },
			{ id: 'punjabi', name: 'Punjabi', language: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
		];
		step = 'selection';
		loading = false;
	}
</script>

<svelte:head>
	<title>Welcome to LokKatha AI</title>
</svelte:head>

<div class="onboarding">
	{#if step === 'permission'}
		<div class="onboarding-card fade-in">
			<div class="icon-large">🌍</div>
			<h1 class="title">Welcome to LokKatha AI!</h1>
			<p class="subtitle">Create educational videos in your local language</p>

			<div class="info-box">
				<svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				<div>
					<p class="info-title">We need your location</p>
					<p class="info-text">
						To provide the best experience, we'll detect your state and suggest your local
						language/dialect. This happens only once.
					</p>
				</div>
			</div>

			<div class="permission-items">
				<div class="permission-item">
					<span class="permission-icon">📍</span>
					<span>Location - Auto-detect your state</span>
				</div>
				<div class="permission-item">
					<span class="permission-icon">📷</span>
					<span>Camera - Scan textbooks (optional)</span>
				</div>
			</div>

			<button class="btn-primary" on:click={() => {}} disabled>
				<span class="btn-spinner"></span>
				Detecting location...
			</button>

			<button class="btn-text" on:click={skipLocationDetection}>Skip and choose manually</button>
		</div>
	{:else if step === 'detecting'}
		<div class="onboarding-card fade-in">
			<div class="spinner-large"></div>
			<h2 class="title">Detecting your location...</h2>
			<p class="subtitle">This will only take a moment</p>
		</div>
	{:else if step === 'selection'}
		<div class="onboarding-card fade-in">
			{#if detectedState}
				<div class="success-badge">
					<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Detected: {detectedState}</span>
				</div>
			{/if}

			<h1 class="title">Select your teaching language</h1>
			<p class="subtitle">
				{#if detectedState}
					We found these languages for {detectedState}:
				{:else}
					Choose your preferred language for creating lessons:
				{/if}
			</p>

			{#if error}
				<div class="error-message">
					<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					{error}
				</div>
			{/if}

			<div class="dialect-grid">
				{#each availableDialects as dialect}
					<button
						class="dialect-card"
						class:selected={selectedDialect?.id === dialect.id}
						on:click={() => selectDialect(dialect)}
					>
						<div class="dialect-name">{dialect.nativeName}</div>
						<div class="dialect-english">{dialect.name}</div>
						{#if selectedDialect?.id === dialect.id}
							<div class="check-icon">
								<svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<button
				class="btn-primary"
				on:click={completeOnboarding}
				disabled={!selectedDialect || loading}
			>
				{#if loading}
					<span class="btn-spinner"></span>
					Saving...
				{:else}
					Continue
				{/if}
			</button>

			<button class="btn-text" on:click={() => goto('/')}>Skip for now</button>
		</div>
	{/if}
</div>

<style>
	.onboarding {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.onboarding-card {
		background: white;
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.icon-large {
		font-size: 4rem;
		text-align: center;
		margin-bottom: var(--space-md);
	}

	.title {
		font-size: var(--font-2xl);
		font-weight: 700;
		text-align: center;
		color: var(--text);
		margin-bottom: var(--space-sm);
	}

	.subtitle {
		text-align: center;
		color: var(--text-secondary);
		margin-bottom: var(--space-lg);
	}

	.info-box {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: #EFF6FF;
		border-radius: var(--radius-md);
		border-left: 4px solid var(--primary);
		margin-bottom: var(--space-lg);
		color: #1E40AF;
	}

	.info-title {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.info-text {
		font-size: var(--font-sm);
		opacity: 0.9;
	}

	.permission-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.permission-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		font-size: var(--font-sm);
	}

	.permission-icon {
		font-size: 1.5rem;
	}

	.success-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #D1FAE5;
		color: #065F46;
		border-radius: 9999px;
		font-size: var(--font-sm);
		font-weight: 600;
		margin-bottom: var(--space-md);
	}

	.dialect-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.dialect-card {
		position: relative;
		padding: var(--space-md);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.dialect-card:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.dialect-card.selected {
		border-color: var(--primary);
		background: #EDE9FE;
		border-width: 3px;
	}

	.dialect-name {
		font-size: var(--font-lg);
		font-weight: 600;
		margin-bottom: 0.25rem;
		color: var(--text);
	}

	.dialect-english {
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.check-icon {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 32px;
		height: 32px;
		background: var(--primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.spinner-large {
		width: 64px;
		height: 64px;
		border: 4px solid var(--bg-secondary);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto var(--space-md);
	}

	.btn-primary {
		width: 100%;
		padding: var(--space-md);
		background: var(--primary);
		color: white;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: var(--font-base);
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: var(--space-sm);
	}

	.btn-primary:hover:not(:disabled) {
		background: #5B21B6;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-text {
		width: 100%;
		padding: var(--space-sm);
		background: transparent;
		color: var(--text-secondary);
		border: none;
		cursor: pointer;
		font-size: var(--font-sm);
		transition: color 0.2s;
	}

	.btn-text:hover {
		color: var(--primary);
	}

	.btn-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: var(--space-sm);
		background: #FEE2E2;
		color: #991B1B;
		border-radius: var(--radius-md);
		font-size: var(--font-sm);
		margin-bottom: var(--space-md);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.fade-in {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.dialect-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
