const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const SUPADATA_BASE_URL = "https://api.supadata.ai/v1";

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/i;

const isValidYouTubeUrl = (url) => YOUTUBE_URL_REGEX.test((url || "").trim());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const supadataFetch = async (url, retries = 3) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { "x-api-key": SUPADATA_API_KEY },
    });

    if (res.status === 429 && attempt < retries) {
      const waitMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
      console.log(`⏳ Supadata 429, retrying in ${waitMs / 1000}s... (${retries - attempt} left)`);
      await sleep(waitMs);
      continue;
    }

    return res;
  }
};

const pollJob = async (jobId, { intervalMs = 3000, maxAttempts = 40 } = {}) => {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);

    const res = await supadataFetch(`${SUPADATA_BASE_URL}/transcript/${jobId}`);
    const data = await res.json();

    if (data.status === "completed") return data;
    if (data.status === "failed") {
      throw new Error(data.error || "Transcript job failed on Supadata's side.");
    }
    // status is "queued" or "active" — keep polling
  }

  throw new Error("Transcript generation timed out. Please try again.");
};

exports.getTranscript = async (videoUrl) => {
  if (!isValidYouTubeUrl(videoUrl)) {
    throw new Error("Invalid YouTube URL.");
  }

  if (!SUPADATA_API_KEY) {
    throw new Error("SUPADATA_API_KEY is not configured on the server.");
  }

  const params = new URLSearchParams({
    url: videoUrl,
    text: "true", // plain text response instead of timestamped segments
    mode: "auto", // try existing captions first, fall back to AI transcription
  });

  let res;
  try {
    res = await supadataFetch(`${SUPADATA_BASE_URL}/transcript?${params.toString()}`);
  } catch (err) {
    throw new Error(`Failed to reach Supadata: ${err.message}`);
  }

  if (res.status === 404) {
    throw new Error("This video is unavailable or private.");
  }
  if (res.status === 403) {
    throw new Error("This video requires authentication or is restricted.");
  }
  if (res.status === 206) {
    throw new Error("No transcript is available for this video.");
  }
  if (res.status >= 500) {
    throw new Error("Supadata is temporarily unavailable. Please try again.");
  }
  if (!res.ok && res.status !== 202) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Transcript request failed (status ${res.status}).`);
  }

  let data = await res.json();

  // Large videos (>~20 min) return a jobId instead of the transcript directly.
  if (res.status === 202 && data.jobId) {
    console.log(`⏳ Transcript queued as async job (${data.jobId}), polling...`);
    data = await pollJob(data.jobId);
  }

  const text = (data.content || "").trim();

  if (!text) {
    throw new Error("Captions were found but came back empty.");
  }

  return text;
};

