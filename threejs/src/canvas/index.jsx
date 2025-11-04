import { Canvas } from "@react-three/fiber";
import { Environment, Center } from "@react-three/drei";

import Shirt from "./Shirt";
import Backdrop from "./Backdrop";
import CameraRig from "./CameraRig";

const CanvasModel = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 0], fov: 25 }} // fov = field of view
      gl={{ preserveDrawingBuffer: true }}
      className="w-full max-w-full h-full transition-all ease-in"
      style={{ background: "transparent" }}
    >
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.5} />

      {/* Key light from the front */}
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

      {/* Fill light from the back */}
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Environment for reflections - REMOVED background prop */}
      <Environment preset="city" />

      <CameraRig>
        <Center>
          <Shirt />
        </Center>
      </CameraRig>

      {/* Backdrop stays fixed - outside CameraRig so it doesn't rotate */}
      <Backdrop />
    </Canvas>
  );
};

export default CanvasModel;
