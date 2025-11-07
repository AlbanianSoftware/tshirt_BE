import { useState, useEffect, useRef } from "react";

export const useEditorTabs = () => {
  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const editorTabRef = useRef(null);
  const logoPickerRef = useRef(null);

  const handleTabClick = (tabName) => {
    setActiveEditorTab((prevTab) => (prevTab === tabName ? "" : tabName));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (editorTabRef.current && editorTabRef.current.contains(event.target)) ||
        (logoPickerRef.current &&
          logoPickerRef.current.contains(event.target)) ||
        logoEditorOpen
      ) {
        return;
      }

      if (activeEditorTab === "textpicker") {
        setActiveEditorTab("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeEditorTab, logoEditorOpen]);

  return {
    activeEditorTab,
    setActiveEditorTab,
    logoEditorOpen,
    setLogoEditorOpen,
    handleTabClick,
    editorTabRef,
    logoPickerRef,
  };
};
