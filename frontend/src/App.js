import { BrowserRouter, Routes, Route } from "react-router-dom";
import 'swiper/css';
import ScrollToTop from "./component/layout/ScrollToTop";
import ProtectedRoute from "./ProtectedRoute";
import ErrorPage from "./page/404";
import AboutPage from "./page/about";
import ContactPage from "./page/contact";
import ForgetPass from "./page/forgetpass";
import Home from "./page/home";
import LoginPage from "./page/login";
import SearchNone from "./page/search-none";
import SearchPage from "./page/search-page";
import SignupPage from "./page/signup";
import PaperList from "./page/PaperList";
import PaperDetails from "./page/PaperDetails";
import StudentProfile from "./page/StudentProfile";
import GameLaunch from "./page/GameLaunch";
import AutoCapture from "./page/CameraCapturing";
import MathsLectures from "./page/MathsLectures";
import MathsLectureView from "./page/MathsLecture-view";
import MathsCompiler from "./page/MathsCompiler";
import StartingPaper from "./page/StartingPaper";

function App() {
  return (
      <BrowserRouter>
        <ScrollToTop />

        <Routes>
          {/* Public Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="forgetpass" element={<ForgetPass />} />


          {/* Protected Routes: Requires Login */}
          <Route element={<ProtectedRoute />}>

            <Route path="starting-paper/" element={<StartingPaper />} />

            <Route path="maths-lectures" element={<MathsLectures />} />
            <Route path="maths-view/:id" element={<MathsLectureView />} />

            <Route path="compiler" element={<MathsCompiler />} />

            <Route path="paperlist" element={<PaperList />} />
            <Route path="paper-details/:paperId" element={<PaperDetails />} />



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



// // App.jsx - Starting Paper routes updated section
// // මෙය ඔබේ App.jsx හි ඇති starting-paper route replace කරන්න.
//
// // Import කල යුතු files:
// import GradeSelectPage from "./page/starting-paper/GradeSelectPage";
// import StartingPaperPage from "./page/starting-paper/StartingPaperPage";
// import PracticePaperPage from "./page/starting-paper/PracticePaperPage";
// import SummaryPage from "./page/starting-paper/SummaryPage";
//
// // ── App.jsx Routes section ────────────────────────────────────────────────────
// // ProtectedRoute block ඇතුළේ පැරණි line:
// //   <Route path="starting-paper/" element={<StartingPaper />} />
// // Replace with:
//
// /*
//   <Route path="starting-paper/" element={<GradeSelectPage />} />
//   <Route path="starting-paper/paper" element={<StartingPaperPage />} />
//   <Route path="starting-paper/practice" element={<PracticePaperPage />} />
//   <Route path="starting-paper/summary" element={<SummaryPage />} />
// */
//
// // ── Full updated App.jsx ──────────────────────────────────────────────────────
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import "swiper/css";
// import ScrollToTop from "./component/layout/ScrollToTop";
// import ProtectedRoute from "./ProtectedRoute";
// import ErrorPage from "./page/404";
// import AboutPage from "./page/about";
// import ContactPage from "./page/contact";
// import ForgetPass from "./page/forgetpass";
// import Home from "./page/home";
// import LoginPage from "./page/login";
// import SearchNone from "./page/search-none";
// import SearchPage from "./page/search-page";
// import SignupPage from "./page/signup";
// import PaperList from "./page/PaperList";
// import PaperDetails from "./page/PaperDetails";
// import StudentProfile from "./page/StudentProfile";
// import GameLaunch from "./page/GameLaunch";
// import AutoCapture from "./page/CameraCapturing";
// import MathsLectures from "./page/MathsLectures";
// import MathsLectureView from "./page/MathsLecture-view";
// import MathsCompiler from "./page/MathsCompiler";
// import LatestPapers from "./component/section/latest-papers";
//
// function App() {
//   return (
//       <BrowserRouter>
//         <ScrollToTop />

//         <Routes>
//           {/* Public Routes */}
//           <Route path="login" element={<LoginPage />} />
//           <Route path="signup" element={<SignupPage />} />
//           <Route path="forgetpass" element={<ForgetPass />} />
//
//           {/* Protected Routes */}
//           <Route element={<ProtectedRoute />}>
//
//             {/* ── Starting Paper (4 pages) ── */}
//             <Route path="starting-paper/" element={<GradeSelectPage />} />
//             <Route path="starting-paper/paper" element={<StartingPaperPage />} />
//             <Route path="starting-paper/practice" element={<PracticePaperPage />} />
//             <Route path="starting-paper/summary" element={<SummaryPage />} />
//
//             <Route path="maths-lectures" element={<MathsLectures />} />
//             <Route path="maths-view/:id" element={<MathsLectureView />} />
//             <Route path="compiler" element={<MathsCompiler />} />
//             <Route path="paperlist" element={<PaperList />} />
//             <Route path="paper-details/:paperId" element={<PaperDetails />} />
//             <Route path="studentprofile" element={<StudentProfile />} />
//             <Route path="/" element={<Home />} />
//             <Route path="game-launch" element={<GameLaunch />} />
//             <Route path="paper-view" element={<PaperList />} />
//             <Route path="visual-learning" element={<MathsLectures />} />
//             <Route path="search-page/:name" element={<SearchPage />} />
//             <Route path="about" element={<AboutPage />} />
//             <Route path="search-none" element={<SearchNone />} />
//             <Route path="contact" element={<ContactPage />} />
//           </Route>
//
//           <Route path="*" element={<ErrorPage />} />
//         </Routes>
//       </BrowserRouter>
//   );
// }
//
// export default App;
