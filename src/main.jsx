import { StrictMode } from "react";
import { createRoot } from "react-dom/client"; // creates the React root that will render your application in the browser
import { BrowserRouter } from "react-router"; // enables navigation using browser URLs

import "./index.css"; // global CSS styles
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
