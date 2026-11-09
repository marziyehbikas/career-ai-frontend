import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { fetchResume } from "../services/resumes";

import { API_BASE_URL } from "../config";

export default function ResumeEditPage({ accessToken, onLogout }) {
  const { resumeId } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [replacementFile, setReplacementFile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const currentFileName =
    resume?.file_path?.split(/[\\/]/).pop() || "No file recorded";

  // Load the current resume details.
  useEffect(() => {
    let cancelled = false;

    async function loadResume() {
      setIsLoading(true);
      setError("");

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

  // Submit the requested changes.
  async function handleUpdateResume(event) {
    event.preventDefault();

    setUpdateError("");

    const trimmedTitle = newTitle.trim();

    // At least one change is required.
    if (!trimmedTitle && !replacementFile) {
      setUpdateError("Enter a new title or select a replacement file.");
      return;
    }

    // Add only the fields the user wants to change.
    const formData = new FormData();

    if (trimmedTitle) {
      formData.append("title", trimmedTitle);
    }

    if (replacementFile) {
      formData.append("file", replacementFile);
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Could not update the resume.");
      }

      // Return to the details page.
      // That page will fetch the updated resume.
      navigate(`/resumes/${resumeId}`, {
        replace: true,
      });
    } catch (error) {
      setUpdateError(error.message || "Could not update the resume.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="dashboard-header">
          <div>
            <p className="brand-name">CAREER AI</p>
            <p className="dashboard-subtitle">Edit Resume</p>
          </div>

          <Link to={`/resumes/${resumeId}`} className="back-link">
            Cancel
          </Link>
        </header>

        {isLoading ? (
          <p>Loading resume details...</p>
        ) : error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : resume ? (
          <>
            <h1>Edit Resume</h1>

            <p className="subtitle">
              Update the resume title, replace the file, or do both.
            </p>

            <section className="profile-card">
              <h2>Current Resume</h2>

              <p>
                <strong>Title:</strong> {resume.title}
              </p>

              <p>
                <strong>File:</strong> {currentFileName}
              </p>
            </section>

            <section className="profile-card resume-update-section">
              <h2>Make Changes</h2>

              <p className="update-hint">
                Leave the title empty to keep the current title. Leave the file
                empty to keep the current file.
              </p>

              <form onSubmit={handleUpdateResume}>
                <div className="form-group">
                  <label htmlFor="new-title">New title (optional)</label>

                  <input
                    id="new-title"
                    type="text"
                    placeholder={`Current title: ${resume.title}`}
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="replacement-file">
                    Replacement file (optional)
                  </label>

                  <input
                    id="replacement-file"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(event) =>
                      setReplacementFile(event.target.files?.[0] ?? null)
                    }
                  />
                </div>

                {updateError && (
                  <p className="error-message" role="alert">
                    {updateError}
                  </p>
                )}

                <button
                  type="submit"
                  className="login-button"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </form>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
