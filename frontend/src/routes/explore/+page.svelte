<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { slide } from "svelte/transition";
  import { t } from "$lib/i18n";
  import ShareButton from "$lib/components/ShareButton.svelte";

  interface VideoMetadata {
    jobId: string;
    videoUrl: string;
    thumbnailUrl?: string;
    title: string;
    topic: string;
    gradeLevel: string;
    language: string;
    duration: number;
    quality: "low" | "medium" | "high";
    isPublic: boolean;
    createdBy?: string;
    createdAt: string;
    views: number;
    likes: number;
    shareCount: number;
    description?: string;
    subject?: string;
  }

  interface ExploreResponse {
    videos: VideoMetadata[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }

  // State
  let videos: VideoMetadata[] = [];
  let loading = true;
  let error: string | null = null;
  let page = 1;
  let hasMore = true;
  let total = 0;

  // Filter & Sort state
  let searchQuery = "";
  let selectedGrade = "";
  let selectedLanguage = "";
  let selectedSubject = "";
  let selectedQuality = "";
  let sortBy: "newest" | "popular" | "likes" = "newest";
  let showFilters = false;
  let downloadedVideos: Set<string> = new Set();

  // Options
  const grades = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  const languages = [
    "English",
    "Hindi",
    "Marathi",
    "Tamil",
    "Telugu",
    "Kannada",
  ];
  const subjects = [
    "Math",
    "Science",
    "History",
    "Geography",
    "Language",
    "Arts",
  ];
  const qualities = ["low", "medium", "high"];
  const sortOptions = [
    { value: "newest", label: "🆕 New Videos" },
    { value: "popular", label: "🔥 Popular" },
    { value: "likes", label: "❤️ Most Liked" },
  ];

  // Generate smart titles (4 words)
  function generateSmartTitle(
    topic: string,
    gradeLevel: string,
    language: string,
  ): string {
    // Extract key words from topic
    const words = topic.toLowerCase().split(/\s+/);

    // Common educational patterns
    const patterns = {
      story: ["Story", "Tale", "Lesson", "Learning"],
      science: ["Science", "Concept", "Explained", "Easy"],
      math: ["Math", "Problem", "Solved", "Simple"],
      history: ["History", "Events", "Learn", "Facts"],
    };

    // Detect topic type
    let category = "general";
    if (words.some((w) => ["story", "tale", "kahani"].includes(w)))
      category = "story";
    else if (words.some((w) => ["science", "vigyan"].includes(w)))
      category = "science";
    else if (words.some((w) => ["math", "ganit"].includes(w)))
      category = "math";
    else if (words.some((w) => ["history", "itihas"].includes(w)))
      category = "history";

    // Generate title based on language
    if (language === "Hindi") {
      const hindiPatterns: Record<string, string[]> = {
        story: ["कहानी", "पाठ", "सीख", "शिक्षा"],
        science: ["विज्ञान", "अवधारणा", "समझें", "आसान"],
        math: ["गणित", "सवाल", "हल", "सरल"],
        history: ["इतिहास", "घटना", "सीखें", "जानें"],
        general: ["पाठ", "सीखें", "समझें", "जानें"],
      };
      const wordSet = hindiPatterns[category] || hindiPatterns.general;
      return wordSet.slice(0, 4).join(" ");
    }

    // English title generation
    const titleWords: string[] = [];

    // Add grade if appropriate
    if (parseInt(gradeLevel) <= 5) {
      titleWords.push("Kids");
    } else if (parseInt(gradeLevel) >= 9) {
      titleWords.push("Advanced");
    }

    // Add main topic word (capitalize first significant word)
    const mainWord = words.find((w) => w.length > 3) || words[0] || "Lesson";
    titleWords.push(mainWord.charAt(0).toUpperCase() + mainWord.slice(1));

    // Add context words
    const contextWords = patterns[category as keyof typeof patterns] || [
      "Learning",
      "Guide",
      "Tutorial",
      "Lesson",
    ];
    titleWords.push(...contextWords.slice(0, 4 - titleWords.length));

    return titleWords.slice(0, 4).join(" ");
  }

  async function loadVideos(reset = false) {
    try {
      loading = true;
      if (reset) {
        page = 1;
        videos = [];
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "12",
        sortBy,
        order: "desc",
      });

      if (searchQuery) params.append("search", searchQuery);
      if (selectedGrade) params.append("gradeLevel", selectedGrade);
      if (selectedLanguage) params.append("language", selectedLanguage);
      if (selectedSubject) params.append("subject", selectedSubject);
      if (selectedQuality) params.append("quality", selectedQuality);

      const response = await fetch(`/api/videos/explore?${params}`);
      const data: { success: boolean; data: ExploreResponse } =
        await response.json();

      if (data.success) {
        const videosWithTitles = data.data.videos.map((v) => ({
          ...v,
          title:
            v.title || generateSmartTitle(v.topic, v.gradeLevel, v.language),
        }));

        if (reset) {
          videos = videosWithTitles;
        } else {
          videos = [...videos, ...videosWithTitles];
        }
        hasMore = data.data.hasMore;
        total = data.data.total;
      }
    } catch (err) {
      error = "Failed to load videos. Please try again.";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Download video
  async function downloadVideo(video: VideoMetadata, event: Event) {
    event.stopPropagation();
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title.replace(/\s+/g, "_")}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Mark as downloaded
      downloadedVideos.add(video.jobId);
      downloadedVideos = downloadedVideos; // Trigger reactivity
      localStorage.setItem(
        "downloadedVideos",
        JSON.stringify([...downloadedVideos]),
      );
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download video. Please try again.");
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatViews(views: number): string {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function handleSearch() {
    loadVideos(true);
  }

  function handleFilterChange() {
    loadVideos(true);
  }

  function toggleFilters() {
    showFilters = !showFilters;
  }

  function loadMore() {
    page++;
    loadVideos();
  }

  function playVideo(video: VideoMetadata) {
    goto(`/lesson/${video.jobId}`);
  }

  onMount(() => {
    // Load downloaded videos from localStorage
    const saved = localStorage.getItem("downloadedVideos");
    if (saved) {
      downloadedVideos = new Set(JSON.parse(saved));
    }
    loadVideos(true);
  });
</script>

<svelte:head>
  <title>Explore Videos - LokKatha AI</title>
</svelte:head>

<div class="explore-page">
  <!-- Compact Header -->
  <div class="compact-header">
    <button
      class="icon-button back-btn"
      on:click={() => goto("/")}
      title="Back to Home"
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
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>

    <div class="header-title">
      <h1>🎬 Explore Educational Videos</h1>
      <p class="subtitle">Discover high-quality content</p>
    </div>

    <!-- Downloaded Videos Indicator -->
    {#if downloadedVideos.size > 0}
      <button
        class="icon-button downloaded-indicator"
        title="{downloadedVideos.size} videos downloaded"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"
          />
        </svg>
        <span class="badge">{downloadedVideos.size}</span>
      </button>
    {/if}
  </div>

  <!-- Compact Search & Filter Bar -->
  <div class="search-filter-bar">
    <div class="search-wrapper">
      <svg
        class="search-icon"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder={$t("exploreSearchPlaceholder")}
        bind:value={searchQuery}
        on:input={handleSearch}
        class="search-input"
      />
    </div>

    <button
      class="filter-toggle-btn {showFilters ? 'active' : ''}"
      on:click={toggleFilters}
      title="Toggle Filters"
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
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
      <span>Filters</span>
      {#if selectedGrade || selectedLanguage || selectedSubject || selectedQuality}
        <span class="active-filters-badge">
          {[
            selectedGrade,
            selectedLanguage,
            selectedSubject,
            selectedQuality,
          ].filter(Boolean).length}
        </span>
      {/if}
    </button>
  </div>

  <!-- Collapsible Filters -->
  {#if showFilters}
    <div class="filters-panel" transition:slide>
      <div class="filters-grid">
        <select
          bind:value={selectedGrade}
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="">All Grades</option>
          {#each grades as grade}
            <option value={grade}>Grade {grade}</option>
          {/each}
        </select>

        <select
          bind:value={selectedLanguage}
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="">All Languages</option>
          {#each languages as language}
            <option value={language}>{language}</option>
          {/each}
        </select>

        <select
          bind:value={selectedSubject}
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="">All Subjects</option>
          {#each subjects as subject}
            <option value={subject}>{subject}</option>
          {/each}
        </select>

        <select
          bind:value={selectedQuality}
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="">All Qualities</option>
          {#each qualities as quality}
            <option value={quality}>{quality.toUpperCase()}</option>
          {/each}
        </select>

        <select
          bind:value={sortBy}
          on:change={handleFilterChange}
          class="filter-select sort-select"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
  {/if}

  <!-- Results Count -->
  {#if !loading && total > 0}
    <div class="results-info">
      <span class="results-count">{total} videos found</span>
    </div>
  {/if}

  <!-- Video Grid -->
  {#if error}
    <div class="error-message">
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
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p>{error}</p>
    </div>
  {:else if loading && videos.length === 0}
    <div class="loading-grid">
      {#each Array(12) as _, i}
        <div class="skeleton-card" />
      {/each}
    </div>
  {:else if videos.length === 0}
    <div class="empty-state">
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
          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
        />
      </svg>
      <h3>No videos found</h3>
      <p>Try adjusting your search or filters</p>
    </div>
  {:else}
    <div class="video-grid">
      {#each videos as video (video.jobId)}
        <div class="video-card">
          <!-- Thumbnail -->
          <div
            class="thumbnail"
            on:click={() => playVideo(video)}
            on:keypress={(e) => e.key === "Enter" && playVideo(video)}
            role="button"
            tabindex="0"
          >
            {#if video.thumbnailUrl}
              <img src={video.thumbnailUrl} alt={video.title} />
            {:else}
              <div class="thumbnail-placeholder">
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
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            {/if}

            <!-- Play button overlay -->
            <div class="play-overlay">
              <div class="play-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            <!-- Duration badge -->
            <div class="duration-badge">{formatDuration(video.duration)}</div>

            <!-- Quality badge -->
            <div class="quality-badge quality-{video.quality}">
              {video.quality.toUpperCase()}
            </div>

            <!-- Downloaded indicator -->
            {#if downloadedVideos.has(video.jobId)}
              <div class="downloaded-badge" title="Downloaded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            {/if}
          </div>

          <!-- Content -->
          <div class="card-content">
            <h3 class="video-title">{video.title}</h3>
            <p class="video-topic">{video.topic}</p>

            <div class="video-meta">
              <span class="meta-item">
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {formatViews(video.views)}
              </span>

              <span class="meta-item">
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {video.likes}
              </span>
            </div>

            <div class="video-tags">
              <span class="tag tag-grade">Grade {video.gradeLevel}</span>
              <span class="tag tag-language">{video.language}</span>
              {#if video.subject}
                <span class="tag tag-subject">{video.subject}</span>
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="card-actions">
              <button
                class="action-btn download-btn"
                on:click={(e) => downloadVideo(video, e)}
                title="Download for offline"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>

              <div
                class="share-btn-wrapper"
                on:click={(e) => e.stopPropagation()}
              >
                <ShareButton
                  videoId={video.jobId}
                  url={`${window.location.origin}/lesson/${video.jobId}`}
                  title={video.title}
                  description={video.topic}
                  compact={true}
                />
              </div>
            </div>

            <div class="video-footer">
              <span class="created-date">{formatDate(video.createdAt)}</span>
              {#if video.createdBy}
                <span class="creator">by {video.createdBy}</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Load More -->
    {#if hasMore}
      <div class="load-more">
        <button on:click={loadMore} disabled={loading} class="load-more-btn">
          {loading ? "Loading..." : "Load More Videos"}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .explore-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0;
  }

  /* Compact Header */
  .compact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    margin-bottom: 1rem;
  }

  .icon-button {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    flex-shrink: 0;
  }

  .back-btn {
    background: white;
    border: 2px solid #e5e7eb;
    color: #374151;
  }

  .back-btn:hover {
    background: #f9fafb;
    border-color: #667eea;
    color: #667eea;
    transform: translateX(-2px);
  }

  .back-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .header-title {
    flex: 1;
    text-align: center;
    padding: 0 1rem;
  }

  .header-title h1 {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 0.25rem 0;
  }

  .subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .downloaded-indicator {
    background: #f0fdf4;
    border: 2px solid #10b981;
    color: #10b981;
  }

  .downloaded-indicator:hover {
    background: #dcfce7;
    transform: scale(1.05);
  }

  .downloaded-indicator svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    min-width: 20px;
    text-align: center;
  }

  /* Search & Filter Bar */
  .search-filter-bar {
    display: flex;
    gap: 1rem;
    padding: 0 2rem 1rem;
    margin-bottom: 0.5rem;
  }

  .search-wrapper {
    flex: 1;
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: #9ca3af;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    font-size: 1rem;
    transition: all 0.2s;
    background: white;
  }

  .search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .filter-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .filter-toggle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
  }

  .filter-toggle-btn.active {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
  }

  .filter-toggle-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .active-filters-badge {
    background: #ef4444;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    min-width: 18px;
    text-align: center;
  }

  /* Collapsible Filters Panel */
  .filters-panel {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem 2rem;
    margin: 0 2rem 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }

  .sort-select {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    font-weight: 600;
  }

  .results-count {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 2rem 1rem;
  }

  /* Video Grid */
  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    padding: 0 2rem 2rem;
  }

  .video-card {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
  }

  .video-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .thumbnail {
    position: relative;
    width: 100%;
    padding-top: 56.25%; /* 16:9 aspect ratio */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    overflow: hidden;
    cursor: pointer;
  }

  .thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thumbnail-placeholder svg {
    width: 4rem;
    height: 4rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .thumbnail:hover .play-overlay {
    opacity: 1;
  }

  .play-button {
    width: 4rem;
    height: 4rem;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s;
  }

  .thumbnail:hover .play-button {
    transform: scale(1.1);
  }

  .play-button svg {
    width: 2rem;
    height: 2rem;
    color: #667eea;
    margin-left: 0.25rem;
  }

  .duration-badge {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .quality-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .quality-low {
    background: #10b981;
    color: white;
  }

  .quality-medium {
    background: #f59e0b;
    color: white;
  }

  .quality-high {
    background: #ef4444;
    color: white;
  }

  /* Downloaded Badge */
  .downloaded-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    background: #10b981;
    color: white;
    padding: 0.375rem 0.625rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .downloaded-badge svg {
    width: 1rem;
    height: 1rem;
  }

  /* Card Content */
  .card-content {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .video-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .video-topic {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .video-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .meta-item svg {
    width: 1rem;
    height: 1rem;
  }

  .video-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tag {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tag-grade {
    background: #dbeafe;
    color: #1e40af;
  }

  .tag-language {
    background: #fef3c7;
    color: #92400e;
  }

  .tag-subject {
    background: #e0e7ff;
    color: #3730a3;
  }

  .video-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #9ca3af;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
    margin-top: auto;
  }

  .created-date {
    font-weight: 500;
  }

  .creator {
    font-style: italic;
  }

  /* Card Actions */
  .card-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    border-color: #667eea;
    background: #f9fafb;
    transform: translateY(-1px);
  }

  .action-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .download-btn {
    color: #10b981;
  }

  .download-btn:hover {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .share-btn-wrapper {
    flex: 1;
  }

  /* Loading States */
  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    padding: 0 2rem 2rem;
  }

  .skeleton-card {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 1rem;
    height: 400px;
  }

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* Empty & Error States */
  .empty-state,
  .error-message {
    text-align: center;
    padding: 4rem 2rem;
  }

  .empty-state svg,
  .error-message svg {
    width: 4rem;
    height: 4rem;
    color: #9ca3af;
    margin: 0 auto 1rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .empty-state p,
  .error-message p {
    color: #6b7280;
  }

  .error-message {
    background: #fef2f2;
    border-radius: 1rem;
    margin: 0 2rem;
  }

  .error-message svg {
    color: #ef4444;
  }

  /* Load More */
  .load-more {
    text-align: center;
    padding: 2rem;
  }

  .load-more-btn {
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
  }

  .load-more-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(102, 126, 234, 0.4);
  }

  .load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .video-grid,
    .loading-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .explore-page {
      padding: 0;
    }

    .compact-header {
      padding: 1rem;
    }

    .header-title h1 {
      font-size: 1.5rem;
    }

    .subtitle {
      font-size: 0.8125rem;
    }

    .search-filter-bar {
      flex-direction: column;
      padding: 0 1rem 1rem;
    }

    .filter-toggle-btn {
      width: 100%;
      justify-content: center;
    }

    .filters-panel {
      margin: 0 1rem 1rem;
      padding: 1rem;
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .results-count {
      padding: 0.5rem 1rem 1rem;
    }

    .video-grid,
    .loading-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 0 1rem 1rem;
    }

    .card-actions {
      flex-direction: column;
    }

    .error-message {
      margin: 0 1rem;
    }
  }

  @media (max-width: 480px) {
    .icon-button {
      width: 40px;
      height: 40px;
    }

    .header-title h1 {
      font-size: 1.25rem;
    }

    .video-title {
      font-size: 1rem;
    }
  }
</style>
