import { useState } from "react";

const faqList = [
    {
        title: "Is this maths platform free?",
        desc: "Yes! All of our core lectures, adventures, and interactive games are completely free to enjoy. We want every child to have the superpower of maths!",
    },
    {
        title: "Do I need to download an app?",
        desc: "Nope! You can play and learn right here in your web browser. Whether on a tablet, laptop, or phone, the fun goes wherever you go.",
    },
    {
        title: "What if I get stuck on a puzzle?",
        desc: "Don't worry! Every exercise has helpful hints provided by our friendly mentors. You can also watch a quick video to help you crack the code.",
    },
    {
        title: "Can parents track progress?",
        desc: "Absolutely. Parents can log into the Kids Profile dashboard to see recent achievements, total practice time, and new magical badges earned.",
    }
];

const Faq = () => {
    const [activeIndex, setActiveIndex] = useState(-1);

    const toggleFaq = (index) => {
        setActiveIndex(activeIndex === index ? -1 : index);
    };

    return (
        <div className="faq-section padding-tb">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-12">
                        <div className="section-header text-center">
                            <h2 className="title">Got Questions? 💭</h2>
                            <p>Here are some of the most common questions from our parents and little heroes!</p>
                        </div>
                        <div className="faq-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {faqList.map((faq, i) => (
                                <div key={i} className="faq-item lms-card" style={{ padding: '0', cursor: 'pointer', transition: 'all 0.3s' }}>
                                    <div 
                                        className="faq-title" 
                                        onClick={() => toggleFaq(i)}
                                        style={{ 
                                            padding: '20px 25px', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            background: activeIndex === i ? 'rgba(139, 92, 246, 0.1)' : 'transparent'
                                        }}
                                    >
                                        <h5 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--lms-primary-dark)' }}>{faq.title}</h5>
                                        <i className={`icofont-rounded-${activeIndex === i ? 'up' : 'down'}`} style={{ fontSize: '1.5rem', color: 'var(--lms-accent)' }}></i>
                                    </div>
                                    <div 
                                        className="faq-content" 
                                        style={{ 
                                            maxHeight: activeIndex === i ? '200px' : '0', 
                                            overflow: 'hidden', 
                                            transition: 'max-height 0.3s ease-in-out',
                                            padding: activeIndex === i ? '0 25px 25px 25px' : '0 25px'
                                        }}
                                    >
                                        <p style={{ margin: 0 }}>{faq.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Faq;
