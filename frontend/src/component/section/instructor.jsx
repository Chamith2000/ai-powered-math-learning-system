import React from "react";
import { Link } from "react-router-dom";
import Rating from "../sidebar/rating";

import Dev1 from "../../assets/images/users/dev1.jpeg";
import Dev2 from "../../assets/images/users/dev2.jpeg";
import Dev3 from "../../assets/images/users/dev3.jpeg";
import Dev4 from "../../assets/images/users/dev4.jpeg";

const subTitle = "Meet Our Development Team";
const title = "Built by Passionate Developers";

// =============================================
// EDIT YOUR TEAM DETAILS HERE
// =============================================
const STATIC_INSTRUCTORS = [
  {
    _id: "developer-1",
    firstName: "Chamith",
    lastName: "Rathdunu",
    imgUrl: Dev1,
  },
  {
    _id: "developer-2",
    firstName: "Tharuka",
    lastName: "Jayawarna",
    imgUrl: Dev2,
  },
  {
    _id: "developer-3",
    firstName: "Janendra",
    lastName: "De Silva",
    imgUrl: Dev3,
  },
  {
    _id: "developer-4",
    firstName: "Fahad",
    lastName: "Azeez",
    imgUrl: Dev4,
  },
];
// =============================================

const Instructor = () => {
  return (
      <div className="instructor-section padding-tb section-bg">
        <div className="container">
          <div className="section-header text-center">
            <span className="subtitle">{subTitle}</span>
            <h2 className="title">{title}</h2>
          </div>

          <div className="section-wrapper">
            <div className="row g-4 justify-content-center row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4">
              {STATIC_INSTRUCTORS.map((dev) => (
                  <div className="col" key={dev._id}>
                    <div className="instructor-item">
                      <div className="instructor-inner">

                        {/* Fixed image container - uniform circle crop for all images */}
                        <div className="instructor-thumb">
                          <img
                              src={dev.imgUrl}
                              alt={`${dev.firstName} ${dev.lastName}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center top",
                              }}
                          />
                        </div>

                        <div
                            className="instructor-content"
                            style={{
                              display: "block",
                              visibility: "visible",
                              opacity: 1,
                              position: "static",
                              transform: "none",
                              backgroundColor: "#fff",
                              padding: "12px 10px 10px",
                              textAlign: "center",
                            }}
                        >
                          <h4 style={{ marginBottom: "4px", fontSize: "1rem", fontWeight: "700" }}>
                            {`${dev.firstName} ${dev.lastName}`}
                          </h4>
                          <div style={{ marginTop: "6px" }}>
                            <Rating />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
              ))}
            </div>

            <div className="text-center footer-btn">
              <p>The team behind Maths Buddy - making maths fun for every child.</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Instructor;