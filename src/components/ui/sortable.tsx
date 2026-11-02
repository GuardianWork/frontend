import * as React from "react";
import { createPortal } from "react-dom";
import {
  closestCenter,
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DndContextProps,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DropAnimation,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type SortableContextProps,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

const orientationConfig = {
  vertical: {
    modifiers: [restrictToVerticalAxis, restrictToParentElement],
    strategy: verticalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  horizontal: {
    modifiers: [restrictToHorizontalAxis, restrictToParentElement],
    strategy: horizontalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  mixed: {
    modifiers: [restrictToParentElement],
    strategy: undefined,
    collisionDetection: closestCorners,
  },
};

const ROOT_NAME = "Sortable";
const CONTENT_NAME = "SortableContent";
const ITEM_NAME = "SortableItem";
const ITEM_HANDLE_NAME = "SortableItemHandle";
const OVERLAY_NAME = "SortableOverlay";

type MergableRef<T> = React.Ref<T> | undefined;

function useMergedRefs<T>(...refs: MergableRef<T>[]) {
  const refsRef = React.useRef(refs);
  refsRef.current = refs;

  return React.useCallback((node: T | null) => {
    for (const ref of refsRef.current) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  }, []);
}

interface SortableRootContextValue<T> {
  id: string;
  items: UniqueIdentifier[];
  modifiers: DndContextProps["modifiers"];
  strategy: SortableContextProps["strategy"];
  activeId: UniqueIdentifier | null;
  setActiveId: (id: UniqueIdentifier | null) => void;
  getItemValue: (item: T) => UniqueIdentifier;
  getItemLabel: (value: UniqueIdentifier) => string;
  flatCursor: boolean;
}

const SortableRootContext = React.createContext<SortableRootContextValue<unknown> | null>(null);

function useSortableContext(consumerName: string) {
  const context = React.useContext(SortableRootContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }
  return context;
}

interface GetItemValue<T> {
  /**
   * Returns a unique identifier for each sortable item. Required for arrays of objects.
   * @example getItemValue={(item) => item.id}
   */
  getItemValue: (item: T) => UniqueIdentifier;
}

type SortableProps<T> = Omit<DndContextProps, "id"> &
  (T extends object ? GetItemValue<T> : Partial<GetItemValue<T>>) & {
    value: T[];
    onValueChange?: (items: T[]) => void;
    onMove?: (event: DragEndEvent & { activeIndex: number; overIndex: number }) => void;
    strategy?: SortableContextProps["strategy"];
    orientation?: "vertical" | "horizontal" | "mixed";
    /** Readable name used in screen-reader announcements. Defaults to the raw id. */
    getItemLabel?: (value: UniqueIdentifier) => string;
    flatCursor?: boolean;
  };

function Sortable<T>(props: SortableProps<T>) {
  const {
    value,
    onValueChange,
    collisionDetection,
    modifiers,
    strategy,
    onMove,
    orientation = "vertical",
    flatCursor = false,
    getItemValue: getItemValueProp,
    getItemLabel,
    accessibility,
    ...sortableProps
  } = props;

  const id = React.useId();
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const config = React.useMemo(() => orientationConfig[orientation], [orientation]);

  const getItemValue = React.useCallback(
    (item: T): UniqueIdentifier => {
      if (typeof item === "object" && !getItemValueProp) {
        throw new Error("`getItemValue` is required when using an array of objects.");
      }
      return getItemValueProp ? getItemValueProp(item) : (item as UniqueIdentifier);
    },
    [getItemValueProp],
  );

  const items = React.useMemo(() => value.map((item) => getItemValue(item)), [value, getItemValue]);

  const resolveLabel = React.useCallback(
    (item: UniqueIdentifier) => (getItemLabel ? getItemLabel(item) : String(item)),
    [getItemLabel],
  );

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      sortableProps.onDragStart?.(event);
      if (event.activatorEvent.defaultPrevented) return;
      setActiveId(event.active.id);
    },
    [sortableProps],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      sortableProps.onDragEnd?.(event);

      const { active, over } = event;
      if (over && active.id !== over.id) {
        const activeIndex = value.findIndex((item) => getItemValue(item) === active.id);
        const overIndex = value.findIndex((item) => getItemValue(item) === over.id);

        if (onMove) onMove({ ...event, activeIndex, overIndex });
        else if (activeIndex !== -1 && overIndex !== -1)
          onValueChange?.(arrayMove(value, activeIndex, overIndex));
      }
      setActiveId(null);
    },
    [value, onValueChange, onMove, getItemValue, sortableProps],
  );

  const handleDragCancel = React.useCallback(
    (event: DragEndEvent) => {
      sortableProps.onDragCancel?.(event);
      setActiveId(null);
    },
    [sortableProps],
  );

  const announcements = React.useMemo<Announcements>(
    () => ({
      onDragStart({ active }) {
        const index = active.data.current?.sortable.index ?? 0;
        return `Đã chọn “${resolveLabel(active.id)}”, vị trí ${index + 1} trên ${value.length}. Dùng phím mũi tên để di chuyển, phím cách để thả.`;
      },
      onDragOver({ active, over }) {
        if (!over) return "Không còn vị trí thả. Nhấn Esc để huỷ.";
        const activeIndex = active.data.current?.sortable.index ?? 0;
        const overIndex = over.data.current?.sortable.index ?? 0;
        if (overIndex === activeIndex)
          return `“${resolveLabel(active.id)}” đang ở vị trí ${activeIndex + 1} trên ${value.length}.`;
        const direction = overIndex > activeIndex ? "xuống" : "lên";
        return `“${resolveLabel(active.id)}” đã di chuyển ${direction} tới vị trí ${overIndex + 1} trên ${value.length}.`;
      },
      onDragEnd({ active, over }) {
        if (!over) return `“${resolveLabel(active.id)}” đã thả. Không có thay đổi.`;
        const overIndex = over.data.current?.sortable.index ?? 0;
        return `“${resolveLabel(active.id)}” đã được thả tại vị trí ${overIndex + 1} trên ${value.length}.`;
      },
      onDragCancel({ active }) {
        const activeIndex = active.data.current?.sortable.index ?? 0;
        return `Đã huỷ sắp xếp. “${resolveLabel(active.id)}” trở về vị trí ${activeIndex + 1}.`;
      },
      onDragMove({ active, over }) {
        if (!over) return "Không còn vị trí thả. Nhấn Esc để huỷ.";
        const activeIndex = active.data.current?.sortable.index ?? 0;
        const overIndex = over.data.current?.sortable.index ?? 0;
        if (overIndex === activeIndex)
          return `“${resolveLabel(active.id)}” đang ở vị trí ${activeIndex + 1} trên ${value.length}.`;
        const direction = overIndex > activeIndex ? "xuống" : "lên";
        return `“${resolveLabel(active.id)}” đang di chuyển ${direction} tới vị trí ${overIndex + 1} trên ${value.length}.`;
      },
    }),
    [value, resolveLabel],
  );

  const screenReaderInstructions = React.useMemo<ScreenReaderInstructions>(
    () => ({
      draggable: `Để chọn một mục, nhấn phím cách hoặc Enter. Khi đang di chuyển, dùng phím ${
        orientation === "vertical"
          ? "lên và xuống"
          : orientation === "horizontal"
            ? "trái và phải"
            : "mũi tên"
      } để đổi vị trí. Nhấn phím cách hoặc Enter lần nữa để thả, hoặc Esc để huỷ.`,
    }),
    [orientation],
  );

  const contextValue = React.useMemo(
    () => ({
      id,
      items,
      modifiers: modifiers ?? config.modifiers,
      strategy: strategy ?? config.strategy,
      activeId,
      setActiveId,
      getItemValue,
      getItemLabel: resolveLabel,
      flatCursor,
    }),
    [
      id,
      items,
      modifiers,
      strategy,
      config.modifiers,
      config.strategy,
      activeId,
      getItemValue,
      resolveLabel,
      flatCursor,
    ],
  );

  return (
    <SortableRootContext.Provider value={contextValue as SortableRootContextValue<unknown>}>
      <DndContext
        collisionDetection={collisionDetection ?? config.collisionDetection}
        modifiers={modifiers ?? config.modifiers}
        sensors={sensors}
        accessibility={{
          announcements,
          screenReaderInstructions,
          ...accessibility,
        }}
        {...sortableProps}
        id={id}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      />
    </SortableRootContext.Provider>
  );
}

