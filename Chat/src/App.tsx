import { useState, useEffect } from "react";

import { io } from "socket.io-client";

interface User {
  id: number;

  name: string;
}

interface Message {
  senderId: number;

  receiverId: number;

  text: string;
}

const users: User[] = [
  { id: 101, name: "Kirtan" },

  { id: 102, name: "Daksh" },

  { id: 103, name: "Ayush Bhai" },

  { id: 104, name: "Gauraj Bhai" },

  { id: 105, name: "Rahul Bhai" },
];

// Initialize socket outside component to prevent re-connections on render

const socket = io("http://localhost:3001", {
  autoConnect: false, // We will connect manually when user "logs in"
});

function App() {
  const [selectedId, setSelectedId] = useState<number | "">("");

  const [showUser, setShowUser] = useState<User | null>(null);

  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [message, setMessage] = useState<string>("");

  // 1. Handle Socket Connection on Login

  useEffect(() => {
    if (showUser) {
      socket.connect();

      console.log("Socket connected for user:", showUser.name);

      // Listen for incoming messages

      socket.on("receive_message", (data) => {
        const { senderId, message } = data;

        setMessages((prev) => [
          ...prev,

          {
            senderId: Number(senderId), // Ensure type consistency

            // If I sent it, receiver is the active user. If I received it, receiver is ME.

            receiverId:
              Number(senderId) === showUser.id ? activeUserId! : showUser.id,

            text: message,
          },
        ]);
      });
    }

    // Cleanup listener on logout/unmount

    return () => {
      socket.off("receive_message");

      if (!showUser) socket.disconnect();
    };
  }, [showUser, activeUserId]); // Re-run if user changes

  // 2. Handle Joining Room when Active User Changes

  useEffect(() => {
    if (showUser && activeUserId) {
      const roomData = {
        myId: showUser.id,

        otherUserId: activeUserId,
      };

      socket.emit("join_room", roomData);
    }
  }, [activeUserId, showUser]);

  const handleClick = () => {
    const user = users.find((u) => u.id === selectedId);

    if (user) {
      setShowUser(user);
    }
  };

  const handleLogout = () => {
    socket.disconnect(); // Disconnect socket

    setShowUser(null);

    setSelectedId("");

    setActiveUserId(null);

    setMessages([]); // Optional: Clear chats on logout
  };

  const handleSend = () => {
    if (!message || activeUserId === null || !showUser) return;

    // Logic to determine Room ID (Must match backend logic)

    const roomId = [showUser.id, activeUserId].sort().join("-");

    const messageData = {
      roomId,

      message,

      senderId: showUser.id,

      senderName: showUser.name,
    };

    // Emit to server

    socket.emit("send_message", messageData);

    // Note: We do NOT setMessages here manually.

    // The server emits 'receive_message' back to the sender too,

    // so the listener in useEffect will handle the UI update.

    setMessage("");
  };

  return (
    <>
      <div className="max-w-screen max-h-screen">
        <div className="text-center pt-6">
          {!showUser && (
            <>
              <select
                value={selectedId}
                onChange={(e) =>
                  setSelectedId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="border p-2 rounded hover:cursor-pointer"
              >
                <option value="">Select a User</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <button
                className="ml-6 content-center mt-6 rounded-xl border px-3 py-1 bg-blue-500 text-white hover:bg-blue-400 hover:cursor-pointer"
                onClick={handleClick}
              >
                Login
              </button>
            </>
          )}

          {showUser && (
            <div className=" content-center items-center w-100px min-h-[75%]">
              <div className="mt-5 ">
                <p>User Id : {showUser.id}</p>
                <p>User Name: {showUser.name}</p>

                <button
                  className=" mt-6 rounded-xl border px-3 py-1 bg-blue-500 text-white hover:bg-blue-400 hover:cursor-pointer"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>

              <div className="mt-10 flex justify-center ">
                {/* LEFT SIDE USERS */}
                <div className="flex-col">
                  {users

                    .filter((user) => user.id !== showUser?.id)

                    .map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setActiveUserId(user.id);
                        }}
                        className={`mr-5 my-0.5 font-bold shadow-xl border py-4 px-6 rounded hover:bg-blue-200 hover:cursor-pointer

        ${activeUserId === user.id ? "bg-blue-500 text-white" : "bg-white"}`}
                      >
                        Id: {user.id} Name: {user.name}
                      </div>
                    ))}
                </div>

                {/* RIGHT SIDE CHAT */}
                <div className="flex border w-[45%] rounded">
                  <div className="w-full content-end">
                    {activeUserId === null ? (
                      <div className="p-4 font-bold text-gray-500">
                        Please select user
                      </div>
                    ) : (
                      <>
                        {/* MESSAGE DISPLAY AREA */}
                        <div className="min-h-50 p-3 flex flex-col">
                          {messages

                            .filter(
                              (msg) =>
                                (msg.senderId === showUser.id &&
                                  msg.receiverId === activeUserId) ||
                                (msg.senderId === activeUserId &&
                                  msg.receiverId === showUser.id),
                            )

                            .map((msg, index) => (
                              <div
                                key={index}
                                className={`my-1 px-3 py-2 rounded max-w-[60%] ${
                                  msg.senderId === showUser.id
                                    ? "bg-blue-500 text-white self-end text-right"
                                    : "bg-gray-300 self-start text-left"
                                }`}
                              >
                                {msg.text}
                              </div>
                            ))}
                        </div>

                        {/* INPUT AREA */}
                        <div className="flex w-full p-2">
                          <input
                            value={message}
                            placeholder="Enter text"
                            className="border grow p-2 rounded-l"
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          />
                          <button
                            className="rounded-r border bg-blue-400 text-white hover:bg-blue-500 hover:cursor-pointer px-4"
                            onClick={handleSend}
                          >
                            Send
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;