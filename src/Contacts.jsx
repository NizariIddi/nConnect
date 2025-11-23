import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  ChatBubbleLeftIcon, UserPlusIcon, EnvelopeIcon, CheckCircleIcon, TrashIcon, 
  UserGroupIcon, GlobeAltIcon, UserCircleIcon, MagnifyingGlassIcon, SparklesIcon 
} from "@heroicons/react/24/solid";

export default function Contacts() {
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState("friends");
  const [addedFriends, setAddedFriends] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const [profile, setProfile] = useState({
    username: loggedUser.username,
    email: loggedUser.email,
    profileImage: loggedUser.profileImage || "",
    coverImage: loggedUser.coverImage || "",
  });

  const [previewProfile, setPreviewProfile] = useState(null);
  const [previewCover, setPreviewCover] = useState(null);

  const navigate = useNavigate();

  // ---------------- LOAD USERS + FRIENDS ----------------
  useEffect(() => {
    fetchUsers();
    fetchFriends();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/users");
      const allUsers = res.data.users?.filter(u => u.id !== loggedUser.id) || [];
      setUsers(allUsers);
    } catch (err) {
      console.log(err);
      setUsers([]);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/friends/${loggedUser.id}`);
      setFriends(res.data.friends || []);
    } catch (err) {
      console.log(err);
      setFriends([]);
    }
  };

  // ---------------- ADD FRIEND ----------------
  const addFriend = async (friendId) => {
    try {
      await axios.post("http://localhost:5000/add-friend", {
        userId: loggedUser.id,
        friendId,
      });
      setAddedFriends(prev => new Set([...prev, friendId]));
      setTimeout(() => {
        fetchFriends();
      }, 500);
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- DELETE FRIEND ----------------
  const deleteFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    
    try {
      await axios.post("http://localhost:5000/remove-friend", {
        userId: loggedUser.id,
        friendId,
      });
      fetchFriends();
    } catch (err) {
      console.log(err);
      alert("Failed to remove friend");
    }
  };

  // ---------------- GO TO CHAT ----------------
  const goToChat = (friend) => {
    localStorage.setItem("activeFriend", JSON.stringify(friend));
    navigate("/chat");
  };

  // ---------------- IMAGE PREVIEW ----------------
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewProfile(URL.createObjectURL(file));
    setProfile(prev => ({ ...prev, profileImageFile: file }));
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewCover(URL.createObjectURL(file));
    setProfile(prev => ({ ...prev, coverImageFile: file }));
  };

  // ---------------- SAVE PROFILE ----------------
  const saveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("userId", loggedUser.id);
      formData.append("username", profile.username);
      formData.append("email", profile.email);

      if (profile.profileImageFile) formData.append("profileImage", profile.profileImageFile);
      if (profile.coverImageFile) formData.append("coverImage", profile.coverImageFile);

      const res = await axios.post("http://localhost:5000/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert(res.data.message);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      fetchUsers();
      fetchFriends();
    } catch (err) {
      console.log(err);
      alert("Profile update failed");
    }
  };

  // Check if user is already a friend
  const isFriend = (userId) => {
    return friends.some(f => f.id === userId);
  };

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">

      {/* HEADER */}
      <div className="w-full bg-gray-900 shadow-2xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
              <SparklesIcon className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-black tracking-tight">nConnect</h1>
              <p className="text-gray-400 text-xs font-medium">Stay connected, stay inspired</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700">
              <img
                src={
                  loggedUser.profileImage
                    ? `http://localhost:5000/uploads/${loggedUser.profileImage}`
                    : "https://via.placeholder.com/32"
                }
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-green-500/30"
              />
              <div className="text-left">
                <p className="text-white font-bold text-sm">{loggedUser.username}</p>
                <p className="text-green-400 text-xs">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HERO SECTION */}
        <div className="mb-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
            Your Connection Hub
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Connect with friends, discover new people, and manage your social network all in one place
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 hover:border-green-500/40 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-xl">
                <UserGroupIcon className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{friends.length}</p>
                <p className="text-gray-400 text-sm font-medium">Total Friends</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 hover:border-purple-500/40 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-3 rounded-xl">
                <GlobeAltIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{users.length}</p>
                <p className="text-gray-400 text-sm font-medium">Available Users</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 hover:border-blue-500/40 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <ChatBubbleLeftIcon className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{friends.length}</p>
                <p className="text-gray-400 text-sm font-medium">Active Chats</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex gap-2 bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-700/50">
            {[
              { key: "friends", label: "My Friends", icon: UserGroupIcon },
              { key: "all", label: "Discover", icon: GlobeAltIcon },
              { key: "profile", label: "Profile", icon: UserCircleIcon }
            ].map(tab => (
              <button
                key={tab.key}
                className={`px-6 py-3 font-bold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.key 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30" 
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* SEARCH BAR */}
          {activeTab !== "profile" && (
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === "friends" ? "friends" : "users"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <div>
            {!filteredFriends.length && (
              <div className="text-center py-20 bg-gray-800/30 backdrop-blur-sm rounded-3xl border border-gray-700/50">
                <div className="text-7xl mb-6">👥</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {searchTerm ? "No friends found" : "No friends yet"}
                </h3>
                <p className="text-gray-400 text-lg mb-6">
                  {searchTerm ? "Try a different search term" : "Add some friends to start chatting!"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setActiveTab("all")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-green-500/30"
                  >
                    Discover People
                  </button>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFriends.map(f => (
                <div
                  key={f.id}
                  className="group relative bg-gray-800/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-700 hover:border-green-500/50"
                >
                  {/* Cover */}
                  <div 
                    className="h-32 bg-gray-700 relative"
                    style={{
                      backgroundImage: f.coverImage 
                        ? `url(http://localhost:5000/uploads/${f.coverImage})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFriend(f.id);
                      }}
                      className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm hover:bg-red-600 text-white p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110"
                      title="Remove friend"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile Image & Info */}
                  <div className="relative px-6 pb-6">
                    <div className="flex justify-center -mt-14 mb-4">
                      <div className="relative">
                        <img
                          src={
                            f.profileImage
                              ? `http://localhost:5000/uploads/${f.profileImage}`
                              : "https://via.placeholder.com/96"
                          }
                          alt="profile"
                          className="w-28 h-28 rounded-2xl object-cover border-4 border-gray-900 shadow-2xl ring-4 ring-green-500/30 group-hover:ring-green-500/60 transition-all"
                        />
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-lg border-4 border-gray-900 shadow-lg"></div>
                      </div>
                    </div>

                    <div className="text-center mb-5">
                      <h3 className="text-xl font-black text-white mb-2">{f.username}</h3>
                      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <EnvelopeIcon className="w-4 h-4" />
                        <span className="truncate font-medium">{f.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => goToChat(f)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/50 hover:scale-105"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      Start Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL USERS TAB */}
        {activeTab === "all" && (
          <div>
            {!filteredUsers.length && (
              <div className="text-center py-20 bg-gray-800/30 backdrop-blur-sm rounded-3xl border border-gray-700/50">
                <div className="text-7xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">No users found</h3>
                <p className="text-gray-400 text-lg">Try adjusting your search criteria</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map(u => {
                const isAlreadyFriend = isFriend(u.id);
                const justAdded = addedFriends.has(u.id);
                
                return (
                  <div
                    key={u.id}
                    className="group relative bg-gray-800/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-700 hover:border-purple-500/50"
                  >
                    {/* Cover Background */}
                    <div 
                      className="h-32 bg-gray-700 relative"
                      style={{
                        backgroundImage: u.coverImage 
                          ? `url(http://localhost:5000/uploads/${u.coverImage})`
                          : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
                      {isAlreadyFriend && (
                        <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                          <CheckCircleIcon className="w-4 h-4" />
                          Friend
                        </div>
                      )}
                    </div>

                    {/* Profile Image */}
                    <div className="relative px-6 pb-6">
                      <div className="flex justify-center -mt-14 mb-4">
                        <div className="relative">
                          <img
                            src={
                              u.profileImage
                                ? `http://localhost:5000/uploads/${u.profileImage}`
                                : "https://via.placeholder.com/96"
                            }
                            alt="profile"
                            className="w-28 h-28 rounded-2xl object-cover border-4 border-gray-900 shadow-2xl ring-4 ring-purple-500/30 group-hover:ring-purple-500/60 transition-all"
                          />
                        </div>
                      </div>

                      <div className="text-center mb-5">
                        <h3 className="text-xl font-black text-white mb-2">{u.username}</h3>
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span className="truncate font-medium">{u.email}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => addFriend(u.id)}
                        disabled={isAlreadyFriend || addedFriends.has(u.id)}
                        className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg
                          ${
                            isAlreadyFriend || addedFriends.has(u.id)
                              ? "bg-gray-600/50 text-gray-300 cursor-not-allowed shadow-none"
                              : "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-purple-500/40 hover:scale-105"
                          }`}
                      >
                        {addedFriends.has(u.id) ? (
                          <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                          <UserPlusIcon className="w-5 h-5" />
                        )}
                        {isAlreadyFriend
                          ? "Already Friend"
                          : addedFriends.has(u.id)
                          ? "Added"
                          : "Add Friend"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="max-w-2xl mx-auto bg-gray-800/70 rounded-3xl p-8 border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-black text-white mb-6">Edit Profile</h2>

            {/* Profile Image */}
            <div className="mb-6">
              <label className="block text-gray-400 mb-2 font-medium">Profile Image</label>
              <div className="flex items-center gap-4">
                <img
                  src={previewProfile || (profile.profileImage ? `http://localhost:5000/uploads/${profile.profileImage}` : "https://via.placeholder.com/100")}
                  alt="profile preview"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-900 shadow-2xl"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="text-sm text-gray-400"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="mb-6">
              <label className="block text-gray-400 mb-2 font-medium">Cover Image</label>
              <div className="flex items-center gap-4">
                <img
                  src={previewCover || (profile.coverImage ? `http://localhost:5000/uploads/${profile.coverImage}` : "https://via.placeholder.com/200x80")}
                  alt="cover preview"
                  className="w-48 h-20 rounded-2xl object-cover border-4 border-gray-900 shadow-2xl"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="text-sm text-gray-400"
                />
              </div>
            </div>

            {/* Username & Email */}
            <div className="mb-6">
              <label className="block text-gray-400 mb-2 font-medium">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2 font-medium">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>

            <button
              onClick={saveProfile}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-green-500/40"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
