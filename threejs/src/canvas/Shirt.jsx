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
    long_sleeve: {
      modelPath: "/models/long_sleve_shirt.glb",
      nodeName: "Long_Sleeve_T-Shirt_Bahan_Dasar_FRONT_2657_0",
      materialName: "Bahan_Dasar_FRONT_2657",
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
      scale: 0.7, // Scale down to 70% size
      logoPosition: [0, -0.15, 0.04], // Negative Y since we flipped it
      logoScale: 0.25,
      fullScale: 1,
    },
  };

  const currentConfig = shirtConfigs[snap.shirtType] || shirtConfigs.tshirt;

  // Load the appropriate model based on shirt type
  const { nodes, materials } = useGLTF(currentConfig.modelPath);

  const nodeName = currentConfig.nodeName;
  const materialName = currentConfig.materialName;

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

  const logoTexture = useTexture(snap.logoDecal);
  const fullTexture = useTexture(snap.fullDecal);

  useFrame((state, delta) =>
    easing.dampC(materials[materialName].color, snap.color, 0.25, delta)
  );

  const stateString = JSON.stringify(snap);

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
        {snap.isFullTexture && (
          <Decal
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={currentConfig.fullScale}
            map={fullTexture}
          />
        )}

        {/* T-shirt logo */}
        {snap.isLogoTexture && (
          <Decal
            position={currentConfig.logoPosition}
            rotation={[0, 0, 0]}
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
useGLTF.preload("/models/long_sleve_shirt.glb");
useGLTF.preload("/models/female_tshirt.glb");

export default Shirt;
