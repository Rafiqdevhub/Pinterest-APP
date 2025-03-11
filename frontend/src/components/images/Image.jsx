import { IKImage } from "imagekitio-react";

const Image = ({ path, src, alt, className, w, h }) => {
  const endpoint = import.meta.env.VITE_URL_IK_ENDPOINT;

  if (!path && !src) {
    return null;
  }

  if (!endpoint) {
    return (
      <img
        src={path || src || null}
        alt={alt}
        className={className}
        style={{ width: w, height: h }}
      />
    );
  }

  return (
    <IKImage
      urlEndpoint={endpoint}
      path={path}
      src={src}
      transformation={[
        {
          height: h,
          width: w,
        },
      ]}
      alt={alt}
      loading="lazy"
      className={className}
      lqip={{ active: true, quality: 20 }}
    />
  );
};

export default Image;
