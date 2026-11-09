import { useCallback, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ResumeDetailsPage from "./pages/ResumeDetailsPage";
import ResumeEditPage from "./pages/ResumeEditPage";
import ResumeCreatePage from "./pages/ResumeCreatePage";

function App() {
  // Initializer: passing a function to userState makes the state an initializer which means
  // the function is only run once to initialize the initial value of the state
  const [accessToken, setAccessToken] = useState(() =>
    sessionStorage.getItem("access_token"),
  );

  function handleLogin(token, user) {
    sessionStorage.setItem("access_token", token);
    sessionStorage.setItem("current_user", JSON.stringify(user));

    setAccessToken(token);
  }

  // useCallback prevents function creation everytime that app is rerendered
  // since we use the handleLogout function as an useEffect dependancy in DashboardPage
  // creating new function after each rerender can cuase the loadDashbaord function to rerun unnecessarily
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("current_user");

    setAccessToken(null);
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          accessToken ? (
            // "Replace" replaces the current entry in the browser's navigation history instead of adding a new entry
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
            // onLogin is the name of the prop that LoginPage receives
            // handleLogin is a function passed using the onLogin prop and it is not called yet
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          accessToken ? (
            <DashboardPage accessToken={accessToken} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          <Navigate to={accessToken ? "/dashboard" : "/login"} replace />
        }
      />
      <Route
        path="/resumes/create"
        element={
          accessToken ? (
            <ResumeCreatePage
              accessToken={accessToken}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route // Defines the route pattern that determines which component to display
        // resumeId must match the name in ResumeDetailsPage
        // const { resumeId } = useParams() in ResumeDetailsPage
        path="/resumes/:resumeId"
        element={
          accessToken ? (
            <ResumeDetailsPage
              accessToken={accessToken}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Update resume */}
      <Route
        path="/resumes/:resumeId/edit"
        element={
          accessToken ? (
            <ResumeEditPage accessToken={accessToken} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        // handles URLs that don't match any of the other routes
        path="*"
        element={
          <Navigate to={accessToken ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
}

export default App;
