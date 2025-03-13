import "./postPage.css";
import { Link, useParams } from "react-router-dom";
import Comments from "../../components/comments/comments";
import { useQuery } from "@tanstack/react-query";
import apiRequest from "../../utils/apiRequest";
import Image from "../../components/images/Image";
import PostInteractions from "../../components/postsInteractions/PostInteractions";

const PostPage = () => {
  const { id } = useParams();

  const { isPending, error, data } = useQuery({
    queryKey: ["pin", id],
    queryFn: () => apiRequest.get(`/api/v1/pins/${id}`).then((res) => res.data),
  });

  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  if (!data) return "Pin not found!";

  const user = data.user || {};
  const username = user.username || "unknown";
  const displayName = user.displayName || "Unknown User";
  const userImg = user.img || "/general/noAvatar.png";

  return (
    <div className="postPage">
      <svg
        height="20"
        viewBox="0 0 24 24"
        width="20"
        style={{ cursor: "pointer" }}
      >
        <path d="M8.41 4.59a2 2 0 1 1 2.83 2.82L8.66 10H21a2 2 0 0 1 0 4H8.66l2.58 2.59a2 2 0 1 1-2.82 2.82L1 12z"></path>
      </svg>
      <div className="postContainer">
        <div className="postImg">
          <Image path={data.media} alt="" w={736} />
        </div>
        <div className="postDetails">
          <PostInteractions postId={id} />
          <Link to={`/profile/${username}`} className="postUser">
            <Image path={userImg} alt={displayName} />
            <span>{displayName}</span>
          </Link>
          <Comments id={id} />
        </div>
      </div>
    </div>
  );
};

export default PostPage;
