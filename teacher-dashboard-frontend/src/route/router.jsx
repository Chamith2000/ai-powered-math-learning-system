import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import LayoutAuth from "../layout/layoutAuth";
import LoginCreative from "../pages/login-creative";
import ResetCreative from "../pages/reset-creative";

import PrivateRoute from "../utils/PrivateRoute";
import TeacherGuide from "../pages/teacher-guide/teacher-guide";
import AddTeacherGuide from "../pages/teacher-guide/add-teacher-guide";
import UpdateTeacherGuide from "../pages/teacher-guide/update-teacher-guide";
import TeacherGuideFeedback from "../pages/teacher-guide/teacher-guide-feedback";
import PythonLecture from "../pages/maths-lectures/maths-lectures";
import AddPythonLectures from "../pages/maths-lectures/add-maths-lectures";
import UpdatePythonLectures from "../pages/maths-lectures/update-maths-lectures";
import PythonPapers from "../pages/maths-papers/maths-paper";
import AddPythonPapers from "../pages/maths-papers/add-maths-paper";
import UpdatePythonPapers from "../pages/maths-papers/update-maths-paper";
import ViewPythonPapers from "../pages/maths-papers/view-maths-paper";
import VisualLearning from "../pages/visual-learning/visual-learning";
import AddVisualLearning from "../pages/visual-learning/add-visual-learning";
import UpdateVisualLearning from "../pages/visual-learning/update-visual-learning";
import ViewVisualLearning from "../pages/visual-learning/view-visual-learning";
import UserDetails from "../pages/user/user-details.jsx";
import StartingPapers from "../pages/starting-papers/starting-paper.jsx";
import AddStartingPapers from "../pages/starting-papers/add-starting-paper.jsx";
import UpdateStartingPapers from "../pages/starting-papers/starting-python-paper.jsx";
import ViewStartingPapers from "../pages/starting-papers/view-starting-paper.jsx";

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
                path: "/admin/teacher-guides-feedback/:id",
                element: <TeacherGuideFeedback />
            },
            {
                path: "/admin/user-list",
                element: <UserDetails />
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
                path: "/admin/visual-learning",
                element: <VisualLearning />
            },
            {
                path: "/admin/visual-learning/create",
                element: <AddVisualLearning />
            },
            {
                path: "/admin/visual-learning/edit/:id",
                element: <UpdateVisualLearning />
            },
            {
                path: "/admin/visual-learning/view/:id",
                element: <ViewVisualLearning />
            },

            {
                path: "/admin/maths-lectures",
                element: <PythonLecture />
            },
            {
                path: "/admin/maths-lectures/create",
                element: <AddPythonLectures />
            },
            {
                path: "/admin/maths-lectures/edit/:id",
                element: <UpdatePythonLectures />
            },

            {
                path: "/admin/maths-papers",
                element: <PythonPapers />
            },
            {
                path: "/admin/maths-papers/create",
                element: <AddPythonPapers />
            },
            {
                path: "/admin/maths-papers/edit/:id",
                element: <UpdatePythonPapers />
            },
            {
                path: "/admin/maths-papers/view/:id",
                element: <ViewPythonPapers />
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