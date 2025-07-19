"use client";
 
import React from "react";
import { Handle, HandleProps, Position } from "@xyflow/react";
import { Flex } from "@mantine/core";

const flexDirections: Record<Position, React.CSSProperties['flexDirection']> = {
  "top": "column",
  "right": "row-reverse",
  "bottom": "column-reverse",
  "left": "row",
};

const LabeledHandle = React.forwardRef<
  HTMLDivElement,
  HandleProps &
  React.HTMLAttributes<HTMLDivElement> &
  {
    title?: string;
    handleClassName?: string;
    labelClassName?: string;
  }
>(({ className, labelClassName, handleClassName, title, position, ...props },
    ref,
  ) => (
    <Flex
      ref={ref}
      title={title}
      direction={flexDirections[position] ?? undefined}
      className={`handle-text ${flexDirections[position] ?? ""} ${className ?? ""}`}>
      <Handle position={position} className={handleClassName} {...props}/>
      <span className={`px-2 ${labelClassName ?? ""}`} style={{visibility: title ? "visible" : "hidden", overflow: "hidden", textOverflow: "ellipsis"}}>
        {title ? title : "Nessun titolo"}
      </span>
    </Flex>
  ),
);
 
LabeledHandle.displayName = "LabeledHandle";
 
export { LabeledHandle };