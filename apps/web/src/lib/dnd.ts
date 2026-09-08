import { type CollisionDetection, pointerWithin, rectIntersection } from "@dnd-kit/core";

// dnd-kit 기본값 rectIntersection 은 포인터가 아니라 드래그 사각형의 면적 겹침 비율(IoU)로
// 대상을 고른다(core.esm.js:398-414). 대상이 작을수록 점수가 높아서, 얇은 스프린트 줄이
// 거대한 백로그 존에 밀리고 목표 컬럼에 절반 넘게 넣어도 원래 컬럼 카드가 이긴다.
// 포인터가 있는 곳을 먼저 보고, 어느 대상에도 안 걸릴 때만 면적 방식으로 되돌아간다.
export const pointerFirstCollision: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args);
  return byPointer.length > 0 ? byPointer : rectIntersection(args);
};