const SortableContentContext = React.createContext(false);

interface SortableContentProps extends React.HTMLAttributes<HTMLDivElement> {
  strategy?: SortableContextProps["strategy"];
  withoutSlot?: boolean;
}

const SortableContent = React.forwardRef<HTMLDivElement, SortableContentProps>(
  ({ strategy: strategyProp, withoutSlot, children, ...contentProps }, ref) => {
    const context = useSortableContext(CONTENT_NAME);

    return (
      <SortableContentContext.Provider value={true}>
        <SortableContext items={context.items} strategy={strategyProp ?? context.strategy}>
          {withoutSlot ? (
            children
          ) : (
            <div ref={ref} {...contentProps}>
              {children}
            </div>
          )}
        </SortableContext>
      </SortableContentContext.Provider>
    );
  },
);
SortableContent.displayName = CONTENT_NAME;

interface SortableItemContextValue {
  id: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  isDragging: boolean;
  disabled: boolean;
}

const SortableItemContext = React.createContext<SortableItemContextValue | null>(null);

function useSortableItemContext(consumerName: string) {
  const context = React.useContext(SortableItemContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ITEM_NAME}\``);
  }
  return context;
}

interface SortableItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: UniqueIdentifier;
  asHandle?: boolean;
  disabled?: boolean;
}

