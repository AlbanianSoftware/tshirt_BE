import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { useSnapshot } from "valtio";

import state from "../store";

/**
 * Enhanced camera rig with drag-to-rotate functionality.
 * Click and drag on the shirt to rotate the model.
 */
const CameraRig = ({ children }) => {
  const group = useRef();
  const snap = useSnapshot(state);
  const { size, gl } = useThree();

  // Track drag state
  const [rotation, setRotation] = useState([0, 0, 0]);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (e) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      previousMousePosition.current = { x: e.clientX, y: e.clientY };

      // Increase sensitivity for faster, more responsive movement
      const sensitivity = 0.01;

      setRotation((prev) => {
        const newRotationY = prev[1] + deltaX * sensitivity;
        const newRotationX = prev[0] + deltaY * sensitivity;

        // Clamp vertical rotation
        const maxVerticalRotation = Math.PI / 2.5;
        const clampedX = Math.max(
          -maxVerticalRotation,
          Math.min(maxVerticalRotation, newRotationX)
        );

        return [clampedX, newRotationY, 0];
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = "grab";
    };

    // Touch events for mobile
    const handleTouchStart = (e) => {
      isDragging.current = true;
      const touch = e.touches[0];
      previousMousePosition.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - previousMousePosition.current.x;
      const deltaY = touch.clientY - previousMousePosition.current.y;

      previousMousePosition.current = { x: touch.clientX, y: touch.clientY };

      const sensitivity = 0.01;

      setRotation((prev) => {
        const newRotationY = prev[1] + deltaX * sensitivity;
        const newRotationX = prev[0] + deltaY * sensitivity;

        const maxVerticalRotation = Math.PI / 2.5;
        const clampedX = Math.max(
          -maxVerticalRotation,
          Math.min(maxVerticalRotation, newRotationX)
        );

        return [clampedX, newRotationY, 0];
      });
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.style.cursor = "default";
    };
  }, [gl]);

  useFrame((state, delta) => {
    const isBreakpoint = window.innerWidth <= 1260;
    const isMobile = window.innerWidth <= 600;

    // Define camera positions
    let targetPosition = [-0.4, 0, 2];

    if (snap.intro) {
      if (isMobile) {
        targetPosition = [0, 0.2, 2.5];
      } else if (isBreakpoint) {
        targetPosition = [0, 0, 2];
      }
    } else {
      if (isMobile) {
        targetPosition = [0, 0, 2.5];
      } else {
        targetPosition = [0, 0, 2];
      }
    }

    // Smooth camera position
    easing.damp3(state.camera.position, targetPosition, 0.25, delta);

    // Apply rotation directly with minimal damping for responsiveness
    easing.damp3(
      group.current.rotation,
      rotation,
      0.15, // Lower value = faster response
      delta
    );
  });

  return <group ref={group}>{children}</group>;
};

export default CameraRig;
