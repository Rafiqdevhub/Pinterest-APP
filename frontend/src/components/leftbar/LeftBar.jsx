import { memo } from "react";
import { Link } from "react-router-dom";
import "./leftBar.css";
import Image from "../images/Image";

const menuItems = [
  { path: "/", icon: "/general/logo.png", alt: "Pinterest Logo", isLogo: true },
  { path: "/", icon: "/general/home.svg", alt: "Home" },
  { path: "/create", icon: "/general/create.svg", alt: "Create" },
  { path: "/", icon: "/general/updates.svg", alt: "Updates" },
  { path: "/", icon: "/general/messages.svg", alt: "Messages" },
];

const LeftBar = () => {
  return (
    <nav className="leftBar" aria-label="Main navigation">
      <div className="menuIcons">
        {menuItems.map((item) => (
          <Link
            key={item.icon}
            to={item.path}
            className="menuIcon"
            aria-label={item.alt}
          >
            <Image
              path={item.icon}
              alt={item.alt}
              className={item.isLogo ? "logo" : ""}
            />
          </Link>
        ))}
      </div>
      <Link to="/settings" className="menuIcon" aria-label="Settings">
        <Image path="/general/settings.svg" alt="Settings" />
      </Link>
    </nav>
  );
};

export default memo(LeftBar);
