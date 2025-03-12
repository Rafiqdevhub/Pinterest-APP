import { format } from "timeago.js";
import Image from "../images/Image";

const Comment = ({ comment }) => {
  return (
    <div className="comment">
      <Image path={comment.user.img || "/general/noAvatar.png"} alt="" />
      <div className="commentContent">
        <span className="commentUsername">{comment.user.displayName}</span>
        <p className="commentText">{comment.description}</p>
        <span className="commentTime">{format(comment.createdAt)}</span>
      </div>
    </div>
  );
};

export default Comment;
