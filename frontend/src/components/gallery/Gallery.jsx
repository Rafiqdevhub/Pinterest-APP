import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import GalleryItems from "../galleryItem/GalleryItems";
import "./gallery.css";
import apiRequest from "../../utils/apiRequest";
import Skeleton from "../skeleton/Skeleton";

const fetchPins = async ({ pageParam = 0, search, userId, boardId }) => {
  const queryParams = new URLSearchParams({
    page: pageParam + 1,
    ...(search && { search }),
    ...(userId && { userId }),
    ...(boardId && { boardId }),
  });

  const res = await apiRequest.get(`/api/v1/pins?${queryParams}`);
  return res.data;
};

const Gallery = ({ search, userId, boardId }) => {
  const { data, fetchNextPage, hasNextPage, status } = useInfiniteQuery({
    queryKey: ["pins", search, userId, boardId],
    queryFn: ({ pageParam }) =>
      fetchPins({ pageParam, search, userId, boardId }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage
        : undefined,
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
