import InfoPage from "../component/layout/InfoPage";

const StatusPage = () => {
  return (
    <InfoPage
      title="System Status"
      curPage="Status"
      intro="This page explains the kinds of service signals users should expect when Maths Buddy is running normally and what to do if something feels off."
      sections={[
        {
          heading: "Normal Platform Health",
          body: "When the platform is healthy, core learning flows should behave consistently.",
          points: [
            "Students can log in and open their learning pages normally.",
            "Lectures, papers, and profile data should load without unusual delay.",
            "Contact forms and feedback actions should complete without repeated errors.",
          ],
        },
        {
          heading: "If Something Looks Wrong",
          body: "A temporary issue does not always mean a full outage, but it is worth reporting patterns.",
          points: [
            "Refresh the page and try again after a short wait.",
            "Check whether the issue affects one page or the whole platform.",
            "Contact support if the same problem continues for multiple attempts.",
          ],
        },
      ]}
    />
  );
};

export default StatusPage;
