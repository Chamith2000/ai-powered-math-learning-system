export const menuList = [
    {
        id: 0,
        name: "dashboards",
        path: "/",
        icon: 'feather-monitor',
        dropdownMenu: [
            {
                id: 1,
                name: "CRM",
                path: "/",
                subdropdownMenu: false
            }
        ]
    },
    {
        id: 8,
        name: "Teacher Guide",
        path: "#",
        icon: 'feather-activity',
        dropdownMenu: [
            {
                id: 1,
                name: "Teacher Guide List",
                path: "/admin/teacher-guide",
                subdropdownMenu: false
            },
            {
                id: 2,
                name: "Add New Teacher Guide",
                path: "/admin/teacher-guide/create",
                subdropdownMenu: false
            }
        ]
    },
    {
        id: 100,
        name: "Starting Papers",
        path: "#",
        icon: 'feather-file-text',
        dropdownMenu: [
            {
                id: 1,
                name: "Staring List",
                path: "/admin/starting-papers",
                subdropdownMenu: false
            },
            {
                id: 2,
                name: "Add New Paper",
                path: "/admin/starting-papers/create",
                subdropdownMenu: false
            }
        ]
    },
    {
        id: 9,
        name: "Maths Video Lectures",
        path: "#",
        icon: 'feather-shield',
        dropdownMenu: [
            {
                id: 1,
                name: "Maths Video Lectures List",
                path: "/admin/maths-lectures",
                subdropdownMenu: false
            },
            {
                id: 2,
                name: "Add New Video Lecture",
                path: "/admin/maths-lectures/create",
                subdropdownMenu: false
            }
        ]
    },
    {
        id: 10,
        name: "Maths Papers",
        path: "#",
        icon: 'feather-file-text',
        dropdownMenu: [
            {
                id: 1,
                name: "Paper List",
                path: "/admin/maths-papers",
                subdropdownMenu: false
            },
            {
                id: 2,
                name: "Add New Paper",
                path: "/admin/maths-papers/create",
                subdropdownMenu: false
            }
        ]
    },
    {
        id: 2,
        name: "Users",
        path: "#",
        icon: 'feather-users',
        dropdownMenu: [
            {
                id: 1,
                name: "User List",
                path: "/admin/user-list",
                subdropdownMenu: false
            },

        ]
    },
    {
        id: 11,
        name: "Monitoring",
        path: "#",
        icon: 'feather-eye',
        dropdownMenu: [
            {
                id: 1,
                name: "Activity Logs",
                path: "/admin/paper-logs",
                subdropdownMenu: false
            }
        ]
    },
    {
        id: 12,
        name: "Support",
        path: "#",
        icon: 'feather-help-circle',
        dropdownMenu: [
            {
                id: 1,
                name: "Help",
                path: "/admin/help",
                subdropdownMenu: false
            },
            {
                id: 2,
                name: "Terms",
                path: "/admin/terms",
                subdropdownMenu: false
            },
            {
                id: 3,
                name: "Privacy",
                path: "/admin/privacy",
                subdropdownMenu: false
            }
        ]
    }

]
