import { BrowserRouter, Routes, Route } from "react-router-dom";
import 'swiper/css';
import ScrollToTop from "./component/layout/ScrollToTop";
import AutoCapture from "./page/CameraCapturing";
import StartingPaper from "./page/StartingPaper";
import PaperDetails from "./page/PaperDetails";
import PaperList from "./page/PaperList";
import GameLaunch from "./page/GameLaunch";
import StudentProfile from "./page/StudentProfile";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
        <AutoCapture />
       <Routes>
        {/* Public Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="forgetpass" element={<ForgetPass />} />


        {/* Protected Routes: Requires Login */}
        <Route element={<ProtectedRoute />}>

          <Route path="starting-paper/" element={<StartingPaper />} />

          <Route path="maths-lectures" element={<PythonLectures />} />
          <Route path="maths-view/:id" element={<PythonLectureView />} />

          <Route path="compiler" element={<CodingCompiler />} />

          <Route path="paperlist" element={<PaperList />} />
          <Route path="paper-details/:paperId" element={<PaperDetails />} />

          {/* <Route path="pre-guide" element={<PreGuide />} />

          <Route path="VisualLearning" element={<VisualLearning />} />
          <Route path="VisualLearning-details/:id" element={<VisualLearningView />} />

          <Route path="AuditoryLearning" element={<AuditoryLearning />} />
          <Route path="AuditoryLearning-details/:id" element={<AuditoryLearningView />} />

          <Route path="KinestheticLearning" element={<KinestheticLearning />} />
          <Route path="KinestheticLearning-details/:id" element={<KinestheticLearningDetails />} />

          <Route path="ReadAndWriteLearning" element={<ReadAndWriteLearning />} />
          <Route path="readwrite-details/:id" element={<ReadAndWriteLearningDetails />} /> */}


          <Route path="studentprofile" element={<StudentProfile />} />

          <Route path="/" element={<Home />} />

          <Route path="game-launch" element={<GameLaunch />} />

          <Route path="search-page/:name" element={<SearchPage />} />

          <Route path="about" element={<AboutPage />} />


          <Route path="search-none" element={<SearchNone />} />
          <Route path="contact" element={<ContactPage />} />


        </Route>

        {/* 404 Page */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
