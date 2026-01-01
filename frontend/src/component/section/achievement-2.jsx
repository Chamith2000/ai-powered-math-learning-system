import CountUp from 'react-countup';

const subTitle = "START YOUR PYTHON ADVENTURE";
const title = "Achieve Your Coding Goals with PyKids";

const achievementList = [
  {
    count: '2500',
    desc: 'Kids Learning Python with Us',
  },
  {
    count: '600',
    desc: 'Hands-On Challenges & Quizzes',
  },
  {
    count: '120',
    desc: 'Friendly Mentors & Helpers',
  },
  {
    count: '300',
    desc: 'Beginner-Friendly Lessons & Projects',
  },
];

const AchievementTwo = () => {
  return (
    <div className="achievement-section padding-tb">
      <div className="container">
        <div className="section-header text-center">
          <span className="subtitle">{subTitle}</span>
          <h2 className="title">{title}</h2>
        </div>
        <div className="section-wrapper">
          <div className="counter-part mb-4">
            <div className="row g-4 row-cols-lg-4 row-cols-sm-2 row-cols-1 justify-content-center">
              {achievementList.map((val, i) => (
                <div className="col" key={i}>
                  <div className="count-item">
                    <div className="count-inner">
                      <div className="count-content">
                        <h2>
                          <span className="count"><CountUp end={val.count} /></span>
                          <span>+</span>
                        </h2>
                        <p>{val.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AchievementTwo;
