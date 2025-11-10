// pages/MyDesigns.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";
import authState from "../store/authStore";
import DesignsHeader from "../components/designs/DesignsHeader";
import SearchBar from "../components/designs/SearchBar";
import DesignGrid from "../components/designs/DesignGrid";
import Pagination from "../components/designs/Pagination";
import EmptyState from "../components/designs/EmptyState";
import DeleteModal from "../components/designs/DeleteModal";
import LoginRequired from "../components/designs/LoginRequired";

const MyDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDesigns, setTotalDesigns] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();
  const authSnap = useSnapshot(authState);
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const designsPerPage = 12;

  useEffect(() => {
    if (authSnap.isAuthenticated && authSnap.token) {
      fetchDesigns();
    } else {
      setError("Please log in to view your designs");
      setLoading(false);
      setInitialLoad(false);
    }
  }, [authSnap.isAuthenticated, authSnap.token, debouncedSearch, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * designsPerPage;
      const params = new URLSearchParams({
        limit: designsPerPage.toString(),
        offset: offset.toString(),
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const response = await fetch(
        `http://localhost:3001/api/designs?${params}`,
        {
          headers: { Authorization: `Bearer ${authSnap.token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch designs");
      }

      const data = await response.json();

      // Handle both old and new API response formats
      if (Array.isArray(data)) {
        // Old format: direct array
        setDesigns(data);
        setTotalDesigns(data.length);
      } else {
        // New format: { designs: [...], total: ... }
        setDesigns(data.designs || []);
        setTotalDesigns(data.total || 0);
      }

      setError("");
      setInitialLoad(false);
    } catch (err) {
      setError(`Failed to load designs: ${err.message}`);
      setDesigns([]);
      setTotalDesigns(0);
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDesign = (designId) => {
    navigate(`/customizer?design=${designId}`);
  };

  const handleDelete = async (designId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/designs/${designId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authSnap.token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete design");

      // Refetch designs instead of manually filtering
      // This ensures pagination and counts are accurate
      fetchDesigns();
      setDeleteId(null);
    } catch (err) {
      setError("Failed to delete design");
    }
  };

  const totalPages = Math.ceil(totalDesigns / designsPerPage);
  const startIndex = (currentPage - 1) * designsPerPage;
  const endIndex = Math.min(startIndex + designsPerPage, totalDesigns);

  if (!authSnap.isAuthenticated) {
    return <LoginRequired onNavigate={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <DesignsHeader
        onBack={() => navigate("/customizer")}
        onNewDesign={() => navigate("/customizer")}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
        />

        {error && (
          <div className="mb-6 p-4 backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {loading && initialLoad ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-400 text-sm font-medium">
                Loading designs...
              </div>
            </div>
          </div>
        ) : designs.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            onAction={() =>
              searchTerm ? setSearchTerm("") : navigate("/customizer")
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-400">
                Showing{" "}
                <span className="text-white font-medium">
                  {startIndex + 1}-{endIndex}
                </span>{" "}
                of{" "}
                <span className="text-white font-medium">{totalDesigns}</span>{" "}
                designs
              </div>
            </div>

            <DesignGrid
              designs={designs}
              onLoadDesign={handleLoadDesign}
              onDeleteDesign={setDeleteId}
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {deleteId && (
        <DeleteModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default MyDesigns;
