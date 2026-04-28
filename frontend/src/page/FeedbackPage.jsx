import InfoPage from "../component/layout/InfoPage";

const FeedbackPage = () => {
  return (
    <InfoPage
      title="Feedback"
      curPage="Feedback"
      intro="We use feedback to improve lessons, polish the student experience, and fix the small rough edges that can make learning feel harder than it should."
      sections={[
        {
          heading: "What We Want To Hear",
          body: "Helpful feedback is specific, kind, and connected to a real learning moment.",
          points: [
            "Tell us which lesson, game, or page felt confusing or especially useful.",
            "Share technical issues like missing content, broken buttons, or slow screens.",
            "Let us know what children enjoyed so we can build more of it.",
          ],
        },
        {
          heading: "Best Way To Reach Us",
          body: "If you want the team to review a problem quickly, include enough context for us to reproduce it.",
          points: [
            "Use the Contact Us page for detailed platform feedback.",
            "Mention the feature name and what you expected to happen.",
            "Add device or browser details if the issue seems technical.",
          ],
        },
      ]}
    />
  );
};

export default FeedbackPage;
