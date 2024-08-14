import Konva from "konva";
import { ShapeData } from "./types";

export const getRandomColor = (): string => {
  return Konva.Util.getRandomColor();
};

export const isPointNearShape = (
  x: number,
  y: number,
  shape: ShapeData
): boolean => {
  const centerX = shape.x + (shape.width || shape.radius || 0) / 2;
  const centerY = shape.y + (shape.height || shape.radius || 0) / 2;
  const distance = Math.hypot(x - centerX, y - centerY);
  return distance <= 50;
};

export const findNearestShape = (
  x: number,
  y: number,
  shapes: ShapeData[]
): ShapeData | null => {
  let nearestShape: ShapeData | null = null;
  let minDistance = Infinity;

  shapes.forEach((shape) => {
    const centerX = shape.x + (shape.width || 0) / 2;
    const centerY = shape.y + (shape.height || 0) / 2;
    const distance = Math.hypot(x - centerX, y - centerY);

    if (distance < minDistance && distance <= 20) {
      minDistance = distance;
      nearestShape = shape;
    }
  });

  return nearestShape;
};
