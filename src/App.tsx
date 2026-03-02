import { useEffect, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import invariant from "tiny-invariant";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

interface Task {
  id: number;
  title: string;
  status: string;
  description: string;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Task 1",
      status: "todo",
      description: "Description for task 1",
    },
    {
      id: 2,
      title: "Task 2",
      status: "in-progress",
      description: "Description for task 2",
    },
    {
      id: 3,
      title: "Task 3",
      status: "done",
      description: "Description for task 3",
    },
  ]);

  const handleTaskDrop = (taskId: number, newStatus: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );
  };

  const columns = ["todo", "in-progress", "done"];
  return (
    <div className="p-6">
      <h4 className="text-4xl font-bold">Kanban Board</h4>
      <div className="mt-4">
        <Columns columns={columns} tasks={tasks} onTaskDrop={handleTaskDrop} />
      </div>
    </div>
  );
}

const Columns = ({
  columns,
  tasks,
  onTaskDrop,
}: {
  columns: string[];
  tasks: Task[];
  onTaskDrop: (taskId: number, newStatus: string) => void;
}) => {
  return (
    <div className="flex gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column);
        return (
          <Column
            key={column}
            title={column}
            tasks={columnTasks}
            onTaskDrop={onTaskDrop}
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
}: {
  title: string;
  tasks: Task[];
  onTaskDrop: (taskId: number, newStatus: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return dropTargetForElements({
      element: el,
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        const taskId = source.data.taskId;
        if (typeof taskId === "number") {
          onTaskDrop(taskId, title);
        }
      },
    });
  }, [title, onTaskDrop]);
  return (
    <div
      ref={ref}
      className={`w-74 h-200 border border-gray-300 rounded-lg p-2 ${isDraggedOver ? "bg-blue-100" : ""}`}
    >
      <p className="font-bold mb-2">{title}</p>
      <div>
        {tasks.length > 0 ? (
          tasks.map((task) => <Task key={task.id} task={task} />)
        ) : (
          <p>no Data found</p>
        )}
      </div>
    </div>
  );
};

const Task = ({ task }: { task: Task }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return draggable({
      element: el,
      getInitialData: () => ({ taskId: task.id }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    });
  }, [task.id]);
  return (
    <div
      ref={ref}
      className={`border bg-white border-gray-200 rounded p-2 mb-2 ${dragging ? "opacity-50" : ""}`}
    >
      <h5 className="font-bold">{task.title}</h5>
      <p className="text-sm">{task.description}</p>
    </div>
  );
};

export default App;
