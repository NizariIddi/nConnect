import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChatBubbleLeftIcon, UserPlusIcon } from "@heroicons/react/24/solid";

export default function Contacts() {
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState("friends");

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
      fetchFriends();
    } catch (err) {
      console.log(err);
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

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">

      {/* HEADER */}
      <div className="w-full bg-green-600 p-4 shadow-md flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold tracking-wide">nConnect</h1>
        <span className="flex items-center gap-2 text-white opacity-80 text-sm">
          <img
            src={
              loggedUser.profileImage
                ? `http://localhost:5000/uploads/${loggedUser.profileImage}`
                : "https://via.placeholder.com/32"
            }
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
          <b>{loggedUser.username}</b>
        </span>
      </div>

      <div className="p-6 max-w-3xl mx-auto">

        {/* TABS */}
        <div className="flex mb-4 border-b border-gray-700">
          {["friends", "all", "profile"].map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium ${
                activeTab === tab ? "border-b-2 border-green-500 text-green-500" : "text-gray-400 hover:text-white transition"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "friends" ? "My Friends" : tab === "all" ? "All Users" : "My Profile"}
            </button>
          ))}
        </div>

        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <div className="space-y-3">
            {!friends.length && <p className="text-gray-400">No friends yet.</p>}
            {friends.map(f => (
              <div
                key={f.id}
                className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700 shadow hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      f.profileImage
                        ? `http://localhost:5000/uploads/${f.profileImage}`
                        : "https://via.placeholder.com/40"
                    }
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                  />
                  <div>
                    <p className="font-medium">{f.username}</p>
                    <p className="text-sm text-gray-400">{f.email}</p>
                  </div>
                </div>

                <ChatBubbleLeftIcon
                  className="w-6 h-6 text-green-500 cursor-pointer hover:scale-110 transition"
                  onClick={() => goToChat(f)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ALL USERS TAB */}
        {activeTab === "all" && (
          <div className="space-y-3">
            {!users.length && <p className="text-gray-400">No users found.</p>}
            {users.map(u => (
              <div
                key={u.id}
                className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700 shadow hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      u.profileImage
                        ? `http://localhost:5000/uploads/${u.profileImage}`
                        : "https://via.placeholder.com/40"
                    }
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                  />
                  <div>
                    <p className="font-medium">{u.username}</p>
                    <p className="text-sm text-gray-400">{u.email}</p>
                  </div>
                </div>
                <UserPlusIcon
                  className="w-6 h-6 text-green-500 cursor-pointer hover:scale-110 transition"
                  onClick={() => addFriend(u.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-5 p-4 bg-gray-800 rounded-lg shadow border border-gray-700">

            {/* COVER IMAGE */}
            <div className="w-full h-40 bg-gray-700 rounded-lg overflow-hidden">
              {(previewCover || profile.coverImage) ? (
                <img
                  src={previewCover || `http://localhost:5000/uploads/${profile.coverImage}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <p className="text-center text-gray-400 pt-14">No cover image</p>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleCoverImageChange} className="text-gray-300" />

            {/* PROFILE IMAGE */}
            <div className="flex justify-center -mt-16">
              <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden border-4 border-gray-900 shadow-lg">
                {(previewProfile || profile.profileImage) ? (
                  <img
                    src={previewProfile || `http://localhost:5000/uploads/${profile.profileImage}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-center text-gray-400 pt-12">No photo</p>
                )}
              </div>
            </div>
            <input type="file" accept="image/*" onChange={handleProfileImageChange} className="mx-auto block text-gray-300" />

            {/* USERNAME */}
            <div>
              <label className="text-gray-300">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full mt-1 p-2 rounded border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-gray-300">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full mt-1 p-2 rounded border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              onClick={saveProfile}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Save Changes
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
