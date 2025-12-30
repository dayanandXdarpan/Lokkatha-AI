<script lang="ts">
	import { page } from '$app/stores';
	
	export let error: any;
</script>

<svelte:head>
	<title>Error - Lokkatha AI</title>
</svelte:head>

<div class="error-page">
	<div class="error-container">
		<div class="error-icon">⚠️</div>
		<h1 class="error-title">Oops! Something went wrong</h1>
		
		{#if error?.message}
			<p class="error-message">{error.message}</p>
		{:else}
			<p class="error-message">An unexpected error occurred. Please try again.</p>
		{/if}
		
		{#if error?.status}
			<p class="error-code">Error code: {error.status}</p>
		{/if}
		
		<div class="error-actions">
			<a href="/" class="btn btn-primary">
				🏠 Go Home
			</a>
			<button class="btn btn-secondary" on:click={() => window.location.reload()}>
				🔄 Reload Page
			</button>
		</div>
		
		{#if import.meta.env.DEV}
			<details class="error-details">
				<summary>Technical Details (Dev Only)</summary>
				<pre>{JSON.stringify(error, null, 2)}</pre>
			</details>
		{/if}
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.error-container {
		background: white;
		border-radius: 20px;
		padding: var(--space-2xl);
		max-width: 600px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}
	
	.error-icon {
		font-size: 80px;
		margin-bottom: var(--space-lg);
		animation: shake 0.5s ease-in-out;
	}
	
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-10px); }
		75% { transform: translateX(10px); }
	}
	
	.error-title {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--text);
		margin-bottom: var(--space-md);
	}
	
	.error-message {
		font-size: var(--font-lg);
		color: var(--text-secondary);
		margin-bottom: var(--space-sm);
	}
	
	.error-code {
		font-size: var(--font-sm);
		color: var(--danger);
		font-weight: 600;
		margin-bottom: var(--space-xl);
	}
	
	.error-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.btn {
		padding: 12px 24px;
		border-radius: 10px;
		border: none;
		font-size: var(--font-base);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		display: inline-block;
	}
	
	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}
	
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
	}
	
	.btn-secondary {
		background: var(--bg-secondary);
		color: var(--text);
	}
	
	.btn-secondary:hover {
		background: var(--border);
	}
	
	.error-details {
		margin-top: var(--space-xl);
		text-align: left;
	}
	
	.error-details summary {
		cursor: pointer;
		color: var(--primary);
		font-weight: 600;
		margin-bottom: var(--space-md);
	}
	
	.error-details pre {
		background: var(--bg-secondary);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		overflow-x: auto;
		font-size: var(--font-sm);
		color: var(--text-secondary);
		text-align: left;
	}
	
	@media (max-width: 640px) {
		.error-container {
			padding: var(--space-xl);
		}
		
		.error-actions {
			flex-direction: column;
		}
		
		.btn {
			width: 100%;
		}
	}
</style>
