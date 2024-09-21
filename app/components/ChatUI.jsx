"use client";
import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import {
  FiSearch,
  FiPlus,
  FiSun,
  FiMoon,
  FiSmile,
  FiPaperclip,
  FiSend,
  FiMenu,
  FiDownload,
} from "react-icons/fi";
import { IoMdContacts } from "react-icons/io";
const CHUNK_SIZE = 64 * 1024; // 64 KB

const ChatUI = ({ user, initialRoom }) => {
  const [currentFile, setCurrentFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [rooms, setRooms] = useState([{ id: initialRoom, name: initialRoom }]);
  const [activeUsers, setActiveUsers] = useState({});
  const [socket, setSocket] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState({
    id: initialRoom,
    name: initialRoom,
  });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");

    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Connected to server");
      newSocket.emit("join", { name: user.name, room: initialRoom });
    });

    newSocket.on("active rooms", (rooms) => {
      console.log("Active rooms:", rooms);
      setRooms(rooms.map((room) => ({ id: room, name: room })));
    });

    newSocket.on("new room", (room) => {
      console.log("New room received:", room);
      setRooms((prevRooms) => {
        if (!prevRooms.some((r) => r.id === room.id)) {
          return [...prevRooms, room];
        }
        return prevRooms;
      });
    });

    newSocket.on("chat message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on("active users", ({ room, users }) => {
      console.log(`Active users in ${room}:`, users);
      setActiveUsers((prevActiveUsers) => ({
        ...prevActiveUsers,
        [room]: users,
      }));
    });

    newSocket.on("room closed", (roomId) => {
      console.log(`Room closed: ${roomId}`);
      setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
      setActiveUsers((prevActiveUsers) => {
        const newActiveUsers = { ...prevActiveUsers };
        delete newActiveUsers[roomId];
        return newActiveUsers;
      });
      if (selectedRoom.id === roomId) {
        const newRoom = rooms.find((room) => room.id !== roomId) || {
          id: "general",
          name: "General",
        };
        setSelectedRoom(newRoom);
        newSocket.emit("join", { name: user.name, room: newRoom.id });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user.name, initialRoom]);

  useEffect(() => {
    if (socket && selectedRoom) {
      socket.emit("leave-room", selectedRoom.id);
      socket.emit("join", { name: user.name, room: selectedRoom.id });
    }
  }, [socket, selectedRoom, user.name]);

  useEffect(() => {
    if (socket && selectedRoom) {
      // Listen for incoming files
      socket.on("fileReceived", (file) => {
        console.log("File received:", file);
        const fileMessage = {
          id: Date.now(),
          type: "file",
          sender: file.sender,
          room: selectedRoom.id,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          fileName: file.fileName,
          fileData: file.fileData,
        };
        setMessages((prevMessages) => [...prevMessages, fileMessage]);
      });

      // Listen for progress updates
      socket.on("progressUpdate", ({ fileName, progress }) => {
        if (fileName === currentFile?.fileName) {
          setUploadProgress(progress);
        }
      });

      return () => {
        socket.off("fileReceived");
        socket.off("progressUpdate");
      };
    }
  }, [socket, selectedRoom, currentFile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    // Load dark mode preference from localStorage or default to system setting
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(savedDarkMode === "true" || (!savedDarkMode && prefersDark));

    // Apply the appropriate class to the document
    if (savedDarkMode === "true" || (!savedDarkMode && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => {
      const newDarkMode = !prevDarkMode;
      localStorage.setItem("darkMode", newDarkMode);
      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newDarkMode;
    });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && socket) {
      const newMessage = {
        id: Date.now(),
        type: "text",
        text: inputMessage,
        sender: user.name,
        room: selectedRoom.id,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      socket.emit("chat message", newMessage);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (emoji) => {
    setInputMessage(inputMessage + emoji);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && socket) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = new Uint8Array(reader.result);
        sendFileInChunks(fileData, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const sendFileInChunks = (fileData, fileName) => {
    const totalChunks = Math.ceil(fileData.byteLength / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = fileData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      socket.emit("sendFileChunk", {
        fileName,
        chunk: Array.from(chunk),
        chunkIndex: i,
        totalChunks,
        roomId: selectedRoom.id,
        sender: user.name,
      });
    }
  };

  const handleRoomChange = (newRoom) => {
    if (newRoom.id !== selectedRoom.id) {
      setSelectedRoom(newRoom);
      setMessages([]);
      if (socket) {
        socket.emit("leave-room", selectedRoom.id);
        socket.emit("join", { name: user.name, room: newRoom.id });
      }
    }
  };

  const handleCreateRoom = () => {
    if (newRoomName.trim() && socket) {
      socket.emit("create room", newRoomName.trim());
      setNewRoomName("");
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessage = (message) => {
    const isOwnMessage = message.sender === user.name;
    return (
      <div
        key={message.id}
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } mb-4`}
      >
        <div
          className={`flex ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          } items-end max-w-3/4`}
        >
          <img
            src={`https://api.multiavatar.com/${message.sender}.png`}
            alt={`${message.sender}'s avatar`}
            className="w-8 h-8 rounded-full mx-2"
          />
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwnMessage
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
            }`}
          >
            <div className="flex items-center mb-1">
              <span className="font-semibold text-sm mr-2">
                {message.sender}
              </span>
              <span className="text-xs opacity-75">{message.timestamp}</span>
            </div>
            {message.type === "text" ? (
              <p>{message.text}</p>
            ) : (
              <div className="flex items-center">
                <FiPaperclip className="mr-2" />
                <span className="truncate mr-2">{message.fileName}</span>
                <a
                  href={`data:application/octet-stream;base64,${message.fileData}`}
                  download={message.fileName}
                  className="text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-500"
                >
                  <FiDownload />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen ${darkMode ? "dark" : ""}`}>
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-800 dark:bg-gray-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">ChatterBox</h1>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="text-white focus:outline-none"
        >
          <FiMenu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Overlay */}
        {(showSidebar || showUsers) && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => {
              setShowSidebar(false);
              setShowUsers(false);
            }}
          />
        )}

        {/* Rooms Panel (Sidebar) */}
        <div
          className={`
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:flex-shrink-0 lg:w-64
          fixed lg:relative inset-y-0 left-0 z-30 w-64
          bg-gray-800 dark:bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          overflow-y-auto
        `}
        >
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Rooms</h2>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search rooms"
                className="w-full pl-10 pr-4 py-2 bg-gray-700 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="New room name"
                className="w-full pl-4 pr-10 py-2 bg-gray-700 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
              <button
                onClick={handleCreateRoom}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2">
              {filteredRooms.map((room) => (
                <li
                  key={room.id}
                  className={`p-2 rounded cursor-pointer ${
                    selectedRoom.id === room.id
                      ? "bg-gray-700 dark:bg-gray-800"
                      : "hover:bg-gray-700 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => handleRoomChange(room)}
                >
                  # {room.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              # {selectedRoom.name}
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              >
                {darkMode ? (
                  <FiSun className="w-6 h-6" />
                ) : (
                  <FiMoon className="w-6 h-6" />
                )}
              </button>
              <button
                onClick={() => setShowUsers(!showUsers)}
                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              >
                <IoMdContacts className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages
              .filter((message) => message.room === selectedRoom.id)
              .map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-4">
            <div className="flex items-end space-x-2">
              <button
                onClick={toggleEmojiPicker}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                aria-label="Open emoji picker"
              >
                <FiSmile className="w-6 h-6" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${selectedRoom.name}`}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  rows="1"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                />
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 mb-2">
                    <div className="grid grid-cols-5 md:grid-cols-8 gap-1">
                      {["😀", "😂", "😍", "🥳", "😎", "🤔", "😊", "👍"].map(
                        (emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiClick(emoji)}
                            className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-600 rounded p-1"
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  aria-label="Attach file"
                  ref={fileInputRef}
                />
                <FiPaperclip className="w-6 h-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
              </label>
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                aria-label="Send message"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Users Panel */}
        <div
          className={`
          ${showUsers ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0 lg:flex-shrink-0 lg:w-64
          fixed lg:relative inset-y-0 right-0 z-30 w-64
          bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          overflow-y-auto
        `}
        >
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Active Users in #{selectedRoom.name}
            </h2>
            <ul className="space-y-2">
              {(activeUsers[selectedRoom.id] || []).map((user) => (
                <li key={user.id} className="flex items-center">
                  <img
                    src={`https://api.multiavatar.com/${user.name}.png`}
                    alt={`${user.name}'s avatar`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="text-gray-800 dark:text-white">
                    {user.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
