import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../api";

const subTitle = "Popular Category";
const title = "Popular Category For Learning";
const btnText = "Browse All Categories";

const Category = () => {
    const [videoLectureCount, setVideoLectureCount] = useState(0);
    const [paperCount, setPaperCount] = useState(0);

    useEffect(() => {
        fetchPapers();
        fetchVideoLectures();
    }, []);

    const fetchVideoLectures = async () => {
        try {
            const response = await apiClient.get("api/maths/video-lectures");
            setVideoLectureCount(response.data.length);
        } catch (error) {
            console.error("Error fetching video lectures:", error);
        }
    };


    const fetchPapers = async () => {
        try {
            const response = await apiClient.get("/api/maths/papers");
            setPaperCount(response.data.length);
        } catch (error) {
            console.error("Error fetching:", error);
        }
    };  
      

    const categoryList = [
        {
            imgUrl: 'assets/images/category/icon/01.jpg',
            imgAlt: 'category',
            title: 'Maths Lecture videos',
            count: `${videoLectureCount} Videos`,
            url: '/maths-lectures',
        },
        {
            imgUrl: 'assets/images/category/icon/02.jpg',
            imgAlt: 'category',
            title: 'Maths Lecture Papers',
            count: `${paperCount} Activities`,
            url: '/paperlist',
        },
        {
            imgUrl: 'assets/images/category/icon/16.jpg',
            imgAlt: 'category',
            title: 'Maths Fun Games',
            count: `3 Games`,
            url: '/game-launch',
        },
    ];

    return (
        <div className="category-section padding-tb lms-section-bg" style={{ backgroundColor: "#F9FAFB" }}>
            <div className="container">
                <div className="section-header text-center lms-section-header">
                    <span className="subtitle" style={{ color: "#4F46E5", fontWeight: "800" }}>{subTitle}</span>
                    <h2 className="title" style={{ fontSize: "2rem", fontFamily: "'Baloo 2', sans-serif" }}>{title}</h2>
                </div>
                <div className="section-wrapper">
                    <div className="row g-2 justify-content-center row-cols-xl-6 row-cols-md-3 row-cols-sm-2 row-cols-1">
                        {categoryList.map((val, i) => (
                            <div className="col" key={i}>
                                <div className="category-item text-center">
                                    <div className="category-inner" style={{ minHeight: "280px", borderRadius: "24px", border: "2px solid #E0E7FF", padding: "24px", transition: "all 0.3s ease", backgroundColor: "white" }}>
                                        <div className="category-thumb" style={{ marginBottom: "16px" }}>
                                            <img src={`${val.imgUrl}`} alt={val.imgAlt} style={{ borderRadius: "16px", width: "80px", height: "80px", objectFit: "cover" }} />
                                        </div>
                                        <div className="category-content">
                                            <Link to={val.url} style={{ textDecoration: "none", color: "#4F46E5", fontWeight: "700", fontSize: "1.1rem" }}>
                                                <h6 style={{ fontSize: "1.15rem", fontFamily: "'Baloo 2', sans-serif" }}>{val.title}</h6>
                                            </Link>
                                            <span style={{ display: "block", marginTop: "8px", color: "#6B7280", fontSize: "0.95rem" }}>{val.count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* <div className="text-center mt-5">
                        <Link to="/course" className="lab-btn">
                            <span>{btnText}</span>
                        </Link>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default Category;
