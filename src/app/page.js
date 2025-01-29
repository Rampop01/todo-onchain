"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "@/abi";

const contractAddress = "0xd9fc6cC979472A5FA52750ae26805462E1638872";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskText, setTaskText] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  async function fetchTasks() {
    if (!window.ethereum) {
      console.error("Ethereum object not found");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
      const data = await contract.getMyTask();
      console.log("Fetched Tasks:", data);

      const formattedTasks = data.map((task, index) => ({
        id: task.id.toNumber(),
        taskTitle: task.taskTitle,
        taskText: task.taskText,
        isDeleted: task.isDeleted,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  async function addTask() {
    if (!taskTitle || !taskText) return;
    if (!window.ethereum) return;

    await requestAccount();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    setAddingTask(true);

    try {
      const tx = await contract.addTask(taskText, taskTitle, false);
      await tx.wait();
      console.log("Task added successfully!");

      
      const newTask = {
        id: tasks.length + 1, 
        taskTitle,
        taskText,
        isDeleted: false,
      };

      setTasks((prevTasks) => [...prevTasks, newTask]);

      
      setTaskTitle("");
      setTaskText("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
    setAddingTask(false);
  }

  async function deleteTask(taskId) {
    if (!window.ethereum) return;
    await requestAccount();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    setDeletingTaskId(taskId);

    try {
      const tx = await contract.deleteTask(taskId);
      await tx.wait();
      console.log(`Task ${taskId} deleted successfully!`);
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
    setDeletingTaskId(null);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Task Manager</h1>

      <div className="mb-4">
        <input
          className="border p-2 w-full"
          type="text"
          placeholder="Task Title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <textarea
          className="border p-2 w-full mt-2"
          placeholder="Task Description"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
        ></textarea>
        <button
          className="bg-blue-500 text-white p-2 mt-2 w-full"
          onClick={addTask}
          disabled={addingTask}
        >
          {addingTask ? "Adding..." : "Add Task"}
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">Added Tasks:</h2>
      <ul>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <li key={task.id} className="border p-2 mb-2 flex justify-between">
              <div>
                <h2 className="font-bold">{task.taskTitle}</h2>
                <p>{task.taskText}</p>
              </div>
              <button
                className="bg-red-500 text-white p-1"
                onClick={() => deleteTask(task.id)}
                disabled={deletingTaskId === task.id}
              >
                {deletingTaskId === task.id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))
        ) : (
          <p className="text-gray-500">No tasks found.</p>
        )}
      </ul>
    </div>
  );
}
