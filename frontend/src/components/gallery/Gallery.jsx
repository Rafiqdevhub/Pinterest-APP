import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import GalleryItems from "../galleryItem/GalleryItems";
import "./gallery.css";
import axios from "axios";
import Skeleton from "../skeleton/Skeleton";

const fetchPins = async ({ pageParam, search, userId, boardId }) => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_ENDPOINT}/api/v1/pins`
  );
  return res.data;
};
const Gallery = ({ search, userId, boardId }) => {
  const { data, fetchNextPage, hasNextPage, status } = useInfiniteQuery({
    queryKey: ["pins", search, userId, boardId],
    queryFn: ({ pageParam = 0 }) =>
      fetchPins({ pageParam, search, userId, boardId }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  if (status === "pending") return <Skeleton />;
  if (status === "error") return "Something went wrong...";

  const allPins = data?.pages?.flatMap((page) => page.data) || [];

  return (
    <InfiniteScroll
      dataLength={allPins.length}
      next={fetchNextPage}
      hasMore={hasNextPage}
      loader={<div>Loading...</div>}
      className="gallery"
    >
      {allPins?.map((item) => (
        <GalleryItems key={item._id} item={item} />
      ))}
    </InfiniteScroll>
  );
};

export default Gallery;
