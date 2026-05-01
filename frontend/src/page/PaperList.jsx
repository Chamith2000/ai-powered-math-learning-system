import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import Pagination from "../component/sidebar/pagination";
import paperimg from "../assets/images/papers/paperimg.jpg";
import apiClient from "../api";

const PaperList = () => {
  const userId = localStorage.getItem("userId");
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const difficultyLevel = (localStorage.getItem("difficultyLevel") || "").trim().toLowerCase();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, papers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [papersRes, userRes] = await Promise.all([
        apiClient.get("/api/maths/papers"),
        userId ? apiClient.get(`/api/users/${userId}`).catch(() => ({ data: null })) : Promise.resolve({ data: null })
      ]);

      const currentUser = userRes.data;
      let rawPapers = Array.isArray(papersRes.data) ? papersRes.data : [];

      // --- Grade Filtering Logic ---
      if (currentUser && currentUser.role !== 'admin' && currentUser.grade) {
        rawPapers = rawPapers.filter(paper => paper.grade && Number(paper.grade) === Number(currentUser.grade));
      }

      setPapers(rawPapers);
      setFilteredPapers(rawPapers);
    } catch (error) {
      setError("Failed to fetch papers.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filtered = papers.filter((paper) =>
        paper.paperTytle.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPapers(filtered);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const isPaperRecommended = (paperDifficulty) => {
    const pd = (paperDifficulty || "").trim().toLowerCase();
    return difficultyLevel && pd === difficultyLevel;
  };

  return (
      <Fragment>
        <Header />
        <PageHeader title={<><i className="icofont-paper me-2"></i>Maths Papers</>} curPage={"Papers"} />

        <div className="paper-filter-section">
          <div className="container">
            <div className="paper-filter-card">
              <div className="row align-items-center g-3">
                <div className="col-lg-3 col-md-4 text-center text-md-start">
                  <h4 className="paper-filter-title">
                    <i className="icofont-search-document"></i>
                    Find Papers
                  </h4>
                </div>
                <div className="col-lg-6 col-md-8">
                  <form className="paper-search-form" onSubmit={(e) => e.preventDefault()}>
                    <i className="icofont-search-1"></i>
                    <input
                        type="text"
                        className="paper-search-input lms-input-no-border"
                        placeholder="Search by paper title..."
                        value={searchQuery}
                        onChange={handleInputChange}
                    />
                  </form>
                </div>
                <div className="col-lg-3 text-center text-lg-end">
                  <span className="paper-count-pill">
                    <i className="icofont-listing-box"></i>
                    {filteredPapers.length} Papers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="blog-section padding-tb paper-list-section" style={{ minHeight: "80vh" }}>
          <div className="container">
            <div className="paper-list-heading d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h3 className="mb-1"><i className="icofont-paper me-2"></i>Question Paper Hub</h3>
                <p className="mb-0">Choose a paper that matches your current learning level.</p>
              </div>
              {difficultyLevel && (
                  <span className="paper-level-pill">
                    <i className="icofont-dart"></i>
                    Recommended: {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
                  </span>
              )}
            </div>

            <div className="row justify-content-center">
              <div className="col-12">
                {loading ? (
                    <div className="paper-empty-state text-center">
                      <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                      <h4 className="text-info mt-3 fw-bold"><i className="icofont-clock-time me-2"></i>Loading Papers...</h4>
                    </div>
                ) : error ? (
                    <div className="paper-empty-state alert alert-danger text-center">
                      <h4><i className="icofont-warning-alt me-2"></i>Oops!</h4>
                      <p>{error}</p>
                    </div>
                ) : filteredPapers.length > 0 ? (
                    <article>
                      <div className="section-wrapper">
                        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 justify-content-center g-4">
                          {filteredPapers.map((paper) => (
                              <div className="col" key={paper._id}>
                                <div
                                    className="card h-100 paper-list-card"
                                >
                                  <div className="paper-list-thumb position-relative">
                                    {isPaperRecommended(paper.paperDifficulty) && (
                                        <span className="paper-recommended-badge">
                                  <i className="icofont-star me-1"></i>Recommended
                                </span>
                                    )}
                                    <Link to={`/paper-details/${paper._id}`} className="d-block w-100">
                                      <img src={paperimg} alt="Paper Thumbnail" className="w-100" />
                                    </Link>
                                  </div>

                                  <div className="card-body p-4 d-flex flex-column">
                                    <Link to={`/paper-details/${paper._id}`} className="text-decoration-none">
                                      <h4 className="paper-card-title mb-3">{paper.paperTytle}</h4>
                                    </Link>

                                    <div className="paper-card-meta mb-3">
                                      <span><i className="icofont-calendar"></i> {new Date(paper.createdAt).toLocaleDateString()}</span>
                                      <span><i className="icofont-graduate-alt"></i> {paper.teacherGuideId?.coureInfo || "Course"}</span>
                                    </div>

                                    <div className="paper-card-difficulty mt-auto mb-4">
                                      <span>Difficulty</span>
                                      <span className={`badge rounded-pill fs-6 ${paper.paperDifficulty === 'Easy' ? 'bg-success' :
                                          paper.paperDifficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger'
                                      }`}>
                                  {paper.paperDifficulty} <i className={paper.paperDifficulty === 'Easy' ? 'icofont-leaf' : paper.paperDifficulty === 'Medium' ? 'icofont-lightning-ray' : 'icofont-fire'}></i>
                                </span>
                                    </div>

                                    <Link
                                        to={`/paper-details/${paper._id}`}
                                        className="btn btn-primary rounded-pill w-100 fw-bold py-2 paper-start-btn"
                                    >
                                      Open Paper <i className="icofont-paper-plane ms-2"></i>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                        <div className="mt-5 text-center">
                          <Pagination />
                        </div>
                      </div>
                    </article>
                ) : (
                    <div className="paper-empty-state text-center">
                      <h3 className="fw-bold"><i className="icofont-search-document me-2"></i>No Papers Found</h3>
                      <p className="text-dark fs-5">Try searching for another paper title.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </Fragment>
  );
};

export default PaperList;


// import { Fragment, useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import Footer from "../component/layout/footer";
// import Header from "../component/layout/header";
// import PageHeader from "../component/layout/pageheader";
// import Pagination from "../component/sidebar/pagination";
// import paperimg from "../assets/images/papers/paperimg.jpg";
// import apiClient from "../api";
//
// const PaperList = () => {
//   const [papers, setPapers] = useState([]);
//   const [filteredPapers, setFilteredPapers] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const difficultyLevel = (localStorage.getItem("difficultyLevel") || "").trim().toLowerCase();
//
//   useEffect(() => {
//     fetchPapers();
//   }, []);
//
//   useEffect(() => {
//     handleSearch();
//   }, [searchQuery, papers]);
//
//   const fetchPapers = async () => {
//     try {
//       const response = await apiClient.get("/api/maths/papers");
//       setPapers(response.data);
//       setFilteredPapers(response.data);
//       setLoading(false);
//     } catch (error) {
//       setError("Failed to fetch papers.");
//       setLoading(false);
//     }
//   };
//
//   const handleSearch = () => {
//     const filtered = papers.filter((paper) =>
//       paper.paperTytle.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     setFilteredPapers(filtered);
//   };
//
//   const handleInputChange = (e) => {
//     setSearchQuery(e.target.value);
//   };
//
//   const isPaperRecommended = (paperDifficulty) => {
//     const pd = (paperDifficulty || "").trim().toLowerCase();
//     return difficultyLevel && pd === difficultyLevel;
//   };
//
//   return (
//     <Fragment>
//       <Header />
//       <PageHeader title={"Available Adventures!"} curPage={"Papers"} />
//       <div className="blog-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB", minHeight: "80vh", fontFamily: "'Nunito', sans-serif" }}>
//         <div className="container">
//           <div className="row justify-content-center">
//             {/* Sidebar */}
//             <div className="col-lg-3 col-12 mb-4 mb-lg-0">
//               <aside>
//                 <div className="widget widget-search p-4 rounded-4 shadow-sm" style={{ backgroundColor: "#fff", border: "2px solid #E0E7FF", borderRadius: "24px" }}>
//                   <form className="search-wrapper" onSubmit={(e) => e.preventDefault()}>
//                     <input
//                       type="text"
//                       className="form-control rounded-pill px-4 mb-3"
//                       style={{ border: "2px solid #00b4d8", height: "50px", fontSize: "1.1rem" }}
//                       placeholder="Find an adventure..."
//                       value={searchQuery}
//                       onChange={handleInputChange}
//                     />
//                   </form>
//                 </div>
//                 <div className="widget widget-category mt-4 p-4 rounded-4 shadow-sm" style={{ backgroundColor: "#fff", border: "2px solid #E0E7FF", borderRadius: "24px" }}>
//                   <div className="widget-header mb-3">
//                     <h4 className="title fw-bold" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>Quick Links</h4>
//                   </div>
//                   <ul className="widget-wrapper list-unstyled">
//                     {filteredPapers.slice(0, 5).map((paper) => (
//                       <li key={paper._id} className="mb-2">
//                         <Link
//                           to={`/paper-details/${paper._id}`}
//                           className="d-block w-100 btn rounded-pill text-start fw-bold"
//                           style={{ transition: "all 0.2s", border: "2px solid #818CF8", color: "#4F46E5", borderRadius: "50px" }}
//                         >
//                           ⭐ {paper.paperTytle}
//                         </Link>
//                       </li>
//                     ))}
//                     {filteredPapers.length > 5 && (
//                       <li className="text-muted text-center mt-2 small">...and more!</li>
//                     )}
//                   </ul>
//                 </div>
//               </aside>
//             </div>
//
//             {/* Main Content */}
//             <div className="col-lg-9 col-12">
//               {loading ? (
//                 <div className="text-center mt-5">
//                   <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }} role="status"></div>
//                   <h4 className="text-info mt-3 fw-bold">Loading Adventures...</h4>
//                 </div>
//               ) : error ? (
//                 <div className="alert alert-danger rounded-4 text-center p-4">
//                   <h4>Oops! </h4>
//                   <p>{error}</p>
//                 </div>
//               ) : filteredPapers.length > 0 ? (
//                 <article>
//                   <div className="section-wrapper">
//                     <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 justify-content-center g-4">
//                       {filteredPapers.map((paper) => (
//                         <div className="col" key={paper._id}>
//                           <div
//                             className="card h-100 border-0 shadow-sm"
//                             style={{
//                               borderRadius: "24px",
//                               overflow: "hidden",
//                               transition: "all 0.3s ease",
//                               border: "2px solid #E5E7EB",
//                               borderBottom: "6px solid #F59E0B"
//                             }}
//                             onMouseEnter={(e) => {
//                               e.currentTarget.style.transform = "translateY(-10px)";
//                               e.currentTarget.style.boxShadow = "0 15px 40px rgba(79, 70, 229, 0.18)";
//                               e.currentTarget.style.borderColor = "#818CF8";
//                             }}
//                             onMouseLeave={(e) => {
//                               e.currentTarget.style.transform = "translateY(0)";
//                               e.currentTarget.style.boxShadow = "0 4px 20px rgba(79, 70, 229, 0.08)";
//                               e.currentTarget.style.borderColor = "#E5E7EB";
//                             }}
//                           >
//                             <div className="position-relative">
//                               {isPaperRecommended(paper.paperDifficulty) && (
//                                 <span className="position-absolute badge bg-success fs-6 rounded-pill shadow-sm" style={{ top: 10, left: 10, zIndex: 2 }}>
//                                   Recommended!
//                                 </span>
//                               )}
//                               <Link to={`/paper-details/${paper._id}`} className="d-block w-100">
//                                 <img src={paperimg} alt="Paper Thumbnail" className="w-100" style={{ height: "180px", objectFit: "cover" }} />
//                               </Link>
//                             </div>
//
//                             <div className="card-body p-4 d-flex flex-column">
//                               <Link to={`/paper-details/${paper._id}`} className="text-decoration-none">
//                                 <h4 className="card-title fw-bold mb-3" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>{paper.paperTytle}</h4>
//                               </Link>
//
//                               <div className="d-flex justify-content-between text-muted mb-3 small">
//                                 <span><i className="icofont-calendar text-info"></i> {new Date(paper.createdAt).toLocaleDateString()}</span>
//                                 <span><i className="icofont-graduate-alt text-warning"></i> {paper.teacherGuideId?.coureInfo || "Course"}</span>
//                               </div>
//
//                               <p className="card-text mt-auto mb-4">
//                                 <strong className="me-2">Difficulty:</strong>
//                                 <span className={`badge rounded-pill fs-6 ${paper.paperDifficulty === 'Easy' ? 'bg-success' :
//                                   paper.paperDifficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger'
//                                   }`}>
//                                   {paper.paperDifficulty} {paper.paperDifficulty === 'Easy' ? '' : paper.paperDifficulty === 'Medium' ? '' : ''}
//                                 </span>
//                               </p>
//
//                               <Link
//                                 to={`/paper-details/${paper._id}`}
//                                 className="btn rounded-pill w-100 fw-bold py-2"
//                                 style={{ background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", border: "none", borderRadius: "50px" }}
//                               >
//                                 Let's Play!
//                               </Link>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                     <div className="mt-5 text-center">
//                       <Pagination />
//                     </div>
//                   </div>
//                 </article>
//               ) : (
//                 <div className="text-center mt-5 p-5 bg-white rounded-4 shadow-sm" style={{ border: "2px solid #F59E0B", borderRadius: "24px", color: "#D97706" }}>
//                   <h3 className="fw-bold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>No Adventures Found! </h3>
//                   <p className="fs-5" style={{ color: "#374151" }}>Try searching for something else!</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </Fragment>
//   );
// };
//
// export default PaperList;
