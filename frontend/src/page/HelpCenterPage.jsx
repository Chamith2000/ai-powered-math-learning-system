import InfoPage from "../component/layout/InfoPage";

const HelpCenterPage = () => {
  return (
    <InfoPage
      title="Help Center"
      curPage="Help Center"
      intro="The Help Center is the quick-reference corner of Maths Buddy. It is meant for fast answers when you do not need a full support conversation."
      sections={[
        {
          heading: "Quick Answers",
          body: "Start here for the common questions that appear during normal learning sessions.",
          points: [
            "Where to find lectures, papers, and games from the main navigation.",
            "How to continue after a practice session or lecture ends.",
            "What to try first if a page does not load the expected content.",
          ],
        },
        {
          heading: "When To Escalate",
          body: "If a quick answer is not enough, the support path is easy.",
          points: [
            "Use Contact Support for account or technical issues that persist.",
            "Use the Feedback page for suggestions and product improvements.",
            "Use the Contact Us page for broader questions from students or parents.",
          ],
        },
      ]}
    />
  );
};

export default HelpCenterPage;
