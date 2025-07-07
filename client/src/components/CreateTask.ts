import { useState } from "react";

export function CreateTask() {
  const [message, setMessage] = useState("");

  const handleCreateTask = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("No token found. Please log in.");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error("Failed to create task");
      }

      const data = await res.json();
      setMessage(`✅ Task creada con ID: ${data.id}`);
    } catch (err) {
      setMessage("❌ Error al crear tarea");
      console.error(err);
    }
  };

  return (
    <div>
    <button onClick= { handleCreateTask } > Crear nueva tarea </button>
      < p > { message } </p>
      </div>
  );
}
