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

const socket = io("http://localhost:3001", {
  autoConnect: false,
});

function App() {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [showUser, setShowUser] = useState<User | null>(null);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");

  // 1. Handle Incoming Messages
  useEffect(() => {
    if (showUser) {
      socket.connect();

      const handleReceiveMessage = (data: any) => {
        const { senderId, message } = data;

        setMessages((prev) => [
          ...prev,
          {
            senderId: Number(senderId),
            receiverId:
              Number(senderId) === showUser.id ? activeUserId! : showUser.id,
            text: message,
          },
        ]);
      };

      socket.on("receive_message", handleReceiveMessage);

      // Cleanup listener on unmount
      return () => {
        socket.off("receive_message", handleReceiveMessage);
        // Note: We don't disconnect socket here to keep the connection alive while switching users
      };
    }
  }, [showUser, activeUserId]);

  // 2. Handle Joining and LEAVING Rooms (The New Logic)
  useEffect(() => {
    if (showUser && activeUserId) {
      // Create a unique Room ID based on both User IDs (sorted numerically)
      const roomId = [showUser.id, activeUserId].sort((a, b) => a - b).join("-");

      const roomData = {
        myId: showUser.id,
        otherUserId: activeUserId,
      };

      // Join the new room
      socket.emit("join_room", roomData);

      // CLEANUP: This runs automatically when activeUserId changes (user switches chat)
      return () => {
        socket.emit("leave_room", { roomName: roomId });
      };
    }
  }, [activeUserId, showUser]);

  const handleClick = () => {
    const user = users.find((u) => u.id === selectedId);
    if (user) {
      setShowUser(user);
    }
  };

  const handleLogout = () => {
    socket.disconnect();
    setShowUser(null);
    setSelectedId("");
    setActiveUserId(null);
    setMessages([]);
  };

  const handleSend = () => {
    if (!message || activeUserId === null || !showUser) return;
    
    // Ensure we generate the exact same Room ID string as in the useEffect
    const roomId = [showUser.id, activeUserId].sort((a, b) => a - b).join("-");
    
    const messageData = {
      roomId,
      message,
      senderId: showUser.id,
      senderName: showUser.name,
    };
    
    socket.emit("send_message", messageData);
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

                <div className="flex border w-[45%] rounded">
                  <div className="w-full content-end">
                    {activeUserId === null ? (
                      <div className="p-4 font-bold text-gray-500">
                        Please select user
                      </div>
                    ) : (
                      <>

                        <div className="h-50 overflow-scroll no-scrollbar p-3 flex flex-col">
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