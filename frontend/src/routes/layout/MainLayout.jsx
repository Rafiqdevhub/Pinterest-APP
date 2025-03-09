import { Outlet } from "react-router-dom";
import "./mainLayout.css";
import LeftBar from "../../components/leftbar/LeftBar";
import TopBar from "../../components/topbar/Topbar";

const MainLayout = () => {
  return (
    <div className="app">
      <LeftBar />
      <div className="content">
        <TopBar />
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
