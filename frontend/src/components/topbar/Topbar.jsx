import { useNavigate } from "react-router-dom";
import "./topBar.css";
import UserButton from "../userButton/UserButton";
import Image from "../images/Image";

const TopBar = () => {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();

    navigate(`/search?search=${e.target[0].value}`);
  };
  return (
    <div className="topBar">
      <form onSubmit={handleSubmit} className="search">
        <Image path="/general/search.svg" alt="" />
        <input type="text" placeholder="Search" />
      </form>
      <UserButton />
    </div>
  );
};

export default TopBar;
