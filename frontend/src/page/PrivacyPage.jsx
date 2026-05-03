import InfoPage from "../component/layout/InfoPage";

const PrivacyPage = () => {
  return (
    <InfoPage
      title="Privacy Policy"
      curPage="Privacy"
      intro="Maths Buddy takes student privacy seriously. This page gives a simple overview of what information is used and why it matters to the learning experience."
      sections={[
        {
          heading: "Information We Use",
          body: "We keep only the information needed to support accounts, learning history, and communication.",
          points: [
            "Basic profile information helps personalize the student experience.",
            "Progress data helps show completed work and recommend next steps.",
            "Messages sent through contact forms are used to respond to support requests.",
          ],
        },
        {
          heading: "How It Helps Learners",
          body: "The goal of collecting data is to make learning smoother, safer, and more useful for families and educators.",
          points: [
            "Progress tracking helps students continue from where they left off.",
            "Support requests help the team respond to technical or learning issues.",
            "Reasonable safeguards are used to protect account-related information.",
          ],
        },
      ]}
    />
  );
};

export default PrivacyPage;
