import { Fragment } from "react";
import Footer from "./footer";
import Header from "./header";
import PageHeader from "./pageheader";

const InfoPage = ({ title, curPage, intro, sections }) => {
  return (
    <Fragment>
      <Header />
      <PageHeader title={title} curPage={curPage} />

      <section
        className="padding-tb"
        style={{
          background:
            "linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%)",
        }}
      >
        <div className="container">
          <div
            className="mb-5"
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <span
              className="badge rounded-pill px-4 py-2 mb-3"
              style={{
                backgroundColor: "#e0e7ff",
                color: "#3730a3",
                fontWeight: 800,
              }}
            >
              Maths Buddy Info Hub
            </span>
            <h2
              style={{
                color: "#312e81",
                fontWeight: 800,
                marginBottom: "16px",
              }}
            >
              {title}
            </h2>
            <p
              style={{
                color: "#475569",
                fontSize: "1.05rem",
                fontWeight: 600,
                lineHeight: 1.8,
                marginBottom: 0,
              }}
            >
              {intro}
            </p>
          </div>

          <div className="row g-4">
            {sections.map((section, index) => (
              <div className="col-lg-6" key={index}>
                <article
                  style={{
                    height: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    border: "1px solid #dbeafe",
                    boxShadow: "0 16px 34px rgba(37, 99, 235, 0.08)",
                    padding: "28px",
                  }}
                >
                  <h4
                    style={{
                      color: "#1d4ed8",
                      fontWeight: 800,
                      marginBottom: "14px",
                    }}
                  >
                    {section.heading}
                  </h4>
                  <p
                    style={{
                      color: "#64748b",
                      fontWeight: 600,
                      lineHeight: 1.75,
                      marginBottom: "18px",
                    }}
                  >
                    {section.body}
                  </p>

                  <ul className="lab-ul" style={{ display: "grid", gap: "10px" }}>
                    {section.points.map((point, pointIndex) => (
                      <li
                        key={pointIndex}
                        style={{
                          color: "#334155",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <span style={{ color: "#10b981", lineHeight: 1.4 }}>
                          <i className="icofont-check-circled"></i>
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </Fragment>
  );
};

export default InfoPage;
