<script lang="ts">
	import { isOnline } from '$lib/stores/network';
	
	let showHelp = false;
	
	function toggleHelp() {
		showHelp = !showHelp;
	}
</script>

{#if showHelp}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="demo-overlay" role="button" tabindex="0" on:click={toggleHelp}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div class="demo-tips" role="dialog" aria-modal="true" on:click|stopPropagation>
			<button class="close-btn" on:click={toggleHelp} aria-label="Close demo guide">✕</button>
			
			<h2>🎯 Demo Guide</h2>
			
			<div class="tip">
				<h3>Step 1: Show Online Status</h3>
				<p>Point out the <strong>{$isOnline ? 'green "Online"' : 'red "Offline"'}</strong> indicator. Explain teacher is at home with internet.</p>
			</div>
			
			<div class="tip">
				<h3>Step 2: Create Lesson</h3>
				<p>Click "Create New" → Fill form (Solar System, Grade 5, Hindi, 2 min)</p>
			</div>
			
			<div class="tip">
				<h3>Step 3: Show Processing</h3>
				<p>Explain AI pipeline: Gemini → Imagen → TTS → FFmpeg</p>
			</div>
			
			<div class="tip">
				<h3>Step 4: Go to Library</h3>
				<p>Show new video saved locally (28MB, IndexedDB)</p>
			</div>
			
			<div class="tip">
				<h3>Step 5: ⚡ SWITCH TO OFFLINE</h3>
				<p><strong>Most Important!</strong> Click the Online button → changes to Offline</p>
			</div>
			
			<div class="tip">
				<h3>Step 6: Play Video</h3>
				<p>Click Play → Video works perfectly WITHOUT internet!</p>
			</div>
			
			<div class="tip">
				<h3>Step 7: Explain Impact</h3>
				<p>"This solves rural education - 70% of schools lack internet. Teachers create at home, students watch in class offline."</p>
			</div>
		</div>
	</div>
{/if}

<button class="demo-help-btn" on:click={toggleHelp}>
	<svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
		<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
	</svg>
</button>

<style>
	.demo-help-btn {
		position: fixed;
		bottom: 90px;
		right: 20px;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: #4F46E5;
		color: white;
		box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
		z-index: 999;
		transition: all 0.3s;
	}

	.demo-help-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 16px rgba(79, 70, 229, 0.5);
	}

	.demo-help-btn:active {
		transform: scale(0.95);
	}

	.demo-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
		animation: fade-in 0.2s;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.demo-tips {
		background: white;
		border-radius: 16px;
		padding: 32px;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slide-up 0.3s;
	}

	@keyframes slide-up {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.close-btn {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #F3F4F6;
		color: #6B7280;
		font-size: 20px;
		font-weight: bold;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: #E5E7EB;
	}

	.demo-tips h2 {
		font-size: 24px;
		font-weight: 700;
		margin-bottom: 24px;
		color: #111827;
	}

	.tip {
		margin-bottom: 20px;
		padding: 16px;
		background: #F9FAFB;
		border-radius: 8px;
		border-left: 4px solid #4F46E5;
	}

	.tip h3 {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 8px;
		color: #1F2937;
	}

	.tip p {
		font-size: 14px;
		line-height: 1.6;
		color: #4B5563;
		margin: 0;
	}

	.tip strong {
		color: #4F46E5;
	}

	@media (max-width: 640px) {
		.demo-tips {
			padding: 24px;
		}

		.demo-help-btn {
			bottom: 80px;
			right: 16px;
			width: 48px;
			height: 48px;
		}
	}
</style>
