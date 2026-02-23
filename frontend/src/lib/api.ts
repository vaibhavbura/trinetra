// axios is recommended but for MVP we will use native fetch to minimize dependencies

const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer
  ? process.env.INTERNAL_API_URL || "http://backend:8000/api"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchLeaderboard(params?: { genre?: string, language?: string, year?: string }) {
  let url = `${API_BASE_URL}/leaderboard`;
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.genre) searchParams.append("genre", params.genre);
    if (params.language) searchParams.append("language", params.language);
    if (params.year) searchParams.append("year", params.year);
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export async function fetchCreatorAnalytics(id: string) {
  const res = await fetch(`${API_BASE_URL}/creators/${id}`);
  if (!res.ok) throw new Error("Failed to fetch creator data");
  return res.json();
}

export async function calculateCreatorScore(id: string) {
  const res = await fetch(`${API_BASE_URL}/creators/${id}/calculate-score`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to calculate score");
  return res.json();
}

export async function triggerMlTraining() {
  const res = await fetch(`${API_BASE_URL}/ml/train`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger training");
  return res.json();
}

export async function predictViews(id: string) {
  const res = await fetch(`${API_BASE_URL}/ml/predict/${id}`);
  if (!res.ok) throw new Error("Failed to get prediction");
  return res.json();
}

export async function uploadCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload/csv`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload CSV");
  }
  return res.json();
}
