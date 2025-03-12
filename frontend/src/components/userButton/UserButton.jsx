import "./userButton.css";
import { useState } from "react";
import apiRequest from "../../utils/apiRequest";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../utils/authStore";
import Image from "../images/Image";

const UserButton = () => {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const { currentUser, removeCurrentUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiRequest.post("/api/v1/users/logout", {});
      removeCurrentUser();
      navigate("/auth");
    } catch (err) {
      console.log(err);
    }
  };

  return currentUser ? (
    <div className="userButton">
      <Image path={currentUser.img || "/general/noAvatar.png"} alt="" />
      <div onClick={() => setOpen((prev) => !prev)}>
        <Image path="/general/arrow.svg" alt="" className="arrow" />
      </div>
      {open && (
        <div className="userOptions">
          <Link to={`/profile/${currentUser.username}`} className="userOption">
            Profile
          </Link>
          <div className="userOption">Setting</div>
          <div className="userOption" onClick={handleLogout}>
            Logout
          </div>
        </div>
      )}
    </div>
  ) : (
    <Link to="/auth" className="loginLink">
      Login / Sign Up
    </Link>
  );
};

export default UserButton;
