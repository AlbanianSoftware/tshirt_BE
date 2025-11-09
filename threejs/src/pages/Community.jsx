// pages/Community.jsx - FULLY FIXED VERSION
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
  const [loading, setLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [totalCount, setTotalCount] = useState(0);
  const [myDesignsCount, setMyDesignsCount] = useState(0);
  const [allDesignsCount, setAllDesignsCount] = useState(0); // ✅ NEW: Separate count for all designs
  const [fetchKey, setFetchKey] = useState(0); // ✅ NEW: Force refetch trigger

  const postsPerPage = 10;
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * postsPerPage;
      const url = new URL("http://localhost:3001/api/community");

      url.searchParams.append("limit", postsPerPage.toString());
      url.searchParams.append("offset", offset.toString());

      if (debouncedSearch) {
        url.searchParams.append("search", debouncedSearch);
      }

      // ✅ FIX: Debug auth state completely
      const isMyDesigns = activeTab === "myDesigns";

      console.log("🔍 FULL AUTH STATE:", {
        user: authSnap.user,
        isAuthenticated: authSnap.isAuthenticated,
        token: authSnap.token ? "exists" : "missing",
      });

      // ✅ FIX: Decode token to get userId if user object is missing
      let userId = authSnap.user?.id;

      if (!userId && authSnap.token) {
        try {
          const tokenParts = authSnap.token.split(".");
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.userId;
          console.log("🔓 Decoded userId from token:", userId);
        } catch (e) {
          console.error("Failed to decode token:", e);
        }
      }

      console.log("🔍 FETCH DEBUG:", {
        activeTab,
        isMyDesigns,
        userId,
        willFilterByUser: isMyDesigns && userId,
      });

      if (isMyDesigns && userId) {
        url.searchParams.append("userId", userId.toString());
      }

      console.log("🔍 Fetching URL:", url.toString());

      const headers = {};
      if (authSnap.token) {
        headers["Authorization"] = `Bearer ${authSnap.token}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Received:", {
          postsCount: data.posts?.length,
          total: data.total,
          myDesignsCount: data.myDesignsCount,
        });

        setPosts(data.posts || []);

        // ✅ FIX: Update the correct count based on active tab
        if (activeTab === "myDesigns") {
          setTotalCount(data.total || 0); // This is the filtered count for my designs
        } else {
          setTotalCount(data.total || 0); // This is all designs count
          setAllDesignsCount(data.total || 0); // Store it separately
        }

        // Always update myDesignsCount from backend
        setMyDesignsCount(data.myDesignsCount || 0);
      } else {
        console.error("❌ Response not OK:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Simplified - just fetch when things change
  useEffect(() => {
    console.log("🔄 useEffect triggered:", {
      activeTab,
      currentPage,
      debouncedSearch,
      userId: authSnap.user?.id,
      fetchKey,
    });
    fetchPosts();
  }, [currentPage, debouncedSearch, activeTab, fetchKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab]);

  const totalPages = Math.ceil(totalCount / postsPerPage);

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

  // ✅ HELPER: Get the correct display count for each tab
  const getDisplayCount = (tab) => {
    if (tab === "all") {
      return allDesignsCount || totalCount;
    }
    return myDesignsCount;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
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
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Community Gallery
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Discover and share amazing designs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {authSnap.isAuthenticated && (
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white rounded-lg transition-all duration-200 flex items-center gap-2 font-medium border border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
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

          {/* Tabs */}
          {authSnap.isAuthenticated && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`relative px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "all"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {activeTab === "all" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
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
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  All Designs
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === "all" ? "bg-white/20" : "bg-white/5"
                    }`}
                  >
                    {getDisplayCount("all")}
                  </span>
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("myDesigns");
                  setFetchKey((prev) => prev + 1); // ✅ Force fresh fetch
                }}
                className={`relative px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "myDesigns"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {activeTab === "myDesigns" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  My Designs
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === "myDesigns" ? "bg-white/20" : "bg-white/5"
                    }`}
                  >
                    {getDisplayCount("myDesigns")}
                  </span>
                </span>
              </button>
            </div>
          )}

          {/* Search Bar */}
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
              placeholder={`Search ${
                activeTab === "myDesigns" ? "your designs" : "all designs"
              }...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            />
            {loading && (
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
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-500"
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
            <h2 className="text-2xl font-bold text-white mb-2">
              {activeTab === "myDesigns"
                ? searchTerm
                  ? "No designs found"
                  : "No published designs yet"
                : searchTerm
                ? "No designs found"
                : "No designs yet"}
            </h2>
            <p className="text-gray-400 mb-6">
              {activeTab === "myDesigns"
                ? searchTerm
                  ? "Try a different search term"
                  : "Share your first design with the community"
                : searchTerm
                ? "Try a different search term"
                : "Be the first to share a design"}
            </p>
            {activeTab === "myDesigns" &&
              !searchTerm &&
              authSnap.isAuthenticated && (
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white rounded-lg font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
                >
                  Publish Your First Design
                </button>
              )}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-400">
                Showing{" "}
                <span className="text-white font-medium">
                  {(currentPage - 1) * postsPerPage + 1}-
                  {Math.min(currentPage * postsPerPage, totalCount)}
                </span>{" "}
                of <span className="text-white font-medium">{totalCount}</span>{" "}
                designs
              </div>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {posts.map((post, index) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  index={index}
                  onDelete={fetchPosts}
                  currentUserId={
                    authSnap.user?.id ||
                    (() => {
                      // Decode token to get userId as fallback
                      if (authSnap.token) {
                        try {
                          const tokenParts = authSnap.token.split(".");
                          const payload = JSON.parse(atob(tokenParts[1]));
                          return payload.userId;
                        } catch (e) {
                          return null;
                        }
                      }
                      return null;
                    })()
                  }
                />
              ))}
            </motion.div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pb-8">
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 font-medium"
                >
                  Previous
                </button>

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
                      className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium ${
                        currentPage === page
                          ? "bg-white/15 text-white border-white/30 shadow-lg"
                          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showPublishModal && (
        <PublishDesignModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onSuccess={fetchPosts}
        />
      )}
    </div>
  );
};

export default Community;
