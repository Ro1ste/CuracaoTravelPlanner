import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Uppy CSS using full paths
import '../../../node_modules/@uppy/core/dist/style.min.css';
import '../../../node_modules/@uppy/dashboard/dist/style.min.css';

createRoot(document.getElementById("root")!).render(<App />);
