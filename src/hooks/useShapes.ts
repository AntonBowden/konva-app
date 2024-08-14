import { useState } from "react";
import { ShapeData, Shape, KonvaEventObject } from "../types";
import { getRandomColor, createRegularPolygonPoints } from "../utils";

export const useShapes = () => {
  const [shapes, setShapes] = useState<ShapeData[]>([]);

  const addShape = (pos: { x: number; y: number }, shape: Shape) => {
    const size = 50;
    const newShape: ShapeData = {
      id: Math.random().toString(),
      type: shape,
      x: pos.x,
      y: pos.y,
      width: size,
      height: size,
      fill: getRandomColor(),
    };

    if (shape === "pentagon") {
      newShape.points = createRegularPolygonPoints(5, size / 2);
    } else if (shape === "hexagon") {
      newShape.points = createRegularPolygonPoints(6, size / 2);
    }

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
    updateShapePosition,
    handleDragMove,
  };
};
