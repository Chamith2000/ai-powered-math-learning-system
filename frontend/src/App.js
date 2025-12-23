import { BrowserRouter, Routes, Route } from "react-router-dom";
import 'swiper/css';
import ScrollToTop from "./component/layout/ScrollToTop";
import AutoCapture from "./page/CameraCapturing";
import StartingPaper from "./page/StartingPaper";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
        <AutoCapture />
      <Routes>

          <Route path="starting-paper/" element={<StartingPaper />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
