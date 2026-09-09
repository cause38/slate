"use client";

import { IssueRow } from "@/components/issue/IssueRow";
import type { BoardIssue } from "@/lib/queries/board-issues";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRef } from "react";

/** 그립 툴팁과 백로그 안내 문구가 같이 바뀌어야 해서 한 곳에 둔다 */
export const NO_DROP_TARGET_HINT = "스프린트를 만들면 이슈를 드래그해서 넣을 수 있어요";

/** PointerSensor 활성화 임계값. 클릭 삼키기 판정도 같은 값을 써야 어긋나지 않는다 */
export const DRAG_ACTIVATION_DISTANCE = 8;

type DraggableIssueRowProps = {
  issue: BoardIssue;
  /** 드래그를 막는 이유. undefined 면 드래그 가능 */
  disabledReason?: string;
};

// 리스너는 행 전체(래퍼)에 붙인다. 그립에만 붙이면 16px 과녁을 맞혀야 해서 사용자가
// 행 본문을 잡게 되고, 그러면 dnd-kit 센서가 아예 만들어지지 않아 드래그가 시작되지 않는다.
// 그립은 setActivatorNodeRef + attributes 만 받아 포커스 가능한 진입점으로 남는다.
// KeyboardSensor 는 event.target 이 activator 일 때만 활성화되므로(core.esm.js:1360)
// 행 안의 링크에 포커스를 두고 Enter 를 눌러도 드래그로 새지 않는다.
export function DraggableIssueRow({ issue, disabledReason }: DraggableIssueRowProps) {
  const disabled = disabledReason !== undefined;
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, data: { issue }, disabled });

  // 행 본문이 링크라서, 끌었다가 취소(Esc·탭 전환)하고 같은 링크 위에서 버튼을 놓으면
  // click 이 그 앵커에 떨어진다. dnd-kit 은 드래그 후 click 을 stopPropagation 만 하고
  // preventDefault 는 하지 않아(core.esm.js:1506) 앵커의 기본 이동은 그대로 실행된다.
  // 드래그 상태가 아니라 포인터 이동 거리로 판정해야 취소 시점과 무관하게 일관된다.
  function handleClickCapture(event: React.MouseEvent) {
    const start = pointerDownAt.current;
    pointerDownAt.current = null;
    if (!start) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (moved < DRAG_ACTIVATION_DISTANCE) return;
    event.preventDefault();
    event.stopPropagation();
  }

  // disabled 여도 attributes 는 "스페이스바로 들어올리세요" 설명을 계속 가리킨다
  // (core.esm.js:3438). 실제로는 리스너가 없어 무반응이므로 그 설명만 떼어낸다.
  const { "aria-describedby": describedBy, ...restAttributes } = attributes;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      onPointerDownCapture={(event) => {
        pointerDownAt.current = { x: event.clientX, y: event.clientY };
      }}
      onClickCapture={handleClickCapture}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        // 행 전체가 드래그 소스라 본문 텍스트 선택과 경합한다. 8px 임계에서 선택이
        // 번쩍였다 사라지는 것보다, 처음부터 선택되지 않는 편이 덜 혼란스럽다.
        // 링크는 UA 기본 cursor: pointer 라 따로 덮어야 잡을 수 있다는 신호가 보인다.
        !disabled &&
          "cursor-grab touch-none select-none active:cursor-grabbing [&_a]:cursor-grab [&_a]:active:cursor-grabbing",
        // DragOverlay 가 커서를 따라가므로 원본 행은 자리에 둔 채 흐리게만 만든다
        isDragging && "opacity-40",
      )}
    >
      <IssueRow
        issue={issue}
        leading={
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...restAttributes}
            aria-describedby={disabled ? undefined : describedBy}
            // 네이티브 disabled 를 쓰면 브라우저가 마우스 이벤트를 억제해 title 툴팁이
            // 뜨지 않는다. 설명이 가장 필요한 상태에서 설명이 사라지므로 aria-disabled 로 둔다.
            // 실제 드래그 차단은 useSortable({ disabled }) 가 하고, onClick 은 없다.
            aria-disabled={disabled}
            aria-label={disabledReason ?? "드래그로 이동"}
            title={disabledReason ?? "드래그로 이동"}
            className={cn(
              "-m-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded p-1.5",
              disabled
                ? "cursor-not-allowed text-muted-foreground/30"
                : "cursor-grab text-muted-foreground/70 hover:bg-foreground/10 hover:text-foreground active:cursor-grabbing",
            )}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
}
