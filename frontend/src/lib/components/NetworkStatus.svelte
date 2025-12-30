<script lang="ts">
	import { isOnline } from '$lib/stores/network';
	import { t } from '$i18n';
	
	function toggleNetwork() {
		isOnline.toggle();
	}
</script>

<button class="network-status" class:online={$isOnline} class:offline={!$isOnline} on:click={toggleNetwork}>
	<span class="status-dot"></span>
	<span class="status-text">
		{$isOnline ? $t('networkOnline') || 'Online' : $t('networkOffline') || 'Offline'}
	</span>
</button>

<style>
	.network-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 600;
		transition: all 0.3s ease;
		cursor: pointer;
		user-select: none;
	}

	.network-status.online {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		border: 2px solid rgba(16, 185, 129, 0.3);
	}

	.network-status.offline {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border: 2px solid rgba(239, 68, 68, 0.3);
	}

	.network-status:hover {
		transform: scale(1.05);
	}

	.network-status:active {
		transform: scale(0.95);
	}

	.status-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.network-status.online .status-dot {
		background: #10b981;
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
	}

	.network-status.offline .status-dot {
		background: #ef4444;
		box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
		animation: none;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.network-status {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		.status-dot {
			width: 8px;
			height: 8px;
		}
	}
</style>
