// App.jsx - Simplified
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Canvas from "./canvas/index.jsx";
import Customizer from "./pages/Customizer.jsx";
import Home from "./pages/Home.jsx";
import MyDesigns from "./pages/MyDesigns.jsx";

function App() {
  return (
    <Router>
      <main className="app transition-all ease-in">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Home />
                <Canvas />
                <Customizer />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
