// components/CommunityPostCard.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { useSnapshot } from "valtio";
import { useNavigate } from "react-router-dom";
import authState from "../store/authStore";

const CommunityPostCard = ({ post, index, onDelete, currentUserId }) => {
  const navigate = useNavigate();
  const authSnap = useSnapshot(authState);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserId === post.userId;

  const handleDelete = async () => {
    if (!authSnap.token || !isOwner) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/community/${post.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authSnap.token}`,
          },
        }
      );

      if (response.ok) {
        onDelete();
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewDesign = () => {
    navigate(`/customizer?communityDesign=${post.id}`);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.div
      className="group relative bg-white/5 backdrop-blur-md rounded-xl overflow-hidden 
                 border border-white/10 hover:border-white/20 transition-all duration-300 
                 hover:shadow-xl hover:shadow-black/20 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 9) * 0.05 }} // Reset delay for each page
      whileHover={{ y: -4 }}
      onClick={handleViewDesign}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-black/40 overflow-hidden">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Delete Button (Only for owner) */}
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              setShowDeleteConfirm(true);
            }}
            className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 
                     rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200
                     border border-red-400/20 z-10"
            title="Delete post"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-1 truncate">
          {post.title}
        </h3>

        {/* Description */}
        {post.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">
            {post.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center border border-white/10">
              <span className="text-white font-medium text-xs">
                {post.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-gray-400 font-medium">{post.username}</span>
          </div>

          {/* Views */}
          <div className="flex items-center gap-1 text-gray-500">
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{post.views || 0}</span>
          </div>
        </div>

        {/* Date */}
        <div className="mt-2 pt-2 border-t border-white/5 text-xs text-gray-600">
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl"
          onClick={(e) => e.stopPropagation()} // Prevent card click
        >
          <div className="bg-gray-900 p-6 rounded-lg border border-white/10 max-w-xs mx-4">
            <h3 className="text-white font-semibold mb-2 text-sm">
              Delete Post?
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              This will remove your design from the community gallery. This
              action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white 
                         rounded-lg transition-all duration-200 disabled:opacity-40 text-sm
                         border border-red-400/20"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white 
                         rounded-lg transition-all duration-200 border border-white/10 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CommunityPostCard;
