import { useState } from "react";
import { io, Socket } from "socket.io-client";

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
  { id: 1, name: "Kirtan" },
  { id: 2, name: "Daksh" },
  { id: 3, name: "Ayush Bhai" },
  { id: 4, name: "Gauraj Bhai" },
  { id: 5, name: "Rahul Bhai" },
];

function App() {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [showUser, setShowUser] = useState<User | null>(null);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>(""); 
  const [socket, setSocket] = useState<Socket | null>(null);

const handleClick = () => {
  const user = users.find((u) => u.id === selectedId);
  if (!user) return;

  const newSocket = io("http://localhost:3001");
  newSocket.on("connect", () => {
    console.log("Socket connected:", newSocket.id);
    newSocket.emit("user_login", user.id);
  });

  // ✅ ADD THIS LISTENER
  newSocket.on("receive_message", (data) => {
    console.log("Message received:", data);

    setMessages((prev) => [
    ...prev,
    {
      senderId: data.senderId,
      receiverId:
        data.senderId === user.id
          ? activeUserId!       // if I sent it
          : user.id,        // if other user sent it
      senderName: data.senderName,
      text: data.message,
    },
  ]);
  });

  setSocket(newSocket);
  setShowUser(user);
};


  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
      console.log("Socket disconnected");
      setSocket(null);
    }
    setShowUser(null);
    setSelectedId("");
    setActiveUserId(null);
  };

  const handleSend = () => {
  if (!message || activeUserId === null || !showUser || !socket) return;

  const roomId = [showUser.id, activeUserId].sort().join("-");

  socket.emit("send_message", {
    roomId: roomId,
    message: message,
    senderId: showUser.id,
    senderName: showUser.name,
  });

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
                          if (!socket || !showUser) return;

                          setActiveUserId(user.id);

                          // Tell server to join room
                          socket.emit("join_room", {
                            myId: showUser.id,
                            otherUserId: user.id,
                          });

                          console.log("Joined room with:", user.id);
                        }}
                        className={`mr-5 my-0.5 font-bold shadow-xl border py-4 px-6 rounded hover:bg-blue-200 hover:cursor-pointer
                          ${
                            activeUserId === user.id
                              ? "bg-blue-500 text-white"
                              : "bg-white"
                          }`}
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
                        <div className="min-h-50 p-3">
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
                                    ? "bg-blue-500 text-white ml-auto"
                                    : "bg-gray-300 mr-auto"
                                }`}
                              >
                                {msg.text}
                              </div>
                            ))}
                        </div>

                        <input
                          value={message}
                          placeholder="Enter text"
                          className="border min-w-[90%]"
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                          className="rounded border bg-blue-400 hover:cursor-pointer px-2 min-w-[5%]"
                          onClick={handleSend}
                        >
                          send
                        </button>
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
