<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let videoId: string;
  export let title: string;
  export let description: string = "";
  export let compact: boolean = false;
  export let isPublic: boolean = false;
  export let url: string = "";

  const dispatch = createEventDispatcher();

  let showShareMenu = false;
  let copySuccess = false;
  let publishingToExplore = false;

  const shareUrl = url || `${window.location.origin}/lesson/${videoId}`;

  function toggleShareMenu() {
    showShareMenu = !showShareMenu;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copySuccess = true;

      // Track share
      await fetch(`/api/videos/${videoId}/share`, { method: "POST" });

      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Check out this educational video: ${title}\n${shareUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");

    // Track share
    fetch(`/api/videos/${videoId}/share`, { method: "POST" });
  }

  function shareEmail() {
    const subject = encodeURIComponent(`Educational Video: ${title}`);
    const body = encodeURIComponent(
      `I thought you might be interested in this educational video:\n\n${title}\n\n${shareUrl}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;

    // Track share
    fetch(`/api/videos/${videoId}/share`, { method: "POST" });
  }

  async function togglePublishToExplore() {
    try {
      publishingToExplore = true;
      const newStatus = !isPublic;

      const response = await fetch(`/api/videos/${videoId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        isPublic = newStatus;
        dispatch("publishStatusChanged", { isPublic: newStatus });

        // Show success message
        alert(
          newStatus
            ? "Video published to Explore! Other teachers can now discover your content."
            : "Video removed from Explore. It's now private.",
        );
      }
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
      alert("Failed to update publish status. Please try again.");
    } finally {
      publishingToExplore = false;
    }
  }

  // Close menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".share-component")) {
      showShareMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="share-component">
  <button
    class="share-btn"
    on:click|stopPropagation={toggleShareMenu}
    title="Share video"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
    <span>Share</span>
  </button>

  {#if showShareMenu}
    <div class="share-menu" on:click|stopPropagation>
      <h4>Share this video</h4>

      <button class="share-option" on:click={copyLink}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <span>{copySuccess ? "Link Copied!" : "Copy Link"}</span>
        {#if copySuccess}
          <svg
            class="check-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        {/if}
      </button>

      <button class="share-option" on:click={shareWhatsApp}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
          />
        </svg>
        <span>WhatsApp</span>
      </button>

      <button class="share-option" on:click={shareEmail}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span>Email</span>
      </button>

      <div class="divider" />

      <button
        class="share-option publish-option"
        class:published={isPublic}
        on:click={togglePublishToExplore}
        disabled={publishingToExplore}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {#if isPublic}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          {:else}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          {/if}
        </svg>
        <span>
          {#if publishingToExplore}
            Updating...
          {:else if isPublic}
            Published to Explore ✓
          {:else}
            Publish to Explore
          {/if}
        </span>
      </button>

      {#if !isPublic}
        <p class="publish-hint">
          Share your video with other teachers on the Explore page
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .share-component {
    position: relative;
    display: inline-block;
  }

  .share-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .share-btn:hover {
    background: #f9fafb;
    border-color: #667eea;
    color: #667eea;
  }

  .share-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .share-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 280px;
    background: white;
    border-radius: 0.75rem;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    padding: 1rem;
    z-index: 50;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .share-menu h4 {
    font-size: 0.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1rem;
  }

  .share-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .share-option:hover {
    background: #f3f4f6;
  }

  .share-option svg {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .share-option:nth-child(3) svg {
    color: #25d366; /* WhatsApp green */
  }

  .check-icon {
    margin-left: auto;
    color: #10b981;
  }

  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0.5rem 0;
  }

  .publish-option {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .publish-option:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
  }

  .publish-option.published {
    background: #10b981;
  }

  .publish-option:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .publish-hint {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0.5rem 0 0;
    text-align: center;
    line-height: 1.4;
  }

  @media (max-width: 640px) {
    .share-menu {
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }
  }
</style>
