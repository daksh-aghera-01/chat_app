import { useState } from "react";

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

  const handleClick = () => {
    const user = users.find((u) => u.id === selectedId);
    if (user) {
      setShowUser(user);
    }
  };

  const handleLogout = () => {
    setShowUser(null);
    setSelectedId("");
    setActiveUserId(null);
  };

  const handleSend = () => {
    if (!message || activeUserId === null || !showUser) return;

    const newMessage: Message = {
      senderId: showUser.id,
      receiverId: activeUserId,
      text: message,
    };

    setMessages([...messages, newMessage]);
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
                    e.target.value === "" ? "" : Number(e.target.value)
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
                          console.log("Selected User ID:", user.id);
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
                        <div className="min-h-[200px] p-3">
                          {messages
                            .filter(
                              (msg) =>
                                (msg.senderId === showUser.id &&
                                  msg.receiverId === activeUserId) ||
                                (msg.senderId === activeUserId &&
                                  msg.receiverId === showUser.id)
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

                        {/* INPUT AREA */}
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
