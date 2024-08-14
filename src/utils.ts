import Konva from "konva";
import { ShapeData } from "./types";

export const getRandomColor = (): string => {
  return Konva.Util.getRandomColor();
};

export const createRegularPolygonPoints = (
  sides: number,
  radius: number
): number[] => {
  const points: number[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    points.push(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  return points;
};

export const isPointNearShape = (
  x: number,
  y: number,
  shape: ShapeData
): boolean => {
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const distance = Math.hypot(x - centerX, y - centerY);
  return distance <= 50; // 50 pixels threshold for proximity to the shape
};

export const findNearestShape = (
  x: number,
  y: number,
  shapes: ShapeData[]
): ShapeData | null => {
  let nearestShape: ShapeData | null = null;
  let minDistance = Infinity;

  shapes.forEach((shape) => {
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    const distance = Math.hypot(x - centerX, y - centerY);

    if (distance < minDistance && distance <= 20) {
      minDistance = distance;
      nearestShape = shape;
    }
  });

  return nearestShape;
};
