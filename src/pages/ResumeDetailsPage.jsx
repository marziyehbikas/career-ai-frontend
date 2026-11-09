import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  fetchResume,
  deleteResume,
  analyzeResume,
  fetchLatestResumeAnalysis,
} from "../services/resumes";

import { API_BASE_URL } from "../config";

export default function ResumeDetailsPage({ accessToken, onLogout }) {
  const { resumeId } = useParams();

  // Show resume information states
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Preview and download the file states
  const [fileUrl, setFileUrl] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  // Delete resume states and variables
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // AI resume analysis states
  const [analysis, setAnalysis] = useState(null); // 	Stores the analysis returned by FastAPI
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Tracks whether the AI analysis is in progress
  const [analysisError, setAnalysisError] = useState(""); // 	Stores any error encountered during analysis

  // Retrieving AI analysis from DB
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);

  const fileName =
    resume?.file_path?.split(/[\\/]/).pop() || `resume-${resumeId}`;
  // ?. means: access file_path only if resume is not null or undefined.

  const fileExtension = fileName.includes(".")
    ? fileName.split(".").pop().toLowerCase()
    : "";

  // Fetch this resume's details.
  useEffect(() => {
    let cancelled = false;

    async function loadResume() {
      setIsLoading(true);
      setError("");
      setResume(null);

      try {
        const data = await fetchResume(resumeId, accessToken);

        if (cancelled) return;

        setResume(data);
      } catch (error) {
        if (!cancelled) {
          setError(error.message || "Could not connect to the backend.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadResume();

    return () => {
      cancelled = true;
    };
  }, [accessToken, resumeId, onLogout]);

  // Retrieve AI analysis from DB
  useEffect(() => {
    let cancelled = false;

    async function loadLatestAnalysis() {
      setIsLoadingAnalysis(true);
      setAnalysisError("");
      setAnalysis(null);

      try {
        const data = await fetchLatestResumeAnalysis(resumeId, accessToken);

        if (cancelled) return;

        setAnalysis(data);
      } catch (error) {
        if (cancelled) return;

        if (error.status === 404) {
          // No previous analysis exists.
          // This is normal for a resume that hasn't been analyzed yet.
          setAnalysis(null);
          return;
        }

        if (error.status === 401) {
          onLogout();
          return;
        }

        setAnalysisError(
          error.message || "Could not retrieve the saved analysis.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingAnalysis(false);
        }
      }
    }

    if (resumeId && accessToken) {
      loadLatestAnalysis();
    }

    return () => {
      cancelled = true;
    };
  }, [resumeId, accessToken, onLogout]);

  // Request the actual file from the protected endpoint.
  async function fetchResumeFile() {
    const response = await fetch(
      `${API_BASE_URL}/resumes/${resumeId}/download`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (response.status === 401) {
      onLogout();
      return null;
    }

    if (!response.ok) {
      let data = {};

      try {
        data = await response.json();
      } catch {
        // The error response might not contain JSON.
      }

      throw new Error(data.detail || "Could not retrieve the resume file.");
    }

    return response.blob();
  }

  async function handlePreviewResume() {
    // If the PDF is already open, close it.
    if (fileUrl) {
      setFileUrl(null);
      setFileError("");
      return;
    }

    if (fileExtension !== "pdf") {
      setFileError("Preview is available for PDF files only.");
      return;
    }

    setFileLoading(true);
    setFileError("");

    try {
      const blob = await fetchResumeFile();

      if (!blob) return;

      const pdfBlob = new Blob([blob], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(pdfBlob);
      setFileUrl(url);
    } catch (error) {
      setFileError(error.message || "Could not load the resume.");
    } finally {
      setFileLoading(false);
    }
  }

  async function handleDownloadResume() {
    setFileLoading(true);
    setFileError("");

    try {
      const blob = await fetchResumeFile();

      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setFileError(error.message || "Could not download the resume.");
    } finally {
      setFileLoading(false);
    }
  }

  // Release the preview URL when it changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Delete resume
  async function handleDeleteResume() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${resume.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteResume(resumeId, accessToken);

      // The deletion succeeded. Return to the dashboard.
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error.status === 401) {
        onLogout();
        return;
      }

      setDeleteError(error.message || "Could not delete this resume.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Analyze resume using the AI service.
  async function handleAnalyzeResume() {
    if (!resume) return;

    setIsAnalyzing(true); // analysis has started.
    setAnalysisError("");

    try {
      const data = await analyzeResume(resumeId, accessToken);

      setAnalysis(data);
    } catch (error) {
      if (error.status === 401) {
        onLogout();
        return;
      }

      setAnalysisError(error.message || "Could not analyze this resume.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="dashboard-header">
          <div>
            <p className="brand-name">CAREER AI</p>
            <p className="dashboard-subtitle">Resume Details</p>
          </div>

          <div className="page-actions">
            <Link to="/dashboard" className="back-link">
              Back to dashboard
            </Link>

            {resume && (
              <Link to={`/resumes/${resume.id}/edit`} className="back-link">
                Edit Resume
              </Link>
            )}

            {resume && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDeleteResume}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Resume"}
              </button>
            )}
          </div>
        </header>

        {isLoading ? (
          <p>Loading resume details...</p>
        ) : error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : resume ? (
          <section className="profile-card">
            <h1>{resume.title || "Untitled resume"}</h1>

            <p>
              <strong>Resume ID:</strong> {resume.id}
            </p>

            <p>
              <strong>Owner:</strong> {resume.user?.name || "Unknown"}
            </p>
            <p>
              <strong>Owner ID:</strong> {resume.user?.id}
            </p>

            <section className="resume-analysis-section">
              <h2>AI Resume Analysis</h2>

              <p>
                Analyze your resume to discover its strengths, areas for
                improvement, skills, and recommendations.
              </p>

              {isLoadingAnalysis ? (
                <p>Checking for saved analysis...</p>
              ) : (
                <button
                  type="button"
                  className="login-button"
                  onClick={handleAnalyzeResume}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing
                    ? "Analyzing Resume..."
                    : analysis
                      ? "Analyze Again"
                      : "Analyze Resume"}
                </button>
              )}

              {analysisError && (
                <p className="error-message" role="alert">
                  {analysisError}
                </p>
              )}

              {analysis && (
                <section className="resume-analysis-results">
                  <div>
                    <h4></h4>
                    <h3>Summary</h3>
                    <p>{analysis.summary}</p>
                  </div>

                  <div>
                    <h3>Strengths</h3>
                    {analysis.strengths.length > 0 ? (
                      <ul>
                        {analysis.strengths.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No strengths identified.</p>
                    )}
                  </div>

                  <div>
                    <h3>Areas for Improvement</h3>
                    {analysis.areas_for_improvement.length > 0 ? (
                      <ul>
                        {analysis.areas_for_improvement.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No areas for improvement identified.</p>
                    )}
                  </div>

                  <div>
                    <h3>Detected Skills</h3>
                    {analysis.detected_skills.length > 0 ? (
                      <ul>
                        {analysis.detected_skills.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No skills identified.</p>
                    )}
                  </div>

                  <div>
                    <h3>Missing or Unclear Information</h3>
                    {analysis.missing_or_unclear_information.length > 0 ? (
                      <ul>
                        {analysis.missing_or_unclear_information.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p>No missing or unclear information identified.</p>
                    )}
                  </div>

                  <div>
                    <h3>Recommendations</h3>
                    {analysis.recommendations.length > 0 ? (
                      <ul>
                        {analysis.recommendations.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No recommendations available.</p>
                    )}
                  </div>
                </section>
              )}
            </section>

            <section className="resume-file-section">
              <h2>Resume File</h2>

              <p>
                <strong>File:</strong> {fileName}
              </p>

              <div className="resume-actions">
                {fileExtension === "pdf" && (
                  <button
                    type="button"
                    className={`login-button ${fileUrl ? "preview-open-button" : ""}`}
                    onClick={handlePreviewResume}
                    disabled={fileLoading}
                  >
                    {fileLoading
                      ? "Loading..."
                      : fileUrl
                        ? "Close Preview"
                        : "Preview PDF"}
                  </button>
                )}

                <button
                  type="button"
                  className="login-button"
                  onClick={handleDownloadResume}
                  disabled={fileLoading}
                >
                  {fileLoading ? "Loading..." : "Download Resume"}
                </button>
              </div>

              {fileError && (
                <p className="error-message" role="alert">
                  {fileError}
                </p>
              )}

              {deleteError && (
                <p className="error-message" role="alert">
                  {deleteError}
                </p>
              )}

              {fileUrl && fileExtension === "pdf" && (
                <iframe
                  className="resume-preview"
                  src={fileUrl}
                  title={`Preview of ${resume.title}`}
                />
              )}
            </section>
          </section>
        ) : null}
      </section>
    </main>
  );
}
