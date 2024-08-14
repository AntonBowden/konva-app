import { useState } from "react";
import { ShapeData, Shape, KonvaEventObject } from "../types.ts";
import { getRandomColor } from "../utils.ts";

export const useShapes = () => {
  const [shapes, setShapes] = useState<ShapeData[]>([]);

  const addShape = (pos: { x: number; y: number }, shape: Shape) => {
    const newShape: ShapeData = {
      id: Math.random().toString(),
      type: shape,
      x: pos.x,
      y: pos.y,
      width: shape === "rect" ? 50 : 50,
      height: shape === "rect" ? 50 : 50,
      radius: shape === "circle" ? 25 : undefined,
      fill: getRandomColor(),
    };

    setShapes([...shapes, newShape]);
  };

  const updateShapePosition = (shapeId: string, x: number, y: number) => {
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId ? { ...shape, x, y } : shape
    );
    setShapes(updatedShapes);
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>, shapeId: string) => {
    updateShapePosition(shapeId, e.target.x(), e.target.y());
  };

  return {
    shapes,
    addShape,
    handleDragMove,
  };
};
