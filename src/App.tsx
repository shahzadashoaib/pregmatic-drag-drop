import { useEffect, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import invariant from "tiny-invariant";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

interface Task {
  id: number;
  title: string;
  status: string;
  description: string;
  order: number;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Task 1",
      status: "todo",
      description: "Description for task 1",
      order: 0,
    },
    {
      id: 2,
      title: "Task 2",
      status: "in-progress",
      description: "Description for task 2",
      order: 0,
    },
    {
      id: 3,
      title: "Task 3",
      status: "done",
      description: "Description for task 3",
      order: 0,
    },
  ]);

  const [columns, setColumns] = useState<string[]>([
    "todo",
    "in-progress",
    "done",
  ]);

  const handleTaskDrop = (
    taskId: number,
    newStatus: string,
    targetTaskId?: number,
    position?: "before" | "after",
  ) => {
    setTasks((prevTasks) => {
      const draggedTask = prevTasks.find((t) => t.id === taskId);
      if (!draggedTask) return prevTasks;

      // Get tasks in target column
      const targetColumnTasks = prevTasks
        .filter((t) => t.status === newStatus && t.id !== taskId)
        .sort((a, b) => a.order - b.order);

      let newOrder: number;

      if (targetTaskId && position) {
        // Dropping near a specific task
        const targetIndex = targetColumnTasks.findIndex(
          (t) => t.id === targetTaskId,
        );
        if (targetIndex !== -1) {
          if (position === "before") {
            newOrder =
              targetIndex > 0
                ? (targetColumnTasks[targetIndex - 1].order +
                    targetColumnTasks[targetIndex].order) /
                  2
                : targetColumnTasks[targetIndex].order - 1;
          } else {
            newOrder =
              targetIndex < targetColumnTasks.length - 1
                ? (targetColumnTasks[targetIndex].order +
                    targetColumnTasks[targetIndex + 1].order) /
                  2
                : targetColumnTasks[targetIndex].order + 1;
          }
        } else {
          newOrder = targetColumnTasks.length;
        }
      } else {
        // Dropping in empty space - put at end
        newOrder =
          targetColumnTasks.length > 0
            ? targetColumnTasks[targetColumnTasks.length - 1].order + 1
            : 0;
      }

      return prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, order: newOrder }
          : task,
      );
    });
  };

  const handleColumnReorder = (draggedColumn: string, targetColumn: string) => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const draggedIndex = newColumns.indexOf(draggedColumn);
      const targetIndex = newColumns.indexOf(targetColumn);

      // Remove dragged column and insert at target position
      newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, draggedColumn);

      return newColumns;
    });
  };

  return (
    <div className="p-6">
      <h4 className="text-4xl font-bold">Kanban Board</h4>
      <div className="mt-4">
        <Columns
          columns={columns}
          tasks={tasks}
          onTaskDrop={handleTaskDrop}
          onColumnReorder={handleColumnReorder}
        />
      </div>
    </div>
  );
}

const Columns = ({
  columns,
  tasks,
  onTaskDrop,
  onColumnReorder,
}: {
  columns: string[];
  tasks: Task[];
  onTaskDrop: (
    taskId: number,
    newStatus: string,
    targetTaskId?: number,
    position?: "before" | "after",
  ) => void;
  onColumnReorder: (draggedColumn: string, targetColumn: string) => void;
}) => {
  return (
    <div className="flex gap-4">
      {columns.map((column) => {
        const columnTasks = tasks
          .filter((task) => task.status === column)
          .sort((a, b) => a.order - b.order);
        return (
          <Column
            key={column}
            title={column}
            tasks={columnTasks}
            onTaskDrop={onTaskDrop}
            onColumnReorder={onColumnReorder}
          />
        );
      })}
    </div>
  );
};