const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  (
    { value, style, asHandle = false, disabled = false, className, children, ...itemProps },
    ref,
  ) => {
    const inSortableContent = React.useContext(SortableContentContext);
    const inSortableOverlay = React.useContext(SortableOverlayContext);

    if (!inSortableContent && !inSortableOverlay) {
      throw new Error(
        `\`${ITEM_NAME}\` must be used within \`${CONTENT_NAME}\` or \`${OVERLAY_NAME}\`.`,
      );
    }
    if (value === "") throw new Error(`\`${ITEM_NAME}\` value cannot be an empty string.`);

    const context = useSortableContext(ITEM_NAME);
    const instanceId = React.useId();
    const id = itemProps.id ?? instanceId;
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: value, disabled });

    const composedRef = useMergedRefs(
      ref,
      React.useCallback(
        (node: HTMLDivElement | null) => {
          if (disabled) return;
          setNodeRef(node);
          if (asHandle) setActivatorNodeRef(node);
        },
        [disabled, asHandle, setNodeRef, setActivatorNodeRef],
      ),
    );

    const composedStyle = React.useMemo<React.CSSProperties>(
      () => ({
        transform: CSS.Translate.toString(transform),
        transition,
        ...style,
      }),
      [transform, transition, style],
    );

    const itemContext = React.useMemo<SortableItemContextValue>(
      () => ({ id, attributes, listeners, setActivatorNodeRef, isDragging, disabled }),
      [id, attributes, listeners, setActivatorNodeRef, isDragging, disabled],
    );

    const handleProps = asHandle && !disabled ? { ...attributes, ...listeners } : undefined;

    return (
      <SortableItemContext.Provider value={itemContext}>
        <div
          id={id}
          ref={composedRef}
          style={composedStyle}
          data-dragging={isDragging ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
          className={cn(
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            context.flatCursor
              ? "cursor-default"
              : asHandle && !isDragging
                ? "cursor-grab"
                : undefined,
            isDragging && "relative z-10 opacity-40",
            disabled && "pointer-events-none opacity-50",
            className,
          )}
          {...itemProps}
          {...handleProps}
        >
          {children}
        </div>
      </SortableItemContext.Provider>
    );
  },
);
SortableItem.displayName = ITEM_NAME;

type SortableItemHandleProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const SortableItemHandle = React.forwardRef<HTMLButtonElement, SortableItemHandleProps>(
  ({ disabled, className, ...handleProps }, ref) => {
    const context = useSortableContext(ITEM_HANDLE_NAME);
    const itemContext = useSortableItemContext(ITEM_HANDLE_NAME);

    const isDisabled = disabled ?? itemContext.disabled;
    const { setActivatorNodeRef } = itemContext;

    const composedRef = useMergedRefs(
      ref,
      React.useCallback(
        (node: HTMLButtonElement | null) => {
          if (isDisabled) return;
          setActivatorNodeRef(node);
        },
        [isDisabled, setActivatorNodeRef],
      ),
    );

    const dragProps = isDisabled
      ? undefined
      : { ...itemContext.attributes, ...itemContext.listeners };

    return (
      <button
        type="button"
        aria-controls={itemContext.id}
        ref={composedRef}
        disabled={isDisabled}
        data-dragging={itemContext.isDragging ? "" : undefined}
        data-disabled={isDisabled ? "" : undefined}
        className={cn(
          "select-none disabled:pointer-events-none disabled:opacity-50",
          context.flatCursor ? "cursor-default" : "cursor-grab data-[dragging]:cursor-grabbing",
          className,
        )}
        {...handleProps}
        {...dragProps}
      />
    );
  },
);
SortableItemHandle.displayName = ITEM_HANDLE_NAME;

const SortableOverlayContext = React.createContext(false);

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

interface SortableOverlayProps extends Omit<
  React.ComponentProps<typeof DragOverlay>,
  "children" | "modifiers"
> {
  container?: Element | DocumentFragment | null;
  modifiers?: DndContextProps["modifiers"];
  children?: ((params: { value: UniqueIdentifier }) => React.ReactNode) | React.ReactNode;
}

function SortableOverlay({
  container: containerProp,
  children,
  ...overlayProps
}: SortableOverlayProps) {
  const context = useSortableContext(OVERLAY_NAME);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const container = containerProp ?? (mounted ? globalThis.document?.body : null);
  if (!container) return null;

  return createPortal(
    <DragOverlay
      dropAnimation={dropAnimation}
      modifiers={context.modifiers}
      className={cn(!context.flatCursor && "cursor-grabbing")}
      {...overlayProps}
    >
      <SortableOverlayContext.Provider value={true}>
        {context.activeId
          ? typeof children === "function"
            ? children({ value: context.activeId })
            : children
          : null}
      </SortableOverlayContext.Provider>
    </DragOverlay>,
    container,
  );
}

export {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
  type SortableProps,
};
