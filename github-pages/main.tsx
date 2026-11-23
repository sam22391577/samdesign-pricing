import React from "react";
import { createRoot } from "react-dom/client";
import QuoteCalculator from "../app/page";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("找不到試算網站根節點");

createRoot(root).render(
  <React.StrictMode>
    <QuoteCalculator />
  </React.StrictMode>,
);