const Column = ({
  title,
  tasks,
  onTaskDrop,
  onColumnReorder,
}: {
  title: string;
  tasks: Task[];
  onTaskDrop: (
    taskId: number,
    newStatus: string,
    targetTaskId?: number,
    position?: "before" | "after",
  ) => void;
  onColumnReorder: (draggedColumn: string, targetColumn: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isTaskDraggedOver, setIsTaskDraggedOver] = useState(false);
  const [isColumnDraggedOver, setIsColumnDraggedOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    const cleanupDraggable = draggable({
      element: el,
      getInitialData: () => ({ columnId: title, type: "column" }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    // Single drop target that handles both tasks and columns
    const cleanupDropTarget = dropTargetForElements({
      element: el,
      onDragEnter: ({ source }) => {
        if (source.data.type === "column") {
          setIsColumnDraggedOver(true);
        } else if (source.data.type === "task") {
          setIsTaskDraggedOver(true);
        }
      },
      onDragLeave: ({ source }) => {
        if (source.data.type === "column") {
          setIsColumnDraggedOver(false);
        } else if (source.data.type === "task") {
          setIsTaskDraggedOver(false);
        }
      },
      onDrop: ({ source }) => {
        setIsColumnDraggedOver(false);
        setIsTaskDraggedOver(false);

        // Handle column reorder
        const columnId = source.data.columnId;
        if (typeof columnId === "string" && source.data.type === "column") {
          onColumnReorder(columnId, title);
        }

        // Handle task drop in empty space (at end of column)
        const taskId = source.data.taskId;
        if (typeof taskId === "number" && source.data.type === "task") {
          onTaskDrop(taskId, title);
        }
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [title, onTaskDrop, onColumnReorder]);
  return (
    <div
      ref={ref}
      className={`w-74 h-200 border-2 rounded-lg p-2 cursor-move transition-colors ${
        isTaskDraggedOver
          ? "border-blue-500 bg-blue-50"
          : isColumnDraggedOver
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <p className="font-bold mb-2">{title}</p>
      <div>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <Task
              key={task.id}
              task={task}
              columnStatus={title}
              onTaskDrop={onTaskDrop}
            />
          ))
        ) : (
          <EmptyDropZone columnStatus={title} onTaskDrop={onTaskDrop} />
        )}
      </div>
    </div>
  );
};

const EmptyDropZone = ({
  columnStatus,
  onTaskDrop,
}: {
  columnStatus: string;
  onTaskDrop: (
    taskId: number,
    newStatus: string,
    targetTaskId?: number,
    position?: "before" | "after",
  ) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => typeof source.data.taskId === "number",
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        const taskId = source.data.taskId;
        if (typeof taskId === "number") {
          onTaskDrop(taskId, columnStatus);
        }
      },
    });
  }, [columnStatus, onTaskDrop]);

  return (
    <div
      ref={ref}
      className={`min-h-20 border-2 border-dashed rounded p-2 text-center text-gray-400 ${
        isDraggedOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
      }`}
    >
      Drop task here
    </div>
  );
};

const Task = ({
  task,
  columnStatus,
  onTaskDrop,
}: {
  task: Task;
  columnStatus: string;
  onTaskDrop: (
    taskId: number,
    newStatus: string,
    targetTaskId?: number,
    position?: "before" | "after",
  ) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(
    null,
  );

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    const cleanupDraggable = draggable({
      element: el,
      getInitialData: () => ({ taskId: task.id, type: "task" }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    });

    const cleanupDropTarget = dropTargetForElements({
      element: el,
      canDrop: ({ source }) =>
        typeof source.data.taskId === "number" &&
        source.data.taskId !== task.id,
      getData: ({ input }) => {
        const rect = el.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const position = input.clientY < midpoint ? "before" : "after";
        return { taskId: task.id, position };
      },
      onDragEnter: ({ self }) => {
        const position = self.data.position as "before" | "after";
        setDropPosition(position);
      },
      onDrag: ({ self }) => {
        const position = self.data.position as "before" | "after";
        setDropPosition(position);
      },
      onDragLeave: () => setDropPosition(null),
      onDrop: ({ source, self }) => {
        setDropPosition(null);
        const draggedTaskId = source.data.taskId;
        const position = self.data.position as "before" | "after";
        if (typeof draggedTaskId === "number") {
          onTaskDrop(draggedTaskId, columnStatus, task.id, position);
        }
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [task.id, columnStatus, onTaskDrop]);

  return (
    <div className="relative">
      {dropPosition === "before" && (
        <div className="h-0.5 bg-blue-500 mb-1 rounded"></div>
      )}
      <div
        ref={ref}
        className={`border bg-white border-gray-200 rounded p-2 mb-2 cursor-grab active:cursor-grabbing ${
          dragging ? "opacity-50" : ""
        }`}
      >
        <h5 className="font-bold">{task.title}</h5>
        <p className="text-sm">{task.description}</p>
      </div>
      {dropPosition === "after" && (
        <div className="h-0.5 bg-blue-500 -mt-1 mb-1 rounded"></div>
      )}
    </div>
  );
};

export default App;
