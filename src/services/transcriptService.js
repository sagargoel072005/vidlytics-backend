const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const SUPADATA_BASE_URL = "https://api.supadata.ai/v1";

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/i;

const isValidYouTubeUrl = (url) => YOUTUBE_URL_REGEX.test((url || "").trim());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Supadata rate-limits at 5 requests / 10 seconds — retry with backoff on 429
// rather than failing the whole job immediately.
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

// Videos over ~20 minutes trigger async processing (HTTP 202 + jobId).
// Poll until the job completes, fails, or we give up.
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

/**
 * Fetches the transcript for a YouTube video via the Supadata API.
 * Throws a descriptive Error on failure — callers (the worker) should catch
 * this and surface a clean message rather than letting the job crash silently.
 */
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



// const { execFile } = require("child_process");
// const util = require("util");
// const path = require("path");
// const fs = require("fs");

// const execFileAsync = util.promisify(execFile);

// // Use the full path so this doesn't depend on PM2's PATH picking up
// // /usr/local/bin. Confirm this path with `sudo -u ubuntu which yt-dlp`.
// const YT_DLP_PATH = "/usr/local/bin/yt-dlp";
// const COOKIES_PATH = path.join(__dirname, "../../cookies.txt");

// const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/i;

// const isValidYouTubeUrl = (url) => YOUTUBE_URL_REGEX.test((url || "").trim());

// const VTT_CUE_TIME = /^\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}/;

// // Converts raw WebVTT captions into a single clean text block.
// const vttToPlainText = (vtt) => {
//   const lines = vtt.split("\n").filter((line) => {
//     const t = line.trim();
//     if (!t || t === "WEBVTT") return false;
//     if (t.startsWith("NOTE") || t.startsWith("Kind:") || t.startsWith("Language:")) return false;
//     if (VTT_CUE_TIME.test(t)) return false; // "00:00:01.000 --> 00:00:03.000"
//     if (/^\d+$/.test(t)) return false; // cue index numbers
//     return true;
//   });

//   const text = lines
//     .map((line) => line.replace(/<[^>]+>/g, "")) // strip inline <00:00:01.360> and <c> tags
//     .join(" ")
//     .replace(/\s+/g, " ")
//     .trim();

//   // auto captions repeat lines as they scroll; collapse immediate duplicates
//   return text.replace(/\b(\w[\w']*(?:\s+\w[\w']*){0,4})\s+\1\b/gi, "$1");
// };

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// // YouTube's caption-serving CDN (timedtext) rate-limits aggressively under
// // repeated testing. Retry with backoff instead of failing the whole job on
// // a transient 429.
// const fetchCaptionsWithRetry = async (url, retries = 3) => {
//   for (let attempt = 0; attempt <= retries; attempt++) {
//     const res = await fetch(url);

//     if (res.ok) {
//       return res.text();
//     }

//     if (res.status === 429 && attempt < retries) {
//       const waitMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
//       console.log(`⏳ Captions 429, retrying in ${waitMs / 1000}s... (${retries - attempt} left)`);
//       await sleep(waitMs);
//       continue;
//     }

//     throw new Error(`Failed to download captions (status ${res.status}).`);
//   }
// };

// /**
//  * Fetches the transcript for a YouTube video via yt-dlp.
//  * Throws a descriptive Error if the video has no usable captions or the
//  * fetch fails for any other reason — callers (the worker) should catch this
//  * and surface a clean message rather than letting the job crash silently.
//  */
// exports.getTranscript = async (videoUrl) => {
//   if (!isValidYouTubeUrl(videoUrl)) {
//     throw new Error("Invalid YouTube URL.");
//   }

//   const hasCookies = fs.existsSync(COOKIES_PATH);

//   const args = [
//     "-J", // dump metadata as JSON, no download
//     "--skip-download",
//     "--no-warnings",
//   ];

//   if (hasCookies) {
//     args.push("--cookies", COOKIES_PATH);
//   } else {
//     console.warn(
//       "cookies.txt not found — yt-dlp requests may get blocked by YouTube's bot check."
//     );
//   }

//   args.push(videoUrl);

//   let stdout;
//   try {
//     ({ stdout } = await execFileAsync(YT_DLP_PATH, args, {
//       maxBuffer: 1024 * 1024 * 20,
//       timeout: 30_000,
//     }));
//   } catch (err) {
//     if (err.killed) {
//       throw new Error("Fetching video info timed out. Please try again.");
//     }
//     if (/Sign in to confirm/i.test(err.stderr || "")) {
//       throw new Error(
//         "YouTube is blocking this request (bot check). The server's session cookies may have expired."
//       );
//     }
//     if (/Video unavailable|Private video/i.test(err.stderr || "")) {
//       throw new Error("This video is unavailable or private.");
//     }
//     throw new Error(`Failed to fetch video info: ${err.message}`);
//   }

//   let info;
//   try {
//     info = JSON.parse(stdout);
//   } catch {
//     throw new Error("Unexpected response while reading video info.");
//   }

//   // Prefer real, manually-uploaded subtitles over auto-generated ones —
//   // better punctuation and accuracy. Fall back to auto captions if that's
//   // all that's available. English only for now.
//   const track =
//     info.subtitles?.en?.find((t) => t.ext === "vtt") ||
//     info.automatic_captions?.en?.find((t) => t.ext === "vtt");

//   if (!track) {
//     throw new Error("No English captions are available for this video.");
//   }

//   const vtt = await fetchCaptionsWithRetry(track.url);
//   const text = vttToPlainText(vtt);

//   if (!text) {
//     throw new Error("Captions were found but came back empty after parsing.");
//   }

//   return text;
// };

// const {
// YoutubeTranscript
// } = require("youtube-transcript");

// exports.getTranscript = async(videoUrl)=>{

//    try {
//   const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
//   return transcript.map(t => t.text).join(" ");
// } catch (err) {
//   console.error("Transcript Error:", err.message);
//   throw err;
// }
// };
