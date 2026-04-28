import InfoPage from "../component/layout/InfoPage";

const ChangelogPage = () => {
  return (
    <InfoPage
      title="Changelog"
      curPage="Changelog"
      intro="This changelog page highlights the types of improvements Maths Buddy continues to make as the learning experience grows."
      sections={[
        {
          heading: "Recent Improvements",
          body: "The platform is evolving toward a smoother and more student-friendly flow.",
          points: [
            "Cleaner navigation between lessons, profile progress, and practice areas.",
            "Stronger visual polish across learner-facing pages and actions.",
            "Better support pathways through contact and feedback experiences.",
          ],
        },
        {
          heading: "What Updates Usually Mean",
          body: "Most updates are meant to remove friction and improve clarity rather than disrupt familiar workflows.",
          points: [
            "Interface refinements help students focus on tasks faster.",
            "Content updates improve accuracy and lesson usefulness.",
            "Support and policy pages are expanded as the platform matures.",
          ],
        },
      ]}
    />
  );
};

export default ChangelogPage;
