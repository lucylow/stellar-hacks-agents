import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Database, Zap, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface Task {
  id: string;
  name: string;
  type: "search" | "blockchain_lookup" | "balance_check" | "chat";
  status: "pending" | "running" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  result?: string;
  error?: string;
}

export function AgentTaskPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Simulate task execution for demo
  useEffect(() => {
    const timer = setInterval(() => {
      // Add random demo tasks
      if (Math.random() > 0.7) {
        const taskTypes: Array<"search" | "blockchain_lookup" | "balance_check" | "chat"> = [
          "search",
          "blockchain_lookup",
          "balance_check",
          "chat",
        ];
        const newTask: Task = {
          id: `task_${Date.now()}`,
          name: `${taskTypes[Math.floor(Math.random() * taskTypes.length)]} query`,
          type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
          status: "running",
          startTime: new Date(),
        };

        setTasks((prev) => [newTask, ...prev.slice(0, 9)]);

        // Simulate task completion
        setTimeout(() => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === newTask.id
                ? {
                    ...t,
                    status: Math.random() > 0.1 ? "completed" : "failed",
                    endTime: new Date(),
                    result:
                      Math.random() > 0.1 ? "Task completed successfully" : undefined,
                    error: Math.random() > 0.1 ? undefined : "Task failed",
                  }
                : t
            )
          );
        }, 2000 + Math.random() * 3000);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "search":
        return <Search className="w-4 h-4 text-cyan-400" />;
      case "blockchain_lookup":
        return <Database className="w-4 h-4 text-purple-400" />;
      case "balance_check":
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "running":
        return <Clock className="w-4 h-4 text-cyan-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-950 text-green-300 border-green-500/30";
      case "failed":
        return "bg-red-950 text-red-300 border-red-500/30";
      case "running":
        return "bg-cyan-950 text-cyan-300 border-cyan-500/30";
      default:
        return "bg-gray-950 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <Card className="bg-slate-950 border-purple-500/50 h-full flex flex-col">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-purple-500/30 p-4">
        <h3 className="text-purple-400 font-semibold">Agent Tasks</h3>
        <p className="text-xs text-gray-400 mt-1">
          {tasks.filter((t) => t.status === "running").length} running
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-2">Agent tasks will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900/50 border border-purple-500/20 rounded p-3 hover:border-purple-500/50 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTaskIcon(task.type)}
                    <span className="text-sm text-cyan-300 font-mono">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <Badge className={`text-xs ${getStatusBadgeColor(task.status)}`}>
                      {task.status}
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  <p>Started: {task.startTime.toLocaleTimeString()}</p>
                  {task.endTime && (
                    <p>
                      Duration:{" "}
                      {Math.round(
                        (task.endTime.getTime() - task.startTime.getTime()) / 1000
                      )}
                      s
                    </p>
                  )}
                  {task.result && <p className="text-green-400">{task.result}</p>}
                  {task.error && <p className="text-red-400">{task.error}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
