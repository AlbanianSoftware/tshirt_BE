import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fadeAnimation } from "../../config/motion";
import CustomButton from "../CustomButton";
import SaveDesignButton from "../SaveDesignButton";

const CustomizerHeader = ({
  currentDesignId,
  onAddToCart,
  onOpenCart,
  setCurrentDesignId,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="absolute z-10 top-5 right-5 flex gap-3"
      {...fadeAnimation}
    >
      {/* Community Button */}
      <button
        onClick={() => navigate("/community")}
        className="px-4 py-2.5 backdrop-blur-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white rounded-xl 
                 border border-purple-500/30 transition-all duration-300 flex items-center gap-2 font-bold text-sm shadow-lg hover:shadow-purple-500/20"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        Community
      </button>

      {/* View Cart Button */}
      <button
        onClick={onOpenCart}
        className="px-4 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-white rounded-xl 
                 transition-all duration-300 flex items-center gap-2 font-bold text-sm border border-white/10 shadow-lg"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        View Cart
      </button>

      {currentDesignId && (
        <button
          onClick={onAddToCart}
          className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl 
                   transition-all duration-300 flex items-center gap-2 font-bold text-sm shadow-lg hover:shadow-xl"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add to Cart
        </button>
      )}

      <button
        onClick={() => navigate("/my-designs")}
        className="px-4 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-white rounded-xl 
                 border border-white/10 transition-all duration-300 flex items-center gap-2 font-bold text-sm shadow-lg"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        My Designs
      </button>

      <SaveDesignButton setCurrentDesignId={setCurrentDesignId} />

      <CustomButton
        type="filled"
        title="Go Back"
        handleClick={() => navigate("/")}
        customStyles="w-fit px-4 py-2.5 font-bold text-sm"
      />
    </motion.div>
  );
};

export default CustomizerHeader;
