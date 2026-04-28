import InfoPage from "../component/layout/InfoPage";

const DocumentationPage = () => {
  return (
    <InfoPage
      title="Documentation"
      curPage="Documentation"
      intro="Find the key guides that help students, parents, and teachers get started with Maths Buddy, use the learning tools confidently, and understand how the platform fits into day-to-day study."
      sections={[
        {
          heading: "Getting Started",
          body: "These basics help a learner begin smoothly and avoid confusion during the first session.",
          points: [
            "Create your account and complete the student profile before starting lessons.",
            "Use the maths lectures area to watch concept videos in a simple learning order.",
            "Try papers and games after each lesson to build confidence through practice.",
          ],
        },
        {
          heading: "Learning Tools",
          body: "Maths Buddy includes different learning surfaces so children can move between explanation, practice, and feedback without friction.",
          points: [
            "Video lectures explain concepts with child-friendly pacing and visuals.",
            "Practice papers help track readiness and identify weak areas.",
            "Games and coding-based activities turn revision into active problem solving.",
          ],
        },
      ]}
    />
  );
};

export default DocumentationPage;
