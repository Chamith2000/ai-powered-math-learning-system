import InfoPage from "../component/layout/InfoPage";

const TermsPage = () => {
  return (
    <InfoPage
      title="Terms & Conditions"
      curPage="Terms"
      intro="These platform terms explain the basic expectations for using Maths Buddy responsibly and respectfully as a learning service."
      sections={[
        {
          heading: "Using The Platform",
          body: "Maths Buddy is designed for learning, practice, and progress tracking in a safe educational environment.",
          points: [
            "Use your own account details and keep them secure.",
            "Do not misuse learning tools, forms, or other interactive features.",
            "Respect other users, teachers, and shared learning spaces.",
          ],
        },
        {
          heading: "Content And Access",
          body: "Learning materials are provided to support student growth and may evolve as the product improves.",
          points: [
            "Platform content may be updated to improve accuracy and clarity.",
            "Some features may require login before access is granted.",
            "Continued use of the service means you accept future reasonable updates to these terms.",
          ],
        },
      ]}
    />
  );
};

export default TermsPage;
