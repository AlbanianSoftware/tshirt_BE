import { useState, useEffect, useRef } from "react";

export const useEditorTabs = () => {
  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const editorTabRef = useRef(null);
  const logoPickerRef = useRef(null);
  const logoEditorRef = useRef(null);

  const handleTabClick = (tabName) => {
    setActiveEditorTab((prevTab) => (prevTab === tabName ? "" : tabName));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // ONLY close textpicker on outside clicks
      // Don't interfere with logo picker AT ALL

      if (editorTabRef.current && editorTabRef.current.contains(event.target)) {
        console.log("Click inside sidebar - ignoring");
        return;
      }

      // If logo editor is open, don't close anything
      if (logoEditorOpen) {
        console.log("Logo editor open - ignoring outside clicks");
        return;
      }

      // ONLY close textpicker, leave logopicker alone
      if (activeEditorTab === "textpicker") {
        console.log("Closing textpicker due to outside click");
        setActiveEditorTab("");
      }

      // DO NOT CLOSE LOGOPICKER - let it handle its own closing
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
    logoEditorRef,
  };
};
