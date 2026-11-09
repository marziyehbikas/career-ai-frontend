import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { API_BASE_URL } from "../config";

export default function ResumeCreatePage({ accessToken, onLogout }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter a resume title.");
      return;
    }

    if (!file) {
      setError("Please select a PDF or DOCX file.");
      return;
    }

    // Packages both a text and a file to send to server
    const formData = new FormData();

    formData.append("title", trimmedTitle);
    formData.append("file", file);

    setIsUploading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/resumes/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Could not upload the resume.");
      }

      // The backend returns the newly created resume record.
      const newResumeId = data.resume?.id;

      if (newResumeId == null) {
        throw new Error(
          "The upload succeeded, but the response did not contain the new resume ID.",
        );
      }

      // Open the details page for the new resume.
      navigate(`/resumes/${newResumeId}`, {
        replace: true,
      });
    } catch (error) {
      setError(error.message || "Could not connect to the backend.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="dashboard-header">
          <div>
            <p className="brand-name">CAREER AI</p>
            <p className="dashboard-subtitle">Create Resume</p>
          </div>

          <Link to="/dashboard" className="back-link">
            Cancel
          </Link>
        </header>

        <h1>Upload a Resume</h1>

        <p className="subtitle">Add a new resume to your account.</p>

        <section className="profile-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="resume-title">Resume title</label>

              <input
                id="resume-title"
                type="text"
                placeholder="e.g. Software Engineer"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resume-file">Choose a resume file</label>

              <input
                id="resume-file"
                type="file"
                accept=".pdf,.docx"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />

              <p className="update-hint">Accepted formats: PDF and DOCX.</p>

              {file && (
                <p className="selected-file">Selected file: {file.name}</p>
              )}
            </div>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Resume"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
