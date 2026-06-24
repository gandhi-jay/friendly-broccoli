import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./Popup";
import "../options/style.css";
import "../../themes/01-terminal.css";
import "../../themes/02-github-dark.css";
import "../../themes/03-dracula.css";
import "../../themes/04-catppuccin-mocha.css";
import "../../themes/05-solarized-light.css";
import "../../themes/theme.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
