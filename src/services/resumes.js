import { API_BASE_URL } from "../config";

// Fetch a particular resume from FastAPI.
export async function fetchResume(resumeId, accessToken) {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.detail || "Could not load this resume.");
    error.status = response.status;
    throw error;
  }

  return data;
}

// Delete a resume from the backend.
export async function deleteResume(resumeId, accessToken) {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    // The response may not contain a JSON body.
  }

  if (!response.ok) {
    const error = new Error(data.detail || "Could not delete this resume.");
    error.status = response.status;
    throw error;
  }

  return data;
}

// Analyze a resume using the AI service.
export async function analyzeResume(resumeId, accessToken) {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    // The response may not contain a JSON body.
  }

  if (!response.ok) {
    const error = new Error(data.detail || "Failed to analyze resume.");
    error.status = response.status;
    throw error;
  }

  return data;
}

// Retrieving AI analysis from DB

export async function fetchLatestResumeAnalysis(resumeId, accessToken) {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/analysis`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    // The response may not contain a JSON body.
  }

  if (!response.ok) {
    const error = new Error(
      data.detail || "Could not retrieve the saved analysis.",
    );

    error.status = response.status;
    throw error;
  }

  return data;
}
