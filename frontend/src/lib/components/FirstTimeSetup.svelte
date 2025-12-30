<script lang="ts">
	import { settings, INDIAN_STATES, getDialectsForState } from '$lib/stores/settings';
	import { detectStateFromIP } from '$lib/services/location';
	import { setLanguage } from '$lib/i18n';
	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';
	
	const dispatch = createEventDispatcher();

	const LANGUAGE_CHOICES = [
		{ id: 'en', title: 'English', subtitle: 'Menus, narration, and subtitles in English' },
		{ id: 'hi', title: 'हिंदी', subtitle: 'ऐप और आवाज़ हिंदी में' },
		{ id: 'ta', title: 'தமிழ்', subtitle: 'தமிழ் வழிசெலுத்தல் மற்றும் குரல்' },
		{ id: 'te', title: 'తెలుగు', subtitle: 'తెలుగు నావిగేషన్ మరియు వాయిస్' },
		{ id: 'mr', title: 'मराठी', subtitle: 'मराठीमध्ये नेव्हिगेशन आणि आवाज' },
		{ id: 'bn', title: 'বাংলা', subtitle: 'বাংলা নেভিগেশন এবং ভয়েস' },
		{ id: 'gu', title: 'ગુજરાતી', subtitle: 'ગુજરાતી નેવિગેશન અને અવાજ' },
		{ id: 'kn', title: 'ಕನ್ನಡ', subtitle: 'ಕನ್ನಡ ನ್ಯಾವಿಗೇಶನ್ ಮತ್ತು ಧ್ವನಿ' },
		{ id: 'ml', title: 'മലയാളം', subtitle: 'മലയാളം നാവിഗേഷനും ശബ്ദവും' },
		{ id: 'pa', title: 'ਪੰਜਾਬੀ', subtitle: 'ਪੰਜਾਬੀ ਨੈਵੀਗੇਸ਼ਨ ਅਤੇ ਆਵਾਜ਼' }
	];
	
	// Language ID to Full Name mapping for video generation
	const LANGUAGE_NAME_MAP: Record<string, string> = {
		'en': 'English',
		'hi': 'Hindi',
		'ta': 'Tamil',
		'te': 'Telugu',
		'mr': 'Marathi',
		'bn': 'Bengali',
		'gu': 'Gujarati',
		'kn': 'Kannada',
		'ml': 'Malayalam',
		'pa': 'Punjabi'
	};

	let step: 1 | 2 | 3 = 1; // 1: Language, 2: State, 3: Dialect
	let preferredLanguage = 'en';
	let selectedState: string | null = null;
	let selectedDialect: string | null = null;
	let detectingState = false;
	let stateDetectionMessage = '';

	$: availableDialects = selectedState ? getDialectsForState(selectedState) : [];

	onMount(async () => {
		const currentSettings = get(settings);
		// Map full language name to language code
		const langCode = Object.entries(LANGUAGE_NAME_MAP).find(
			([_, name]) => name === currentSettings.defaultLanguage
		)?.[0] || 'en';
		preferredLanguage = langCode;
		selectedState = currentSettings.state;
		selectedDialect = currentSettings.defaultDialect;

		// Auto-detect state on mount if not already set
		if (!selectedState) {
			await autoDetectState();
		}
	});

	async function autoDetectState() {
		detectingState = true;
		stateDetectionMessage = '🌍 Detecting your location...';
		
		try {
			const detectedState = await detectStateFromIP();
			
			if (detectedState && INDIAN_STATES.includes(detectedState)) {
				selectedState = detectedState;
				stateDetectionMessage = `✓ Detected: ${detectedState}`;
				handleStateSelection(detectedState);
			} else {
				stateDetectionMessage = '📍 Please select your state manually';
			}
		} catch (error) {
			console.warn('State auto-detection failed:', error);
			stateDetectionMessage = '📍 Please select your state manually';
		} finally {
			detectingState = false;
		}
	}

	function handleStateSelection(state: string) {
		selectedState = state;
		const dialects = getDialectsForState(state);
		if (!dialects.includes(selectedDialect || '')) {
			selectedDialect = dialects[0] || null;
		}
	}

	function nextStep() {
		if (step === 1) {
			step = 2;
			return;
		}

		if (step === 2) {
			if (availableDialects.length > 0) {
				step = 3;
			} else {
				finishSetup();
			}
			return;
		}

		if (step === 3) {
			finishSetup();
		}
	}

	function previousStep() {
		if (step > 1) {
			step--;
		}
	}

	function finishSetup() {
		// Update both settings store AND i18n language
		const fullLanguageName = LANGUAGE_NAME_MAP[preferredLanguage] || 'English';
		
		settings.update((s) => ({
			...s,
			defaultLanguage: fullLanguageName,
			state: selectedState,
			defaultDialect: selectedDialect,
			hasCompletedSetup: true
		}));
		
		// CRITICAL: Update app UI language immediately
		setLanguage(preferredLanguage as any);

		dispatch('complete');
	}

	function skip() {
		settings.update((s) => ({
			...s,
			hasCompletedSetup: true
		}));
		dispatch('complete');
	}
