import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "./components/styles/theme-provider";
import RootLayout from "./layouts/RootLayout";
import About from "./pages/About";
import FreshProject from "./pages/FreshProject";
import TimelineController from "./controllers/TimelineController";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="coltrane-ui-theme">
      <BrowserRouter>
        <Routes>
          {/* The outer Route applies the Layout to all its children */}
          <Route element={<RootLayout />}>
            <Route index element={<FreshProject />} />
            <Route path="archive" element={<TimelineController />} />
            <Route path="timeline" element={<TimelineController />} />
            <Route path="about" element={<About />} />
          </Route>
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
