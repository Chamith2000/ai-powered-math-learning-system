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
                path: "/admin/staring-papers/create",
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
                name: "Lecture List",
                path: "/admin/maths-lectures",
                subdropdownMenu: false
            },
            {
                id: 2,
                name: "Add New Teacher Guide",
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
    
]
