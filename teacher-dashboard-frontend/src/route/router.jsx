import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import LayoutAuth from "../layout/layoutAuth";
import LoginCreative from "../pages/login-creative";
import ResetCreative from "../pages/reset-creative";


import TeacherGuide from "../pages/teacher-guide/teacher-guide";
import AddTeacherGuide from "../pages/teacher-guide/add-teacher-guide";
import UpdateTeacherGuide from "../pages/teacher-guide/update-teacher-guide";
import TeacherGuideFeedback from "../pages/teacher-guide/teacher-guide-feedback";
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