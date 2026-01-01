import { Component, Fragment } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import About from "../component/section/about";
import Banner from "../component/section/banner";
import Category from "../component/section/category";
import Instructor from "../component/section/instructor";
import LatestCourse from "../component/section/latest-courses";


const Home = () => {
    return (
        <Fragment>
            <Header />
            <Banner />
            <Category />
            <LatestCourse/>
            <About />
            {/* <Instructor /> */}
            <Footer />
        </Fragment>
    );
}
 
export default Home;