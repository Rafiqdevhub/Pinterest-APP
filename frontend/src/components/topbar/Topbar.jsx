import { useNavigate } from "react-router-dom";
import "./topBar.css";
import UserButton from "../userButton/UserButton";

const TopBar = () => {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();

    navigate(`/search?search=${e.target[0].value}`);
  };
  return (
    <div className="topBar">
      <form onSubmit={handleSubmit} className="search">
        <input type="text" placeholder="Search" />
      </form>
      <UserButton />
    </div>
  );
};

export default TopBar;
