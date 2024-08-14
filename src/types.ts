import Konva from "konva";

export type Tool = "select" | "rect" | "circle" | "line";
export type Shape = "rect" | "circle";

export interface ShapeData {
  id: string;
  type: Shape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
}

export interface LineData {
  id: string;
  points: number[];
  startShapeId: string | null;
  endShapeId: string | null;
}

export interface DraggedLineEnd {
  lineId: string;
  end: "start" | "end";
}

export type KonvaEventObject<T> = Konva.KonvaEventObject<T>;
