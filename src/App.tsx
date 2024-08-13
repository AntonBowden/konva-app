import React, { useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';

const App: React.FC = () => {
  const stageRef = useRef<any>(null);

  useEffect(() => {
    const updateSize = () => {
      if (stageRef.current) {
        stageRef.current.width(window.innerWidth);
        stageRef.current.height(window.innerHeight);
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <Stage ref={stageRef}>
      <Layer>

      </Layer>
    </Stage>
  );
};

export default App;