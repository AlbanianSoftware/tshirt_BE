import { useEffect } from "react";
import { easing } from "maath";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import { Decal, useGLTF, useTexture } from "@react-three/drei";

import state from "../store";

const Shirt = () => {
  const snap = useSnapshot(state);

  // Define shirt type configurations
  const shirtConfigs = {
    tshirt: {
      modelPath: "/models/shirt_baked.glb",
      nodeName: "T_Shirt_male",
      materialName: "lambert1",
      rotation: [0, 0, 0],
      scale: 1,
      logoPosition: [0, 0.04, 0.15],
      logoScale: 0.25,
      fullScale: 1,
    },
    female_tshirt: {
      modelPath: "/models/female_tshirt.glb",
      nodeName: "Object_2",
      materialName: "material_0",
      rotation: [-Math.PI / 2, 0, -1.5], // Rotate -90 degrees on X axis to flip it right-side up
      scale: 0.7,
      logoPosition: [0.15, 0, 0.1],
      logoScale: 0.35,
      logoRotation: [1.6, Math.PI / 2, 0], // Fixed rotation - no longer inverted
      fullScale: 1,
    },
  };

  const currentConfig = shirtConfigs[snap.shirtType] || shirtConfigs.tshirt;

  // Load the appropriate model based on shirt type
  const { nodes, materials } = useGLTF(currentConfig.modelPath);

  const nodeName = currentConfig.nodeName;
  const materialName = currentConfig.materialName;

  // Load textures
  const logoTexture = useTexture(snap.logoDecal);
  const fullTexture = useTexture(snap.fullDecal);

  // Safety check
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

  // Force material to update when shirt type changes
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

  // Include shirtType in the key to force re-render on type change
  const stateString = JSON.stringify({
    color: snap.color,
    logoDecal: snap.logoDecal,
    fullDecal: snap.fullDecal,
    isLogoTexture: snap.isLogoTexture,
    isFullTexture: snap.isFullTexture,
    shirtType: snap.shirtType,
  });

  return (
    <group
      key={stateString}
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
        {/* T-shirt full texture */}
        {snap.isFullTexture && fullTexture && (
          <Decal
            position={[0, 0, 0]}
            rotation={currentConfig.fullRotation || [0, 0, 0]}
            scale={currentConfig.fullScale}
            map={fullTexture}
          />
        )}

        {/* T-shirt logo */}
        {snap.isLogoTexture && logoTexture && (
          <Decal
            position={currentConfig.logoPosition}
            rotation={currentConfig.logoRotation || [0, 0, 0]}
            scale={currentConfig.logoScale}
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

// Preload all models
useGLTF.preload("/models/shirt_baked.glb");
useGLTF.preload("/models/female_tshirt.glb");

export default Shirt;
