import { useEffect, useState } from "react";
import { Link } from "react-router";

import { API_BASE_URL } from "../config";

export default function DashboardPage({ accessToken, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  // Why useEffect: We want to request the profile and resumes automatically when the dashboard appears, and again if the token changes.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setDashboardError("");

      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
        };

        // Promise.all() allows both HTTP requests to run concurrently
        // rather than waiting for the profile request to finish before starting the resume request.
        const [profileResponse, resumesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/users/profile`, { headers }),
          fetch(`${API_BASE_URL}/resumes/`, { headers }),
        ]);

        const profileData = await profileResponse.json();
        const resumesData = await resumesResponse.json();

        // Ignore results if this effect has already been cleaned up.
        if (cancelled) return;

        // If the token is invalid or expired, return to login.
        if (profileResponse.status === 401 || resumesResponse.status === 401) {
          onLogout();
          return;
        }

        if (!profileResponse.ok) {
          throw new Error(profileData.detail || "Could not load your profile.");
        }

        if (!resumesResponse.ok) {
          throw new Error(resumesData.detail || "Could not load your resumes.");
        }

        // This assumes GET /users/profile returns a user object directly.
        setProfile(profileData);

        // This assumes GET /resumes/ returns a JSON array directly.
        if (!Array.isArray(resumesData)) {
          throw new Error(
            "The resumes response is not an array. Check GET /resumes/ in Swagger.",
          );
        }

        setResumes(resumesData);
      } catch (error) {
        if (!cancelled) {
          setDashboardError(
            error.message || "Could not connect to the backend.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [accessToken, onLogout]);

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="dashboard-header">
          <div>
            <p className="brand-name">CAREER AI</p>
            <p className="dashboard-subtitle">My Dashboard</p>
          </div>

          <button type="button" className="logout-button" onClick={onLogout}>
            Log out
          </button>
        </header>

        <h1>Welcome back{profile?.name ? `, ${profile.name}` : ""}</h1>

        <p className="subtitle">
          Manage your profile and resumes in one place.
        </p>

        {dashboardError && (
          <p className="error-message" role="alert">
            {dashboardError}
          </p>
        )}

        <section className="profile-card">
          <h2>My Profile</h2>

          {profile ? (
            <>
              <p>
                <strong>Name:</strong> {profile.name}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>User ID:</strong> {profile.id}
              </p>
            </>
          ) : (
            !dashboardError && <p>Loading profile...</p>
          )}
        </section>

        <section className="resumes-section">
          <div className="resumes-section-header">
            <h2>My Resumes</h2>

            <Link to="/resumes/create" className="upload-resume-link">
              + Upload Resume
            </Link>
          </div>

          {isLoading ? (
            <p>Loading your resumes...</p>
          ) : resumes.length === 0 ? (
            <p className="empty-state">You haven't uploaded any resumes yet.</p>
          ) : (
            <div className="resume-list">
              {resumes.map((resume) => (
                <Link
                  to={`/resumes/${resume.id}`}
                  className="resume-link"
                  key={resume.id}
                >
                  <article className="resume-item">
                    <div>
                      <h3>{resume.title || "Untitled resume"}</h3>
                      <p className="resume-id">Resume ID: {resume.id}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
