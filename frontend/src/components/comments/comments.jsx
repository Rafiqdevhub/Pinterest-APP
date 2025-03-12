import "./comments.css";
import { useQuery } from "@tanstack/react-query";
import Comment from "./comment";
import CommentForm from "./commentForm";
import apiRequest from "../../utils/apiRequest";

const Comments = ({ id }) => {
  const { isPending, error, data } = useQuery({
    queryKey: ["comments", id],
    queryFn: () =>
      apiRequest.get(`/api/v1/comments/pin/${id}`).then((res) => res.data),
  });

  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  const comments = data?.data || [];

  return (
    <div className="comments">
      <div className="commentList">
        <span className="commentCount">
          {comments.length === 0
            ? "No comments"
            : comments.length + " Comments"}
        </span>
        {comments.map((comment) => (
          <Comment key={comment._id} comment={comment} />
        ))}
      </div>
      <CommentForm id={id} />
    </div>
  );
};

export default Comments;
