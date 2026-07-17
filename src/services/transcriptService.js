const { execFile } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");

const execFileAsync = util.promisify(execFile);

// Use the full path so this doesn't depend on PM2's PATH picking up
// /usr/local/bin. Confirm this path with `sudo -u ubuntu which yt-dlp`.
const YT_DLP_PATH = "/usr/local/bin/yt-dlp";
const COOKIES_PATH = path.join(__dirname, "../../cookies.txt");

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/i;

const isValidYouTubeUrl = (url) => YOUTUBE_URL_REGEX.test((url || "").trim());

const VTT_CUE_TIME = /^\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}/;

// Converts raw WebVTT captions into a single clean text block.
const vttToPlainText = (vtt) => {
  const lines = vtt.split("\n").filter((line) => {
    const t = line.trim();
    if (!t || t === "WEBVTT") return false;
    if (t.startsWith("NOTE") || t.startsWith("Kind:") || t.startsWith("Language:")) return false;
    if (VTT_CUE_TIME.test(t)) return false; // "00:00:01.000 --> 00:00:03.000"
    if (/^\d+$/.test(t)) return false; // cue index numbers
    return true;
  });

  const text = lines
    .map((line) => line.replace(/<[^>]+>/g, "")) // strip inline <00:00:01.360> and <c> tags
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // auto captions repeat lines as they scroll; collapse immediate duplicates
  return text.replace(/\b(\w[\w']*(?:\s+\w[\w']*){0,4})\s+\1\b/gi, "$1");
};

/**
 * Fetches the transcript for a YouTube video via yt-dlp.
 * Throws a descriptive Error if the video has no usable captions or the
 * fetch fails for any other reason — callers (the worker) should catch this
 * and surface a clean message rather than letting the job crash silently.
 */
exports.getTranscript = async (videoUrl) => {
  if (!isValidYouTubeUrl(videoUrl)) {
    throw new Error("Invalid YouTube URL.");
  }

  const hasCookies = fs.existsSync(COOKIES_PATH);

  const args = [
    "-J", // dump metadata as JSON, no download
    "--skip-download",
    "--no-warnings",
  ];

  if (hasCookies) {
    args.push("--cookies", COOKIES_PATH);
  } else {
    console.warn(
      "cookies.txt not found — yt-dlp requests may get blocked by YouTube's bot check."
    );
  }

  args.push(videoUrl);

  let stdout;
  try {
    ({ stdout } = await execFileAsync(YT_DLP_PATH, args, {
      maxBuffer: 1024 * 1024 * 20,
      timeout: 30_000,
    }));
  } catch (err) {
    if (err.killed) {
      throw new Error("Fetching video info timed out. Please try again.");
    }
    if (/Sign in to confirm/i.test(err.stderr || "")) {
      throw new Error(
        "YouTube is blocking this request (bot check). The server's session cookies may have expired."
      );
    }
    if (/Video unavailable|Private video/i.test(err.stderr || "")) {
      throw new Error("This video is unavailable or private.");
    }
    throw new Error(`Failed to fetch video info: ${err.message}`);
  }

  let info;
  try {
    info = JSON.parse(stdout);
  } catch {
    throw new Error("Unexpected response while reading video info.");
  }

  // Prefer real, manually-uploaded subtitles over auto-generated ones —
  // better punctuation and accuracy. Fall back to auto captions if that's
  // all that's available. English only for now.
  const track =
    info.subtitles?.en?.find((t) => t.ext === "vtt") ||
    info.automatic_captions?.en?.find((t) => t.ext === "vtt");

  if (!track) {
    throw new Error("No English captions are available for this video.");
  }

  const res = await fetch(track.url);
  if (!res.ok) {
    throw new Error(`Failed to download captions (status ${res.status}).`);
  }

  const vtt = await res.text();
  const text = vttToPlainText(vtt);

  if (!text) {
    throw new Error("Captions were found but came back empty after parsing.");
  }

  return text;
};

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
