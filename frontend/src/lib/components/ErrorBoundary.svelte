<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	let hasError = false;
	let errorMessage = "";
	let errorStack = "";

	function handleError(event: any) {
		console.error("Error boundary caught:", event.error);
		hasError = true;
		errorMessage = event.error?.message || "An unexpected error occurred";
		errorStack = event.error?.stack || "";
		event.preventDefault();
	}

	onMount(() => {
		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", (event) => {
			handleError({ error: event.reason });
		});
	});

	onDestroy(() => {
		window.removeEventListener("error", handleError);
	});

	function reload() {
		window.location.reload();
	}
</script>

{#if hasError}
	<div class="error-boundary">
		<div class="error-content">
			<div class="error-icon">⚠️</div>
			<h1>Oops! Something went wrong</h1>
			<p class="error-message">{errorMessage}</p>

			{#if errorStack}
				<details class="error-details">
					<summary>Technical Details</summary>
					<pre>{errorStack}</pre>
				</details>
			{/if}

			<div class="error-actions">
				<button class="btn btn-primary" on:click={reload}>
					Reload Page
				</button>
				<button
					class="btn btn-secondary"
					on:click={() => (hasError = false)}
				>
					Try Again
				</button>
			</div>
		</div>
	</div>
{:else}
	<slot />
{/if}

<style>
	.error-boundary {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		z-index: 10000;
	}

	.error-content {
		background: white;
		border-radius: 20px;
		padding: 40px;
		max-width: 600px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.error-icon {
		font-size: 64px;
		margin-bottom: 20px;
	}

	h1 {
		font-size: 24px;
		color: #1a202c;
		margin-bottom: 10px;
	}

	.error-message {
		color: #e53e3e;
		font-size: 16px;
		margin-bottom: 20px;
	}

	.error-details {
		margin: 20px 0;
		text-align: left;
	}

	.error-details summary {
		cursor: pointer;
		color: #4299e1;
		margin-bottom: 10px;
	}

	.error-details pre {
		background: #f7fafc;
		padding: 15px;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 12px;
		color: #4a5568;
	}

	.error-actions {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	.btn {
		padding: 12px 24px;
		border-radius: 10px;
		border: none;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
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
		background: #e2e8f0;
		color: #4a5568;
	}

	.btn-secondary:hover {
		background: #cbd5e0;
	}
</style>
