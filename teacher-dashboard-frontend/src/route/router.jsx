import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";

import TeacherGuide from "../pages/teacher-guide/teacher-guide";
import AddTeacherGuide from "../pages/teacher-guide/add-teacher-guide";
import UpdateTeacherGuide from "../pages/teacher-guide/update-teacher-guide";
import TeacherGuideFeedback from "../pages/teacher-guide/teacher-guide-feedback";

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



        ]
    },

])