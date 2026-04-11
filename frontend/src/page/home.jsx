import { Component, Fragment } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import Banner from "../component/section/banner";
import Category from "../component/section/category";
import LatestCourse from "../component/section/latest-courses";
import LatestPapers from "../component/section/latest-papers";
import HomeDiscovery from "../component/section/HomeDiscovery";
import HowItWorks from "../component/section/HowItWorks";
import AchievementTwo from "../component/section/achievement-2";
import Faq from "../component/section/faq";

import ContactBanner from "../component/section/contact-banner";
import NewsLetter from "../component/section/newsletter";


const Home = () => {
    return (
        <Fragment>
            <Header />
            <Banner />
            <Category />
            <LatestCourse />
            <HomeDiscovery />
            <HowItWorks />
            <AchievementTwo />
            <LatestPapers />

            <Faq />
            <ContactBanner />
            <NewsLetter />
            <Footer />
        </Fragment>
    );
}

export default Home;