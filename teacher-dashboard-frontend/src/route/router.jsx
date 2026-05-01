import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import LayoutAuth from "../layout/layoutAuth";
import LoginCreative from "../pages/login-creative";
import ResetCreative from "../pages/reset-creative";

//--------------------------------------------------
import PrivateRoute from "../utils/PrivateRoute";
import TeacherGuide from "../pages/teacher-guide/teacher-guide";
import AddTeacherGuide from "../pages/teacher-guide/add-teacher-guide";
import UpdateTeacherGuide from "../pages/teacher-guide/update-teacher-guide";
import TeacherGuideFeedback from "../pages/teacher-guide/teacher-guide-feedback";
import ViewTeacherGuide from "../pages/teacher-guide/view-teacher-guide";
import MathsLecture from "../pages/maths-lectures/maths-lectures";
import AddMathsLectures from "../pages/maths-lectures/add-maths-lectures";
import UpdateMathsLectures from "../pages/maths-lectures/update-maths-lectures";
import MathsPapers from "../pages/maths-papers/maths-paper";
import AddMathsPapers from "../pages/maths-papers/add-maths-paper";
import UpdateMathsPapers from "../pages/maths-papers/update-maths-paper";
import ViewMathsPapers from "../pages/maths-papers/view-maths-paper";
import StartingPapers from "../pages/starting-papers/starting-paper";
import AddStartingPapers from "../pages/starting-papers/add-starting-paper";
import UpdateStartingPapers from "../pages/starting-papers/starting-maths-paper";
import ViewStartingPapers from "../pages/starting-papers/view-starting-paper";
import UserDetails from "../pages/user/user-details";
import PaperLogs from "../pages/paper-logs/paper-log";
import ViewPaperLog from "../pages/paper-logs/view-paper-log";
import ViewTeacherGuideFeedback from '../pages/teacher-guide/view-teacher-guide-feedback.jsx';
import ViewLectureFeedback from '../pages/maths-lectures/view-lecture-feedback';
import AdminProfile from "../pages/AdminProfile";
import HelpPage from "../pages/static/HelpPage";
import TermsPage from "../pages/static/TermsPage";
import PrivacyPage from "../pages/static/PrivacyPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <PrivateRoute>
                <RootLayout />
            </PrivateRoute>
        ),
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/admin/teacher-guide",
                element: <TeacherGuide />
            },
            {
                path: "/admin/teacher-guide/create",
                element: <AddTeacherGuide />
            },
            {
                path: "/admin/teacher-guides/edit/:id",
                element: <UpdateTeacherGuide />
            },
            {
                path: "/admin/teacher-guides/view/:id",
                element: <ViewTeacherGuide />
            },
            {
                path: "/admin/teacher-guides-feedback/:id",
                element: <TeacherGuideFeedback />
            },

            {
                path: "/admin/maths-lectures",
                element: <MathsLecture />
            },
            {
                path: "/admin/maths-lectures/create",
                element: <AddMathsLectures />
            },
            {
                path: "/admin/maths-lectures/edit/:id",
                element: <UpdateMathsLectures />
            },

            {
                path: "/admin/maths-papers",
                element: <MathsPapers />
            },
            {
                path: "/admin/maths-papers/create",
                element: <AddMathsPapers />
            },
            {
                path: "/admin/maths-papers/edit/:id",
                element: <UpdateMathsPapers />
            },
            {
                path: "/admin/maths-papers/view/:id",
                element: <ViewMathsPapers />
            },

            {
                path: "/admin/starting-papers",
                element: <StartingPapers />
            },
            {
                path: "/admin/starting-papers/create",
                element: <AddStartingPapers />
            },
            {
                path: "/admin/starting-papers/edit/:id",
                element: <UpdateStartingPapers />
            },
            {
                path: "/admin/starting-papers/view/:id",
                element: <ViewStartingPapers />
            },

            {
                path: "/admin/user-list",
                element: <UserDetails />
            },
            {
                path: "/admin/profile",
                element: <AdminProfile />
            },
            {
                path: "/admin/help",
                element: <HelpPage />
            },
            {
                path: "/admin/terms",
                element: <TermsPage />
            },
            {
                path: "/admin/privacy",
                element: <PrivacyPage />
            },
            {
                path: "/admin/paper-logs",
                element: <PaperLogs />
            },
            {
                path: "/admin/paper-logs/view/:id",
                element: <ViewPaperLog />
            },

            {
                path: '/admin/teacher-guides/feedback/view/:feedbackId',
                element: <ViewTeacherGuideFeedback />
            },
            {
                path: '/admin/maths-lectures/feedback/view/:lectureId',
                element: <ViewLectureFeedback />
            },

        ]
    },
    {
        path: "/",
        element: <LayoutAuth />,
        children: [
            {
                path: "/authentication/login/creative",
                element: <LoginCreative />
            },
            {
                path: "/authentication/reset/creative",
                element: <ResetCreative />
            },
        ]
    }
])
