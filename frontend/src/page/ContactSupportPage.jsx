import InfoPage from "../component/layout/InfoPage";

const ContactSupportPage = () => {
  return (
    <InfoPage
      title="Contact Support"
      curPage="Contact Support"
      intro="If you need direct help from the Maths Buddy team, this page points you to the fastest path and explains what details make support easier."
      sections={[
        {
          heading: "Before You Send A Request",
          body: "A little context goes a long way when the team is trying to solve a problem quickly.",
          points: [
            "Include the page name or feature where the issue happened.",
            "Explain what you clicked and what happened next.",
            "Mention whether the problem happens every time or only sometimes.",
          ],
        },
        {
          heading: "Best Support Path",
          body: "For most cases, the contact page is the best direct route.",
          points: [
            "Open the Contact Us page and send your message with full details.",
            "Use the footer email request box if you want the team to contact you back.",
            "Share screenshots when a visual bug or layout issue is involved.",
          ],
        },
      ]}
    />
  );
};

export default ContactSupportPage;
