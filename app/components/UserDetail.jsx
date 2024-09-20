"use client";
import React, { useState, useEffect } from "react";
import ChatUI from "./ChatUI";
import { io } from "socket.io-client";

const EntryPage = () => {
  const [user, setUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [availableRooms, setAvailableRooms] = useState(["General", "Random"]);

  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("active rooms", (rooms) => {
      setAvailableRooms(rooms);
    });
    return () => socket.disconnect();
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (name && selectedRoom) {
      setUser({ name, id: Date.now().toString() });
      setShowModal(false);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  if (user && selectedRoom) {
    return <ChatUI user={user} initialRoom={selectedRoom} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="m-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center">
          Welcome to <br />
          ChatterBox
        </h1>
        <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full sm:w-96">
          <form onSubmit={handleJoin}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Enter your name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="room" className="block text-sm font-medium mb-1">
                Select a room:
              </label>
              <select
                id="room"
                name="room"
                value={selectedRoom}
                onChange={(e) => handleRoomSelect(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a room</option>
                {availableRooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded-md text-white font-semibold"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EntryPage;
