<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$i18n';
	import { createLesson, pollJobUntilComplete, downloadVideo, type JobStatus } from '$lib/api/client';
	import { saveLesson, type LessonData } from '$lib/db/storage';
	import { onMount } from 'svelte';
	
	// Wizard steps
	let currentStep = 1;
	const totalSteps = 4;
	
	// Form data
	let topic = '';
	let gradeLevel = '5';
	let language = 'English';
	let duration = 120; // 2 minutes default
	let quality: 'low' | 'medium' | 'high' = 'medium';
	let includeSubtitles = true;
	
	// Processing state
	let isProcessing = false;
	let jobId = '';
	let progress = 0;
	let currentProcessStep = '';
	let error = '';
	let isDownloading = false;
	let downloadProgress = 0;
	
	const grades = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
	const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati'];
	const durations = [
		{ value: 60, label: '1' },
		{ value: 120, label: '2' },
		{ value: 180, label: '3' },
		{ value: 300, label: '5' },
		{ value: 600, label: '10' }
	];

	// New fields for Indian Teacher Voice
	let dialect = '';
	let state = '';
	let accentPreference = 'child-friendly';

	const dialects: Record<string, string[]> = {
		'Hindi': ['Standard', 'Bhojpuri', 'Bundelkhandi', 'Haryanvi', 'Awadhi'],
		'Tamil': ['Standard', 'Madurai', 'Chennai', 'Kongu'],
		'Telugu': ['Standard', 'Telangana', 'Rayalaseema', 'Coastal'],
		'Kannada': ['Standard', 'Mysore', 'North Karnataka', 'Mangalore'],
		'Malayalam': ['Standard', 'Malabar', 'Travancore'],
		'Bengali': ['Standard', 'Kolkata', 'Bangal'],
		'Marathi': ['Standard', 'Puneri', 'Nagpuri', 'Kolhapuri'],
		'Gujarati': ['Standard', 'Kathiawari', 'Surti']
	};

	const indianStates = [
		'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
		'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
		'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
		'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
		'Uttarakhand', 'West Bengal'
	];
	
	$: estimatedSize = quality === 'low' ? 15 : quality === 'medium' ? 30 : 50;
	$: canProceed = currentStep === 1 ? topic.trim().length >= 3 : true;
	
	function nextStep() {
		if (canProceed && currentStep < totalSteps) {
			currentStep++;
		}
	}
	
	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}
	
	function goBack() {
		if (isProcessing) {
			return; // Don't allow back during processing
		}
		if (currentStep === 1) {
			goto('/');
		} else {
			prevStep();
		}
	}
	
	async function startCreation() {
		if (!topic.trim()) return;
		
		isProcessing = true;
		error = '';
		
		try {
			// Create lesson job
			jobId = await createLesson({
				topic: topic.trim(),
				gradeLevel,
				language,
				duration,
				useImages: true,
				includeSubtitles,
				dialect: dialect || undefined,
				state: state || undefined,
				accentPreference
			});
			
			// Poll for completion
			await pollJobUntilComplete(jobId, (status: JobStatus) => {
				progress = status.progress;
				currentProcessStep = status.currentStep || getProgressMessage(status.progress);
			});
			
			// Download the video
			isDownloading = true;
			currentProcessStep = $t('progressDownload');
			
			const videoBlob = await downloadVideo(jobId, (dlProgress) => {
				downloadProgress = dlProgress;
			});
			
			// Save to IndexedDB
			const lessonData: LessonData = {
				id: jobId,
				title: topic,
				subject: topic,
				gradeLevel,
				language,
				videoBlob,
				duration,
				fileSize: videoBlob.size,
				createdAt: new Date(),
				lastAccessedAt: new Date()
			};
			
			await saveLesson(lessonData);
			
			// Success! Go to lessons
			setTimeout(() => {
				goto('/lessons');
			}, 1000);
			
		} catch (err: any) {
			error = err.message || $t('errorGeneric');
			isProcessing = false;
		}
	}
	
	function getProgressMessage(prog: number): string {
		if (prog < 15) return $t('progressStep1');
		if (prog < 45) return $t('progressStep2');
		if (prog < 70) return $t('progressStep3');
		if (prog < 75) return $t('progressStep4');
		if (prog < 90) return $t('progressStep5');
		if (prog < 95) return $t('progressStep6');
		if (prog < 100) return $t('progressStep7');
		return $t('progressComplete');
	}
