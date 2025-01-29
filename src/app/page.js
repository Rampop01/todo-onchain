"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "@/abi";

const contractAddress = "0xd9fc6cC979472A5FA52750ae26805462E1638872";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskText, setTaskText] = useState("");
  const [addedTask, setAddedTask] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  async function requestAccount() {
    if (!window.ethereum) {
      console.error("Ethereum provider not found!");
      alert("Please install MetaMask to use this feature.");
      return;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  async function fetchTasks() {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const data = await contract.getMyTask();

      console.log("Fetched Tasks:", data);

      const formattedTasks = data.map((task) => ({
        id: Number(task.id), // Ensure conversion from BigNumber
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
    if (!taskTitle || !taskText) {
      alert("Please enter a task title and description.");
      return;
    }
    if (!window.ethereum) return;

    try {
      await requestAccount();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      setAddingTask(true);

      const tx = await contract.addTask(taskText, taskTitle, false);
      await tx.wait();
      
      console.log("Task added successfully!");

      // Store newly added task locally
      const newTask = { taskTitle, taskText };
      setAddedTask(newTask);

      // Fetch updated tasks
      await fetchTasks();

      // Clear input fields
      setTaskTitle("");
      setTaskText("");
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Error adding task. Check console for details.");
    }

    setAddingTask(false);
  }

  async function deleteTask(taskId) {
    if (!window.ethereum) return;

    try {
      await requestAccount();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      setDeletingTaskId(taskId);

      const tx = await contract.deleteTask(taskId);
      await tx.wait();

      console.log(`Task ${taskId} deleted successfully!`);
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task. Check console for details.");
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
          <p className="text-gray-500"></p>
        )}
      </ul>
      {addedTask && (
        <div className="bg-green-200 text-green-800 p-2 mb-4 rounded">
          <strong>Task Added:</strong> {addedTask.taskTitle} - {addedTask.taskText}
        </div>
      )}
    </div>
  );
}
