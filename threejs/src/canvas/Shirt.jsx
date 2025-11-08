import { useEffect } from "react";
import { easing } from "maath";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import { Decal, useGLTF, useTexture } from "@react-three/drei";

import state from "../store";

const Shirt = () => {
  const snap = useSnapshot(state);

  const shirtConfigs = {
    tshirt: {
      modelPath: "/models/shirt_baked.glb",
      nodeName: "T_Shirt_male",
      materialName: "lambert1",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      logoPosition: [0, 0.04, 0.15],
      logoScale: 0.25,
      fullScale: 1,
      // Wider bounds with same height
      logoBounds: {
        minScale: 0.1,
        maxScale: 0.4,
        minX: -0.15,
        maxX: 0.15,
        minY: -0.08,
        maxY: 0.15,
      },
    },
    female_tshirt: {
      modelPath: "/models/female_tshirt.glb",
      nodeName: "Object_2",
      materialName: "material_0",
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, -1.5],
      scale: 0.7,
      logoPosition: [0.15, 0, 0.1],
      logoScale: 0.35,
      logoRotation: [1.6, Math.PI / 2, 0],
      fullScale: 1,
      logoBounds: {
        minScale: 0.15,
        maxScale: 0.55,
        minX: -0.02,
        maxX: 0.32,
        minY: -0.08,
        maxY: 0.18,
      },
    },
  };

  const currentConfig = shirtConfigs[snap.shirtType] || shirtConfigs.tshirt;
  const { nodes, materials } = useGLTF(currentConfig.modelPath);

  const logoTexture = useTexture(snap.logoDecal);
  const fullTexture = useTexture(snap.fullDecal);

  const nodeName = currentConfig.nodeName;
  const materialName = currentConfig.materialName;

  if (!nodes[nodeName]) {
    console.error(
      `Node "${nodeName}" not found. Available nodes:`,
      Object.keys(nodes)
    );
    return null;
  }

  if (!materials[materialName]) {
    console.error(
      `Material "${materialName}" not found. Available materials:`,
      Object.keys(materials)
    );
    return null;
  }

  useEffect(() => {
    if (materials[materialName]) {
      materials[materialName].needsUpdate = true;
    }
  }, [snap.shirtType, materials, materialName]);

  useFrame((state, delta) => {
    if (materials[materialName]) {
      easing.dampC(materials[materialName].color, snap.color, 0.25, delta);
    }
  });

  const stateString = JSON.stringify({
    color: snap.color,
    logoDecal: snap.logoDecal,
    fullDecal: snap.fullDecal,
    isLogoTexture: snap.isLogoTexture,
    isFullTexture: snap.isFullTexture,
    shirtType: snap.shirtType,
    logo: snap.logo,
  });

  // Calculate logo transformations with size limits
  const getLogoTransform = () => {
    const bounds = currentConfig.logoBounds;

    // Start with the user's desired scale
    const desiredScale = currentConfig.logoScale * (snap.logo.scale || 1);

    // Clamp scale within bounds - simple size limit
    const clampedScale = Math.max(
      bounds.minScale,
      Math.min(bounds.maxScale, desiredScale)
    );

    // Convert pixel offsets to 3D space
    const offsetMultiplier = 0.0004;
    const xOffset = (snap.logo.position?.x || 0) * offsetMultiplier;
    const yOffset = (snap.logo.position?.y || 0) * offsetMultiplier;

    // Calculate position - simple clamping without adjusting for size
    const basePos = currentConfig.logoPosition;
    const desiredX = basePos[0] + xOffset;
    const desiredY = basePos[1] + yOffset;

    // Clamp position to bounds
    const newX = Math.max(bounds.minX, Math.min(bounds.maxX, desiredX));
    const newY = Math.max(bounds.minY, Math.min(bounds.maxY, desiredY));

    const newPosition = [newX, newY, basePos[2]];

    // Rotation
    const baseRotation = currentConfig.logoRotation || [0, 0, 0];
    const additionalRotation = ((snap.logo.rotation || 0) * Math.PI) / 180;
    const newRotation = [
      baseRotation[0],
      baseRotation[1],
      baseRotation[2] + additionalRotation,
    ];

    return {
      position: newPosition,
      rotation: newRotation,
      scale: clampedScale,
    };
  };

  const logoTransform = getLogoTransform();

  return (
    <group
      key={stateString}
      position={currentConfig.position}
      rotation={currentConfig.rotation}
      scale={currentConfig.scale}
    >
      <mesh
        castShadow
        geometry={nodes[nodeName].geometry}
        material={materials[materialName]}
        material-roughness={1}
        material-metalness={0}
        dispose={null}
      >
        {snap.isFullTexture && fullTexture && (
          <Decal
            position={[0, 0, 0]}
            rotation={currentConfig.fullRotation || [0, 0, 0]}
            scale={currentConfig.fullScale}
            map={fullTexture}
          />
        )}

        {snap.isLogoTexture && logoTexture && (
          <Decal
            position={logoTransform.position}
            rotation={logoTransform.rotation}
            scale={logoTransform.scale}
            map={logoTexture}
            anisotropy={16}
            depthTest={false}
            depthWrite={true}
          />
        )}
      </mesh>
    </group>
  );
};

useGLTF.preload("/models/shirt_baked.glb");
useGLTF.preload("/models/female_tshirt.glb");

export default Shirt;
