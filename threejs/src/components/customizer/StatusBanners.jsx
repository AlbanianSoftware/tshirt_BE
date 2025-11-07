import { motion } from "framer-motion";
import { fadeAnimation } from "../../config/motion";

const StatusBanners = ({ loadingDesign, viewingCommunityDesign }) => {
  return (
    <>
      {loadingDesign && (
        <motion.div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 
                     backdrop-blur-xl bg-white/10 text-white px-6 py-3 rounded-xl shadow-2xl 
                     border border-white/20"
          {...fadeAnimation}
        >
          Loading design...
        </motion.div>
      )}

      {viewingCommunityDesign && (
        <motion.div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 
               backdrop-blur-md bg-white/10 text-white px-6 py-3 rounded-lg shadow-xl 
               border border-white/20 flex items-center gap-2"
          {...fadeAnimation}
        >
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium text-sm">
            Viewing community design - Save it to edit and customize
          </span>
        </motion.div>
      )}
    </>
  );
};

export default StatusBanners;
