import { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { PaperAirplaneIcon, PaperClipIcon, MicrophoneIcon, StopIcon, XMarkIcon, Bars3Icon, MagnifyingGlassIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";

const socket = io.connect("http://localhost:5000");

export default function Chat() {
  const loggedUser = JSON.parse(localStorage.getItem("user") || '{"id": 1, "username": "Demo User"}');
  const storedFriend = localStorage.getItem("activeFriend");

  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(storedFriend ? JSON.parse(storedFriend) : null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Audio recording
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Socket.IO: track online users
  useEffect(() => {
    socket.emit("user_online", { userId: loggedUser.id });
    socket.on("update_online", (onlineIds) => setOnlineUsers(onlineIds));
    
    socket.on("typing", (data) => {
      if (activeFriend && data.userId === activeFriend.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      socket.off("update_online");
      socket.off("typing");
    };
  }, [activeFriend]);

  // Fetch friends
  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:5000/friends/${loggedUser.id}`)
      .then(res => {
        setFriends(res.data.friends || []);
        setFilteredFriends(res.data.friends || []);
        setError("");
      })
      .catch(err => {
        console.error("Error fetching friends:", err);
        setError("Failed to load friends");
      })
      .finally(() => setLoading(false));
  }, []);

  // Search friends
  useEffect(() => {
    setFilteredFriends(friends.filter(f =>
      f.username.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [searchTerm, friends]);

  // Join room & receive messages
  useEffect(() => {
    if (!activeFriend) return;
    
    const roomId = [loggedUser.id, activeFriend.id].sort().join("_");
    socket.emit("join_room", { roomId });

    setUnreadCounts(prev => ({ ...prev, [activeFriend.id]: 0 }));
    setLoading(true);

    axios.get(`http://localhost:5000/messages/${loggedUser.id}/${activeFriend.id}`)
      .then(res => {
        setChat(res.data.messages || []);
        setError("");
      })
      .catch(err => {
        console.error("Error loading messages:", err);
        setError("Failed to load messages");
      })
      .finally(() => setLoading(false));

    const handleReceiveMessage = (data) => {
      if (
        (data.sender_id === loggedUser.id && data.receiver_id === activeFriend.id) ||
        (data.sender_id === activeFriend.id && data.receiver_id === loggedUser.id)
      ) {
        setChat(prev => [...prev, data]);
      } else {
        setUnreadCounts(prev => ({
          ...prev,
          [data.sender_id]: (prev[data.sender_id] || 0) + 1
        }));
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [activeFriend]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Typing indicator
  const handleTyping = () => {
    if (activeFriend) {
      socket.emit("typing", { userId: loggedUser.id, receiverId: activeFriend.id });
    }
  };

  // Helper function to detect links
function isLink(text) {
  const urlPattern = new RegExp(
    "(https?:\\/\\/(?:www\\.|(?!www))[^\\s\\.]+\\.[^\\s]{2,}|www\\.[^\\s]+\\.[^\\s]{2,})",
    "i"
  );
  return urlPattern.test(text);
}


  // Send text message
  const sendMessage = () => {
    if (!message.trim() || !activeFriend) return;
    
    socket.emit("send_message", {
      senderId: loggedUser.id,
      receiverId: activeFriend.id,
      message: message.trim()
    });
    
    setMessage("");
  };

  // File upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const sendFile = async () => {
    if (!file || !activeFriend) return;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("senderId", loggedUser.id);
    formData.append("receiverId", activeFriend.id);
    
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setChat(prev => [...prev, res.data.msgData]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError("");
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const cancelFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" });

        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("senderId", loggedUser.id);
        formData.append("receiverId", activeFriend.id);

        setLoading(true);
        try {
          const res = await axios.post("http://localhost:5000/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          setChat(prev => [...prev, res.data.msgData]);
          setError("");
        } catch (err) {
          console.error("Audio upload error:", err);
          setError("Failed to send audio");
        } finally {
          setLoading(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setError("");
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectFriend = (friend) => {
    setActiveFriend(friend);
    localStorage.setItem("activeFriend", JSON.stringify(friend));
    setUnreadCounts(prev => ({ ...prev, [friend.id]: 0 }));
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen text-white overflow-hidden" style={{ backgroundColor: '#1a1d29' }}>
  
      {/* Middle Section - Contacts & Chat */}
      <div className="flex-1 flex">
        {/* Contacts List */}
        <div className="w-80 border-r border-gray-800 flex flex-col" style={{ backgroundColor: '#1a1d29' }}>
          {/* User Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {loggedUser.profileImage ? (
                  <img
                    src={`http://localhost:5000/uploads/${loggedUser.profileImage}`}
                    alt="Profile"
                    onError={(e) => {
                      e.target.style.display = "none"; // hide broken image
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-xl font-bold select-none">
                    {loggedUser.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-lg">{loggedUser.username}</h2>
              </div>
            </div>

            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search friends"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                style={{ backgroundColor: '#13151f' }}
              />
            </div>
          </div>

          {/* Friends Online Count */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-400">Friends Online</span>
              <span className="text-sm font-semibold text-purple-400">{onlineUsers.length}</span>
            </div>
            
            {/* Online Friends Avatars */}
            <div className="flex items-center space-x-2 mt-3">
              {filteredFriends.filter(f => onlineUsers.includes(f.id.toString())).slice(0, 4).map(f => (
                <div key={f.id} className="relative">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all">
                    {f.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1d29]"></span>
                </div>
              ))}
            </div>
          </div>

          {/* Chats Header */}
          <div className="px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-400">Chats</h3>
          </div>

          {/* Chats List */}
          <div className="flex-1 overflow-y-auto">
            {loading && friends.length === 0 ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              filteredFriends.map(f => (
                <div
                  key={f.id}
                  className={`flex items-center space-x-3 px-6 py-3 cursor-pointer transition-all ${
                    activeFriend?.id === f.id ? "border-l-2 border-purple-500" : ""
                  }`}
                  style={{ 
                    backgroundColor: activeFriend?.id === f.id ? '#13151f' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (activeFriend?.id !== f.id) {
                      e.currentTarget.style.backgroundColor = '#13151f';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeFriend?.id !== f.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={() => selectFriend(f)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
                      {f.username.slice(0, 2).toUpperCase()}
                    </div>
                    {onlineUsers.includes(f.id.toString()) && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1a1d29]"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{f.username}</span>
                      <span className="text-xs text-gray-500">20:31</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">😎 🙂‍↔️</p>
                  </div>
                  {unreadCounts[f.id] > 0 && (
                    <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      {unreadCounts[f.id]}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col" style={{ backgroundColor: '#1a1d29' }}>
          {activeFriend ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-800" style={{ backgroundColor: '#1a1d29' }}>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">Chat with</div>
                  <h2 className="text-lg font-semibold">{activeFriend.username}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-6 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-1">
                {chat.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender_id === loggedUser.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md ${msg.sender_id === loggedUser.id ? "" : ""}`}>
                      {msg.message && (
                        <div className={`flex items-end mb-3 ${msg.sender_id === loggedUser.id ? "justify-end" : "justify-start"}`}>
                          
                          {/* Sender avatar (only on received messages) */}
                          {msg.sender_id !== loggedUser.id && (
                            <img
                              src={msg.sender_profile_image ? `http://localhost:5000/uploads/${msg.sender_profile_image}` : "https://via.placeholder.com/32"}
                              alt={msg.sender_username}
                              className="w-8 h-8 rounded-full object-cover mr-2"
                            />
                          )}

                          {/* Message bubble */}
                          <div className={`px-4 py-2.5 inline-block max-w-xs break-words ${
                            msg.sender_id === loggedUser.id
                              ? "bg-purple-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
                              : "bg-green-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"
                          }`}>
                            {isLink(msg.message) ? (
                              <a
                                href={msg.message}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-gray-200"
                              >
                                {msg.message}
                              </a>
                            ) : (
                              msg.message
                            )}
                          </div>

                          {/* Sender avatar (only on sent messages) */}
                          {msg.sender_id === loggedUser.id && (
                            <img
                              src={loggedUser.profileImage ? `http://localhost:5000/uploads/${loggedUser.profileImage}` : "https://via.placeholder.com/32"}
                              alt="Me"
                              className="w-8 h-8 rounded-full object-cover ml-2"
                            />
                          )}
                          
                        </div>
                      )}

                      {msg.file_path && (
                        <div className="mt-2">
                          {/* IMAGE FILES */}
                          {msg.file_type?.startsWith("image/") && (
                            <img
                              src={`http://localhost:5000${msg.file_path}`}
                              alt="Shared"
                              className="max-w-xs max-h-64 rounded-2xl object-cover"
                              onError={(e) => { e.target.style.display = "none"; }} // hide if broken
                            />
                          )}

                          {/* AUDIO FILES */}
                          {msg.file_type?.startsWith("audio/") && (
                            <audio controls src={`http://localhost:5000${msg.file_path}`} className="w-64" />
                          )}

                          {/* OTHER FILES */}
                          {msg.file_type &&
                            !msg.file_type.startsWith("image/") &&
                            !msg.file_type.startsWith("audio/") && (
                              <a
                                href={`http://localhost:5000${msg.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-[#252836] rounded-xl text-purple-400 hover:text-purple-300 transition-colors mt-1"
                              >
                                <PaperClipIcon className="w-4 h-4 mr-2" />
                                {msg.file_path.split("/").pop()}
                              </a>
                            )}
                        </div>
                      )}

                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Input Area */}
              <div className="px-8 py-5 border-t border-gray-800" style={{ backgroundColor: '#1a1d29' }}>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 flex items-center rounded-xl px-4 py-3 border border-gray-800" style={{ backgroundColor: '#252836' }}>
                    <input
                      type="text"
                      placeholder="Type your message"
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    
                    {file && (
                      <div className="flex items-center space-x-2 mr-3">
                        <span className="text-sm truncate max-w-xs text-gray-400">{file.name}</span>
                        <button onClick={cancelFile} className="text-red-400 hover:text-red-300">
                          <XMarkIcon className="w-4 h-4"/>
                        </button>
                        <button onClick={sendFile} className="text-purple-400 hover:text-purple-300">
                          <PaperAirplaneIcon className="w-4 h-4"/>
                        </button>
                      </div>
                    )}
                    
                    {!file && (
                      <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-gray-300 transition-colors">
                        <PaperClipIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {!file && (
                    <>
                      {recording ? (
                        <button onClick={stopRecording} className="p-3 bg-red-500 rounded-xl hover:bg-red-400 transition-colors">
                          <StopIcon className="w-5 h-5"/>
                        </button>
                      ) : (
                        <button onClick={startRecording} className="p-3 bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors">
                          <MicrophoneIcon className="w-5 h-5"/>
                        </button>
                      )}
                      <button onClick={sendMessage} className="p-3 bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors">
                        <PaperAirplaneIcon className="w-5 h-5"/>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold mb-2">Select a conversation</h2>
              <p className="text-gray-400">Choose a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Profile Info */}
      {activeFriend && (
        <div className="w-80 border-l border-gray-800 p-6" style={{ backgroundColor: '#13151f' }}>
          <div className="text-right mb-6">
            <span className="text-sm text-gray-400">20 March 2021</span>
          </div>
          
<div className="flex flex-col items-center mb-8 flex items-center justify-center mb-4 shadow-lg overflow-hidden relative"
style={{
      backgroundImage: activeFriend?.coverImage
        ? `url(http://localhost:5000/uploads/${activeFriend.coverImage})`
        : "linear-gradient(to bottom right, #7f00ff, #e100ff)", // fallback gradient
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
  <div
    className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden relative"
    
  >
    {activeFriend?.profileImage ? (
      <img
        src={`http://localhost:5000/uploads/${activeFriend.profileImage}`}
        alt={activeFriend.username || "User"}
        onError={(e) => {
          e.target.style.display = "none"; // hide broken image
        }}
        className="w-full h-full object-cover rounded-full"
      />
    ) : (
      <span className="text-4xl font-bold text-white select-none">
        {activeFriend?.username
          ? activeFriend.username.slice(0, 2).toUpperCase()
          : "??"}
      </span>
    )}
  </div>

  <h3 className="text-xl font-semibold mb-2">{activeFriend.username}</h3>
  <div className="flex items-center space-x-1 text-gray-400">
    <span
      className={`w-2 h-2 rounded-full ${
        onlineUsers.includes(activeFriend.id.toString())
          ? "bg-green-500"
          : "bg-gray-500"
      }`}
    ></span>
    <span className="text-sm">
      {onlineUsers.includes(activeFriend.id.toString()) ? "Online" : "Offline"}
    </span>
  </div>
</div>


          {/* Shared Files */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm">Shared Files</h4>
              <button className="text-purple-400 text-xs hover:text-purple-300">see all</button>
            </div>
            <div className="space-y-2">
              {chat.filter(msg => msg.file_path && msg.file_type?.startsWith("image/")).slice(0, 4).map((msg, i) => (
                <div 
                  key={i} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-opacity-80 transition-all cursor-pointer group"
                  style={{ backgroundColor: '#1a1d29' }}
                  onClick={() => window.open(`http://localhost:5000${msg.file_path}`, '_blank')}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-gray-700 group-hover:ring-purple-500 transition-all">
                    <img 
                      src={`http://localhost:5000${msg.file_path}`} 
                      alt="Shared file" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-gray-200 group-hover:text-purple-400">
                      {msg.file_path.split("/").pop()}
                    </p>
                    <p className="text-xs text-gray-500">Click to view</p>
                  </div>
                </div>
              ))}
              {chat.filter(msg => msg.file_path && msg.file_type?.startsWith("image/")).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-xs">
                  No shared images yet
                </div>
              )}
            </div>
          </div>

          {/* Shared Links */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm">Shared Links</h4>
              <button className="text-purple-400 text-xs hover:text-purple-300">see all</button>
            </div>
            <div className="space-y-3">
              <a 
                href="https://dribbble.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-sm hover:bg-opacity-50 p-2 rounded-lg transition-all group"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 29, 41, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)' }}>
                  <span className="text-pink-500 font-bold text-lg">D</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 group-hover:text-purple-400 truncate">Dribbble.com</p>
                  <p className="text-xs text-gray-500">10:32pm</p>
                </div>
              </a>
              <a 
                href="https://awwwards.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-sm hover:bg-opacity-50 p-2 rounded-lg transition-all group"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 29, 41, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }}>
                  <span className="text-orange-500 font-bold text-lg">W</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 group-hover:text-purple-400 truncate">Awwwards.com</p>
                  <p className="text-xs text-gray-500">10:32pm</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}