</script>

<svelte:head>
	<title>{$t('createTitle')} - {$t('appName')}</title>
</svelte:head>

<div class="create-page">
	<!-- Header -->
	<header class="header">
		<button class="back-btn" on:click={goBack} disabled={isProcessing} aria-label="Back">
			<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M19 12H5M12 19l-7-7 7-7"></path>
			</svg>
		</button>
		<h1 class="title">{$t('createTitle')}</h1>
		<div class="step-indicator">{currentStep}/{totalSteps}</div>
	</header>

	{#if !isProcessing}
		<!-- Step Content -->
		<main class="content">
			<!-- Step 1: Topic -->
			{#if currentStep === 1}
				<div class="step fade-in">
					<div class="step-icon">📚</div>
					<h2 class="step-title">{$t('createStep1')}</h2>
					
				<input
					type="text"
					bind:value={topic}
					placeholder={$t('createTopicPlaceholder')}
					class="input-large"
					maxlength="100"
				/>					<p class="hint text-muted">
						Example: Solar System, Fractions, Photosynthesis
					</p>
				</div>
			{/if}

			<!-- Step 2: Grade Level -->
			{#if currentStep === 2}
				<div class="step fade-in">
					<div class="step-icon">🎓</div>
					<h2 class="step-title">{$t('createStep2')}</h2>
					
					<div class="grade-grid">
						{#each grades as grade}
							<button
								class="grade-btn"
								class:active={gradeLevel === grade}
								on:click={() => gradeLevel = grade}
							>
								<div class="grade-number">{grade}</div>
								<div class="grade-label">{$t('createGrade', { grade })}</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Step 3: Language -->
			{#if currentStep === 3}
				<div class="step fade-in">
					<div class="step-icon">🗣️</div>
					<h2 class="step-title">{$t('createStep3')}</h2>
					
					<div class="language-list">
						{#each languages as lang}
							<button
								class="language-btn"
								class:active={language === lang}
								on:click={() => language = lang}
							>
								<div class="language-name">{lang}</div>
								<div class="check-icon">
									{#if language === lang}
										<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
										</svg>
									{/if}
								</div>
							</button>
						{/each}
					</div>

					<!-- Dialect & Voice Options -->
					<div class="voice-options fade-in" style="animation-delay: 0.1s; margin-top: var(--space-lg); border-top: 1px solid var(--border); padding-top: var(--space-lg);">
						<h3 class="options-title">Voice Customization</h3>
						
						<!-- Dialect Selection -->
						{#if dialects[language]}
							<div class="option-group">
								<label class="option-label">Dialect / Accent</label>
								<select bind:value={dialect} class="select-input">
									<option value="">Standard {language}</option>
									{#each dialects[language] as d}
										{#if d !== 'Standard'}
											<option value={d}>{d}</option>
										{/if}
									{/each}
								</select>
							</div>
						{/if}

						<!-- State Selection -->
						<div class="option-group">
							<label class="option-label">Region / State context</label>
							<select bind:value={state} class="select-input">
								<option value="">Select State (Optional)</option>
								{#each indianStates as s}
									<option value={s}>{s}</option>
								{/each}
							</select>
						</div>

						<!-- Teaching Style -->
						<div class="option-group">
							<label class="option-label">Teaching Style</label>
							<div class="style-toggles">
								<button 
									class="style-btn" 
									class:active={accentPreference === 'child-friendly'}
									on:click={() => accentPreference = 'child-friendly'}
								>
									<span class="style-icon">👶</span>
									<span class="style-text">Child Friendly</span>
								</button>
								<button 
									class="style-btn" 
									class:active={accentPreference === 'standard'}
									on:click={() => accentPreference = 'standard'}
								>
									<span class="style-icon">👩‍🏫</span>
									<span class="style-text">Standard</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 4: Duration & Options -->
			{#if currentStep === 4}
				<div class="step fade-in">
					<div class="step-icon">⏱️</div>
					<h2 class="step-title">{$t('createStep4')}</h2>
					
					<div class="duration-grid">
						{#each durations as dur}
							<button
								class="duration-btn"
								class:active={duration === dur.value}
								on:click={() => duration = dur.value}
							>
								<div class="duration-value">{dur.label}</div>
								<div class="duration-label">{$t('createDuration', { minutes: dur.label })}</div>
							</button>
						{/each}
					</div>
					
					<!-- Quality Options -->
					<div class="options-section">
						<h3 class="options-title">{$t('createQuality')}</h3>
						<div class="quality-options">
							<button
								class="quality-btn"
								class:active={quality === 'low'}
								on:click={() => quality = 'low'}
							>
								<span>📱</span>
								<span>{$t('createQualityLow')}</span>
							</button>
							<button
								class="quality-btn"
								class:active={quality === 'medium'}
								on:click={() => quality = 'medium'}
							>
								<span>📺</span>
								<span>{$t('createQualityMedium')}</span>
							</button>
							<button
								class="quality-btn"
								class:active={quality === 'high'}
								on:click={() => quality = 'high'}
							>
								<span>🎬</span>
								<span>{$t('createQualityHigh')}</span>
							</button>
						</div>
					</div>
					
					<!-- Subtitles Toggle -->
					<label class="toggle-option">
						<span>{$t('createSubtitles')}</span>
						<input type="checkbox" bind:checked={includeSubtitles} />
						<div class="toggle-switch"></div>
					</label>
					
					<div class="estimated-size text-muted">
						{$t('createEstimatedSize', { size: estimatedSize })}
					</div>
				</div>
			{/if}
		</main>

		<!-- Navigation Buttons -->
		<footer class="footer">
			{#if currentStep < totalSteps}
				<button 
					class="btn btn-primary btn-large btn-full"
					on:click={nextStep}
					disabled={!canProceed}
				>
					{$t('createNext')}
				</button>
			{:else}
				<button 
					class="btn btn-primary btn-large btn-full"
					on:click={startCreation}
					disabled={!canProceed}
				>
					🚀 {$t('createStart')}
				</button>
			{/if}
		</footer>
	{:else}
		<!-- Processing Screen -->
		<div class="processing-screen">
			<div class="processing-content">
				{#if !error}
					<div class="progress-circle">
						<svg width="120" height="120" viewBox="0 0 120 120">
							<circle
								cx="60"
								cy="60"
								r="54"
								fill="none"
								stroke="#E5E7EB"
								stroke-width="8"
							></circle>
							<circle
								cx="60"
								cy="60"
								r="54"
								fill="none"
								stroke="#4F46E5"
								stroke-width="8"
								stroke-dasharray="339.292"
								stroke-dashoffset={339.292 * (1 - (isDownloading ? downloadProgress : progress) / 100)}
								stroke-linecap="round"
								transform="rotate(-90 60 60)"
							></circle>
						</svg>
						<div class="progress-text">
							{isDownloading ? downloadProgress : progress}%
						</div>
					</div>
					
					<h2 class="processing-title">{$t('progressCreating')}</h2>
					<p class="processing-step">{currentProcessStep}</p>
					
					<!-- Detailed Progress Steps -->
					<div class="progress-steps">
						<div class="progress-step-item" class:completed={progress >= 15} class:active={progress > 0 && progress < 15}>
							<div class="step-icon-wrapper">
								{#if progress >= 15}
									<span class="step-checkmark">✓</span>
								{:else}
									<span class="step-number">1</span>
								{/if}
							</div>
							<div class="step-details">
								<div class="step-label">📝 Generating Script</div>
								<div class="step-description">AI creating educational content...</div>
							</div>
						</div>
						
						<div class="progress-step-item" class:completed={progress >= 45} class:active={progress >= 15 && progress < 45}>
							<div class="step-icon-wrapper">
								{#if progress >= 45}
									<span class="step-checkmark">✓</span>
								{:else}
									<span class="step-number">2</span>
								{/if}
							</div>
							<div class="step-details">
								<div class="step-label">🖼️ Finding Images</div>
								<div class="step-description">Searching perfect visuals...</div>
							</div>
						</div>
						
						<div class="progress-step-item" class:completed={progress >= 70} class:active={progress >= 45 && progress < 70}>
							<div class="step-icon-wrapper">
								{#if progress >= 70}
									<span class="step-checkmark">✓</span>
								{:else}
									<span class="step-number">3</span>
								{/if}
							</div>
							<div class="step-details">
								<div class="step-label">🎤 Creating Audio</div>
								<div class="step-description">Generating narration...</div>
							</div>
						</div>
						
						<div class="progress-step-item" class:completed={progress >= 100} class:active={progress >= 70 && progress < 100}>
							<div class="step-icon-wrapper">
								{#if progress >= 100}
									<span class="step-checkmark">✓</span>
								{:else}
									<span class="step-number">4</span>
								{/if}
							</div>
							<div class="step-details">
								<div class="step-label">🎬 Assembling Video</div>
								<div class="step-description">Putting it all together...</div>
							</div>
						</div>
					</div>
					
					<div class="processing-animation">
						<div class="dot"></div>
						<div class="dot"></div>
						<div class="dot"></div>
					</div>
				{:else}
					<div class="error-icon">❌</div>
					<h2 class="error-title">{$t('progressFailed')}</h2>
					<p class="error-message">{error}</p>
					<button class="btn btn-primary btn-large" on:click={() => { isProcessing = false; error = ''; }}>
						{$t('progressRetry')}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.create-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-secondary);
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

	.back-btn:active:not(:disabled) {
		background: var(--bg-secondary);
	}

	.back-btn:disabled {
		opacity: 0.3;
	}

	.title {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text);
	}

	.step-indicator {
		width: 40px;
		text-align: center;
		font-weight: 600;
		color: var(--primary);
	}

	.content {
		flex: 1;
		padding: var(--space-xl) var(--space-md);
		overflow-y: auto;
	}

	.step {
		max-width: 500px;
		margin: 0 auto;
	}

	.step-icon {
		font-size: 4rem;
		text-align: center;
		margin-bottom: var(--space-md);
	}

	.step-title {
		font-size: var(--font-xl);
		font-weight: 700;
		text-align: center;
		margin-bottom: var(--space-xl);
		color: var(--text);
	}

	.input-large {
		width: 100%;
		padding: var(--space-md);
		font-size: var(--font-lg);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		text-align: center;
		transition: all 0.2s;
	}

	.input-large:focus {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
	}

	.hint {
		text-align: center;
		margin-top: var(--space-md);
		font-size: var(--font-sm);
	}

	.grade-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-sm);
	}

	.grade-btn {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: white;
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		transition: all 0.2s;
	}

	.grade-btn.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.grade-btn:active {
		transform: scale(0.95);
	}

	.grade-number {
		font-size: var(--font-xl);
		font-weight: 700;
	}

	.grade-label {
		font-size: 0.75rem;
	}

	.language-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.language-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		background: white;
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		text-align: left;
		transition: all 0.2s;
		min-height: var(--touch-target);
	}

	.language-btn.active {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.05);
	}

	.language-btn:active {
		transform: scale(0.98);
	}

	.language-name {
		font-size: var(--font-lg);
		font-weight: 500;
	}

	.check-icon {
		color: var(--primary);
	}

	.duration-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-sm);
		margin-bottom: var(--space-xl);
	}

	.duration-btn {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: white;
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		transition: all 0.2s;
	}

	.duration-btn.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.duration-btn:active {
		transform: scale(0.95);
	}

	.duration-value {
		font-size: 2rem;
		font-weight: 700;
	}

	.duration-label {
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.options-section {
		margin-bottom: var(--space-lg);
	}

	.options-title {
		font-size: var(--font-base);
		font-weight: 600;
		margin-bottom: var(--space-sm);
		color: var(--text);
	}

	.quality-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xs);
	}

	.quality-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: var(--space-sm);
		background: white;
		border: 2px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		transition: all 0.2s;
	}

	.quality-btn.active {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.05);
	}

	.quality-btn:active {
		transform: scale(0.95);
	}

	.toggle-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		background: white;
		border-radius: var(--radius-md);
		margin-bottom: var(--space-md);
		cursor: pointer;
	}

	.toggle-option input[type="checkbox"] {
		display: none;
	}

	.toggle-switch {
		position: relative;
		width: 48px;
		height: 28px;
		background: var(--border);
		border-radius: 14px;
		transition: all 0.2s;
	}

	.toggle-switch::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 24px;
		height: 24px;
		background: white;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.toggle-option input:checked + .toggle-switch {
		background: var(--primary);
	}

	.toggle-option input:checked + .toggle-switch::before {
		transform: translateX(20px);
	}

	.estimated-size {
		text-align: center;
		font-size: var(--font-sm);
	}

	.footer {
		padding: var(--space-md);
		background: white;
		border-top: 1px solid var(--border);
	}

	.processing-screen {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl) var(--space-md);
	}

	.processing-content {
		text-align: center;
		max-width: 400px;
	}

	.progress-circle {
		position: relative;
		display: inline-block;
		margin-bottom: var(--space-xl);
	}

	.progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--primary);
	}

	.processing-title {
		font-size: var(--font-xl);
		font-weight: 700;
		margin-bottom: var(--space-sm);
		color: var(--text);
	}

	.processing-step {
		color: var(--text-secondary);
		margin-bottom: var(--space-lg);
	}

	.progress-steps {
		margin: var(--space-xl) 0;
		text-align: left;
	}

	.progress-step-item {
		display: flex;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
		opacity: 0.4;
		transition: all 0.3s ease;
	}

	.progress-step-item.active {
		opacity: 1;
		animation: pulse 2s ease-in-out infinite;
	}

	.progress-step-item.completed {
		opacity: 1;
	}

	.step-icon-wrapper {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--bg-secondary);
		border: 2px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.progress-step-item.active .step-icon-wrapper {
		border-color: var(--primary);
		background: rgba(79, 70, 229, 0.1);
		color: var(--primary);
	}

	.progress-step-item.completed .step-icon-wrapper {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.step-checkmark {
		font-size: 20px;
	}

	.step-number {
		font-size: 18px;
	}

	.step-details {
		flex: 1;
	}

	.step-label {
		font-weight: 600;
		color: var(--text);
		margin-bottom: 4px;
	}

	.step-description {
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.progress-step-item.active .step-label {
		color: var(--primary);
	}

	/* Voice Options Styles */
	.voice-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.option-label {
		font-size: var(--font-sm);
		font-weight: 500;
		color: var(--text-secondary);
	}

	.select-input {
		width: 100%;
		padding: var(--space-md);
		background: white;
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		font-size: var(--font-base);
		color: var(--text);
		outline: none;
		transition: all 0.2s;
	}

	.select-input:focus {
		border-color: var(--primary);
	}

	.style-toggles {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.style-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: var(--space-md);
		background: white;
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		transition: all 0.2s;
	}

	.style-btn.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.style-btn:active {
		transform: scale(0.98);
	}

	.style-icon {
		font-size: 1.25rem;
	}

	.style-text {
		font-weight: 500;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.02); }
	}

	.processing-animation {
		display: flex;
		gap: var(--space-xs);
		justify-content: center;
	}

	.dot {
		width: 12px;
		height: 12px;
		background: var(--primary);
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.dot:nth-child(1) { animation-delay: -0.32s; }
	.dot:nth-child(2) { animation-delay: -0.16s; }

	@keyframes bounce {
		0%, 80%, 100% { transform: scale(0); }
		40% { transform: scale(1); }
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: var(--space-md);
	}

	.error-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--danger);
		margin-bottom: var(--space-sm);
	}

	.error-message {
		color: var(--text-secondary);
		margin-bottom: var(--space-xl);
	}

	@media (min-width: 768px) {
		.content {
			padding: var(--space-xl);
		}
	}
</style>
