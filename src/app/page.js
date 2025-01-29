"use client"
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "@/abi";

const contractAddress = "0xd9fc6cC979472A5FA52750ae26805462E1638872";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskText, setTaskText] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  async function fetchTasks() {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    try {
      const data = await contract.getMyTask();
      setTasks(data);
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
    setLoading(true);
    try {
      const tx = await contract.addTask(taskText, taskTitle, false);
      await tx.wait();
      fetchTasks();
      setTaskTitle("");
      setTaskText("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
    setLoading(false);
  }

  async function deleteTask(taskId) {
    if (!window.ethereum) return;
    await requestAccount();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    setLoading(true);
    try {
      const tx = await contract.deleteTask(taskId);
      await tx.wait();
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
    setLoading(false);
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
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Task"}
        </button>
      </div>
      <ul>
        {tasks.map((task, index) => (
          <li key={index} className="border p-2 mb-2 flex justify-between">
            <div>
              <h2 className="font-bold">{task.taskTitle}</h2>
              <p>{task.taskText}</p>
            </div>
            <button
              className="bg-red-500 text-white p-1"
              onClick={() => deleteTask(task.id)}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
