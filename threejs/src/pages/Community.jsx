// pages/Community.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import { useDebounce } from "use-debounce";
import authState from "../store/authStore";
import CommunityPostCard from "../components/CommunityPostCard";
import PublishDesignModal from "../components/PublishDesignModal";

const Community = () => {
  const navigate = useNavigate();
  const authSnap = useSnapshot(authState);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10; // 10 posts per page

  // 🔍 Debounce search (wait 500ms after user stops typing)
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  // Fetch posts whenever search term changes
  useEffect(() => {
    fetchPosts(debouncedSearch);
    setCurrentPage(1); // Reset to page 1 when searching
  }, [debouncedSearch]);

  const fetchPosts = async (search = "") => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:3001/api/community");
      if (search) url.searchParams.append("search", search);

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/customizer")}
              className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200 border border-transparent hover:border-white/10"
            >
              <svg
                className="w-6 h-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Community Gallery
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {authSnap.isAuthenticated && (
              <button
                onClick={() => setShowPublishModal(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg 
                         transition-all duration-200 flex items-center gap-2 font-medium 
                         border border-white/10 hover:border-white/20 backdrop-blur-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Publish Design
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search designs, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 
                       rounded-lg text-white placeholder-gray-500
                       focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/10
                       transition-all duration-200 backdrop-blur-sm"
            />
            {loading && searchTerm && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-400 text-sm font-medium">
                Loading designs...
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? "No designs found" : "No designs yet"}
            </h2>
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "Try a different search term"
                : "Be the first to share your design"}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {currentPosts.map((post, index) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  index={index}
                  onDelete={() => fetchPosts(debouncedSearch)}
                  currentUserId={authSnap.user?.id}
                />
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                {/* Previous Button */}
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg 
                           border border-white/10 hover:border-white/20 transition-all duration-200
                           disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-3 py-2 text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium
                        ${
                          currentPage === page
                            ? "bg-white/15 text-white border-white/30"
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                        }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next Button */}
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg 
                           border border-white/10 hover:border-white/20 transition-all duration-200
                           disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className="text-center pb-8 text-sm text-gray-500">
              Showing {indexOfFirstPost + 1}-
              {Math.min(indexOfLastPost, posts.length)} of {posts.length}{" "}
              designs
            </div>
          </>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishDesignModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onSuccess={() => fetchPosts(debouncedSearch)}
        />
      )}
    </div>
  );
};

export default Community;
