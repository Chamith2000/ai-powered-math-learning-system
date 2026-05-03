import InfoPage from "../component/layout/InfoPage";

const HelpPage = () => {
  return (
    <InfoPage
      title="Help"
      curPage="Help"
      intro="Need a quick hand? This page covers the most common situations students and parents run into while using Maths Buddy."
      sections={[
        {
          heading: "Account Help",
          body: "Most account problems can be resolved in a minute with the right first step.",
          points: [
            "Use the forgot password flow if you cannot sign in.",
            "Check that the correct email address was used when the account was created.",
            "Refresh the page after login if a protected section does not open immediately.",
          ],
        },
        {
          heading: "Learning Support",
          body: "The platform works best when students move between guidance and repetition instead of forcing one long session.",
          points: [
            "Replay a lecture before retrying a hard paper or challenge.",
            "Use the student profile to track progress and return to unfinished work.",
            "Visit Contact Us if you need personal guidance from the support team.",
          ],
        },
      ]}
    />
  );
};

export default HelpPage;
