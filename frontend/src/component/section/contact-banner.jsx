import { Link } from "react-router-dom";

const ContactBanner = () => {
    return (
        <div className="contact-banner padding-tb" style={{ position: 'relative', marginTop: '40px' }}>
            <div className="container">
                <div 
                    className="lms-card text-center" 
                    style={{ 
                        padding: '60px 30px', 
                        background: 'linear-gradient(135deg, var(--lms-accent) 0%, var(--lms-accent-dark) 100%)',
                        borderColor: 'var(--lms-accent-light)',
                        boxShadow: '0 10px 0 var(--lms-accent-dark)'
                    }}
                >
                    <h2 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '20px' }}>
                        Need a Little Extra Magic? ✨
                    </h2>
                    <p style={{ color: 'white', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 30px auto' }}>
                        Our friendly support team is always here to help parents and mentors with any questions or technical spells!
                    </p>
                    <Link 
                        to="/contact" 
                        className="btn" 
                        style={{ 
                            background: 'white', 
                            color: 'var(--lms-accent-dark)',
                            padding: '16px 40px',
                            fontSize: '1.2rem',
                            boxShadow: '0 6px 0 rgba(0,0,0,0.2)'
                        }}
                    >
                        Talk to Us Today 🚀
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ContactBanner;