</script>

<div class="modal-overlay">
	<div class="setup-modal">
		<!-- Progress Indicator -->
		<div class="progress-dots">
			<div class="dot" class:active={step >= 1} class:completed={step > 1}>1</div>
			<div class="dot" class:active={step >= 2} class:completed={step > 2}>2</div>
			<div class="dot" class:active={step >= 3}>3</div>
		</div>

		{#if step === 1}
			<div class="step-content">
				<div class="step-header">
					<h2 class="step-title">🌐 Choose Your App Language</h2>
					<button class="skip-link" on:click={skip}>Skip for now</button>
				</div>
				<p class="step-description">
					We will use this language for menus, guidance, and narration during video creation.
				</p>

				<div class="language-grid">
					{#each LANGUAGE_CHOICES as lang}
						<button
							class="language-option"
							class:selected={preferredLanguage === lang.id}
							on:click={() => preferredLanguage = lang.id}
						>
							<div class="language-label">{lang.title}</div>
							<div class="language-subtitle">{lang.subtitle}</div>
							{#if preferredLanguage === lang.id}
								<div class="check-icon">✓</div>
							{/if}
						</button>
					{/each}
				</div>

				<div class="step-actions">
					<button
						class="btn btn-primary"
						on:click={nextStep}
						disabled={!preferredLanguage}
					>
						Continue →
					</button>
				</div>
			</div>
		{:else if step === 2}
			<div class="step-content">
				<div class="step-header">
					<h2 class="step-title">📍 Select Your State/Region</h2>
					<button class="skip-link" on:click={skip}>Skip for now</button>
				</div>
				<p class="step-description">
					This helps us pre-select regional dialects for narration. You can change it later in Settings.
				</p>

				{#if stateDetectionMessage}
					<div class="detection-status" class:success={selectedState}>
						{stateDetectionMessage}
					</div>
				{/if}

				<div class="states-grid">
					{#each INDIAN_STATES as state}
						<button
							class="state-btn"
							class:selected={selectedState === state}
							on:click={() => handleStateSelection(state)}
							disabled={detectingState}
						>
							{state}
							{#if selectedState === state}
								<span class="check-icon">✓</span>
							{/if}
						</button>
					{/each}
				</div>

				<div class="step-actions">
					<button class="btn btn-secondary" on:click={previousStep}>
						← Back
					</button>
					<button
						class="btn btn-primary"
						on:click={nextStep}
						disabled={!selectedState}
					>
						Continue →
					</button>
				</div>
			</div>
		{:else if step === 3}
			<div class="step-content">
				<h2 class="step-title">🗣️ Choose Your Dialect</h2>
				<p class="step-description">
					Pick the dialect most teachers and students use. We will use it for the AI voice.
				</p>

				<div class="dialects-list">
					{#each availableDialects as dialect}
						<button
							class="dialect-option"
							class:selected={selectedDialect === dialect}
							on:click={() => selectedDialect = dialect}
						>
							<div class="option-content">
								<div class="option-title">{dialect}</div>
							</div>
							{#if selectedDialect === dialect}
								<div class="check-icon">✓</div>
							{/if}
						</button>
					{/each}
				</div>

				<div class="info-box">
					<strong>💡 Reminder:</strong> You can always adjust language or dialect later in Settings.
				</div>

				<div class="step-actions">
					<button class="btn btn-secondary" on:click={previousStep}>
						← Back
					</button>
					<button
						class="btn btn-primary"
						on:click={finishSetup}
						disabled={availableDialects.length > 0 && !selectedDialect}
					>
						Finish Setup ✓
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		z-index: 1000;
		animation: fade-in 0.3s;
	}

	.setup-modal {
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		background: white;
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: slide-up 0.3s ease-out;
	}

	.progress-dots {
		display: flex;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.dot {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #e5e7eb;
		color: #9ca3af;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 14px;
		transition: all 0.3s;
	}

	.dot.active {
		background: var(--primary);
		color: white;
	}

	.dot.completed {
		background: #10b981;
		color: white;
	}

	.step-content {
		padding: var(--space-xl);
		overflow-y: auto;
		flex: 1;
	}

	.welcome-icon {
		font-size: 5rem;
		text-align: center;
		margin-bottom: var(--space-lg);
	}

	.step-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-sm);
	}

	.step-title {
		font-size: var(--font-xl);
		font-weight: 700;
		margin-bottom: var(--space-md);
		color: var(--text);
	}

	.step-description {
		color: var(--text-secondary);
		margin-bottom: var(--space-lg);
		line-height: 1.6;
	}

	.skip-link {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 0.9rem;
		cursor: pointer;
		text-decoration: underline;
		padding: 4px 8px;
		transition: color 0.2s;
	}

	.skip-link:hover {
		color: var(--primary);
	}

	.language-grid {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.language-option {
		position: relative;
		padding: var(--space-lg);
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: var(--radius-lg);
		text-align: left;
		transition: all 0.2s;
		cursor: pointer;
	}

	.language-option:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.language-option.selected {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.05);
	}

	.language-label {
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--text);
		margin-bottom: 6px;
	}

	.language-subtitle {
		font-size: 0.95rem;
		color: var(--text-secondary);
	}

	.language-option .check-icon {
		position: absolute;
		top: 12px;
		right: 12px;
		font-size: 0.9rem;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--primary);
		color: white;
		box-shadow: 0 4px 8px rgba(79, 70, 229, 0.2);
	}

	.benefits-list {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-xl) 0;
	}

	.benefits-list li {
		padding: var(--space-md);
		background: #f9fafb;
		border-radius: var(--radius-md);
		margin-bottom: var(--space-sm);
		font-size: 15px;
		color: var(--text);
	}

	.location-option,
	.dialect-option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: var(--radius-md);
		text-align: left;
		transition: all 0.2s;
		margin-bottom: var(--space-sm);
		cursor: pointer;
	}

	.location-option.auto-detect {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border-color: #bae6fd;
	}

	.location-option:hover,
	.dialect-option:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.location-option.selected,
	.dialect-option.selected {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.05);
	}

	.option-icon {
		font-size: 2rem;
	}

	.option-content {
		flex: 1;
	}

	.option-title {
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.25rem;
	}

	.option-desc {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.check-icon {
		font-size: 1.5rem;
		color: var(--primary);
		font-weight: bold;
	}

	.divider {
		text-align: center;
		margin: var(--space-lg) 0;
		position: relative;
	}

	.divider::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: #e5e7eb;
	}

	.divider span {
		position: relative;
		background: white;
		padding: 0 var(--space-md);
		color: var(--text-secondary);
		font-size: 13px;
	}

	.states-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-sm);
		max-height: 300px;
		overflow-y: auto;
		margin-bottom: var(--space-lg);
		padding: var(--space-xs);
	}

	.state-btn {
		padding: var(--space-md);
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: var(--radius-md);
		font-size: 14px;
		color: var(--text);
		transition: all 0.2s;
		cursor: pointer;
		position: relative;
	}

	.state-btn:hover {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.05);
	}

	.state-btn.selected {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.1);
		font-weight: 600;
	}

	.state-btn .check-icon {
		position: absolute;
		top: 6px;
		right: 6px;
		font-size: 14px;
	}

	.detection-status {
		padding: var(--space-md);
		background: #e0f2fe;
		border: 2px solid #0ea5e9;
		border-radius: var(--radius-md);
		font-size: 14px;
		color: #0c4a6e;
		margin-bottom: var(--space-md);
		text-align: center;
		font-weight: 500;
		animation: slide-down 0.3s ease-out;
	}

	.detection-status.success {
		background: #d1fae5;
		border-color: #10b981;
		color: #065f46;
	}

	@keyframes slide-down {
		from {
			transform: translateY(-10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.dialects-list {
		margin-bottom: var(--space-lg);
	}

	.info-box {
		padding: var(--space-md);
		background: #fef3c7;
		border: 2px solid #fbbf24;
		border-radius: var(--radius-md);
		font-size: 14px;
		color: #92400e;
		margin-bottom: var(--space-lg);
	}

	.step-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-xl);
	}

	.step-actions .btn {
		flex: 1;
		padding: 14px;
		font-size: 15px;
		font-weight: 600;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(30px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (min-width: 768px) {
		.states-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
