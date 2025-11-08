import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Canvas from "./canvas/index.jsx";
import Customizer from "./pages/Customizer.jsx";
import Home from "./pages/Home.jsx";
import MyDesigns from "./pages/MyDesigns.jsx";
import Community from "./pages/Community.jsx";

function AppContent() {
  const location = useLocation();

  // Pages that need scrolling
  const scrollablePages = ["/my-designs", "/community"];
  const needsScroll = scrollablePages.includes(location.pathname);

  return (
    <main
      className={
        needsScroll
          ? "app-scrollable transition-all ease-in"
          : "app transition-all ease-in"
      }
    >
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Home />
              <Canvas />
            </>
          }
        />
        <Route
          path="/customizer"
          element={
            <>
              <Canvas />
              <Customizer />
            </>
          }
        />
        <Route path="/my-designs" element={<MyDesigns />} />
        <Route path="/community" element={<Community />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
