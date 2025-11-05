import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate } from "react-router-dom";

import state from "../store";
import authState from "../store/authStore";
import { CustomButton } from "../components";
import AuthButtons from "../components/AuthButtons";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { authService } from "../services/authService";
import {
  headContainerAnimation,
  headContentAnimation,
  headTextAnimation,
  slideAnimation,
} from "../config/motion";

const Home = () => {
  const navigate = useNavigate();
  const authSnap = useSnapshot(authState);

  // ADDED: Set intro to true when on homepage
  useEffect(() => {
    state.intro = true;
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const data = await authService.verifyToken(token);
          authState.user = data.user;
          authState.isAuthenticated = true;
          authState.token = token;
        } catch (error) {
          localStorage.removeItem("token");
          authState.isAuthenticated = false;
          authState.user = null;
          authState.token = null;
        }
      }
    };

    verifyUser();
  }, []);

  return (
    <>
      <motion.section className="home" {...slideAnimation("left")}>
        <motion.header
          {...slideAnimation("down")}
          className="flex justify-between items-center w-full px-8"
        >
          <img
            src="./albania.png"
            alt="logo"
            className="w-8 h-8 object-contain"
          />
          <AuthButtons />
        </motion.header>

        <motion.div className="home-content" {...headContainerAnimation}>
          <motion.div {...headTextAnimation}>
            <h1 className="head-text">Professional Stamp</h1>
          </motion.div>
          <motion.div {...headContentAnimation} className="flex flex-col gap-5">
            {authSnap.isAuthenticated ? (
              <p className="max-w-md font-normal text-green-400 text-base mb-2">
                ✓ You are logged in as{" "}
                <strong>{authSnap.user?.username}</strong>
              </p>
            ) : (
              <p className="max-w-md font-normal text-yellow-400 text-base mb-2">
                Please log in to save your designs
              </p>
            )}

            <p className="max-w-md font-normal text-gray-400 text-base">
              Create professional stamp for your shirt design. We deliver in all
              Albania!
            </p>

            <CustomButton
              type="filled"
              title="Customize It"
              handleClick={() => navigate("/customizer")}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      <LoginModal />
      <RegisterModal />
    </>
  );
};

export default Home;
