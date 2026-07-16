const { execFile } = require("child_process");
const util = require("util");

const execFileAsync = util.promisify(execFile);

const isValidYouTubeUrl = (url) =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url || "");

const VTT_CUE_TIME = /^\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}/;

// Converts raw WebVTT captions into plain, readable text.
const vttToPlainText = (vtt) => {
  const lines = vtt.split("\n").filter((line) => {
    const t = line.trim();
    if (!t || t === "WEBVTT") return false;
    if (VTT_CUE_TIME.test(t)) return false; // timestamp lines
    if (/^\d+$/.test(t)) return false; // cue index numbers
    return true;
  });

  return lines
    .map((line) => line.replace(/<[^>]+>/g, "")) // strip inline <00:00:01.000> tags
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

exports.getTranscript = async (videoUrl) => {
  if (!isValidYouTubeUrl(videoUrl)) {
    throw new Error("Invalid YouTube URL.");
  }

  // execFile (not exec) — passes the URL as a real argument, not through a
  // shell string, so a malicious video URL can't inject shell commands.
  const { stdout } = await execFileAsync(
    "yt-dlp",
    ["-J", "--skip-download", "--no-warnings", videoUrl],
    { maxBuffer: 1024 * 1024 * 20, timeout: 30_000 }
  );

  const info = JSON.parse(stdout);

  // Prefer real, manually-uploaded subtitles; fall back to auto-generated ones.
  const track =
    info.subtitles?.en?.find((t) => t.ext === "vtt") ||
    info.automatic_captions?.en?.find((t) => t.ext === "vtt");

  if (!track) {
    throw new Error("No English captions available for this video.");
  }

  const res = await fetch(track.url);
  if (!res.ok) {
    throw new Error(`Failed to download captions (status ${res.status})`);
  }

  const vtt = await res.text();
  const text = vttToPlainText(vtt);

  if (!text) {
    throw new Error("Captions were empty after parsing.");
  }

  return text;
};