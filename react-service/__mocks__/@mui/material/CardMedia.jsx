import React from 'react';

const CardMedia = ({ component, height, image, alt, onError, children, ...props }) => {
  if (component === 'img') {
    return (
      <img
        height={height}
        src={image}
        alt={alt}
        image={image}  // Keep the image attribute for tests
        onError={onError}
        data-testid="mui-card-media"
        {...props}
      />
    );
  }

  return (
    <div
      data-testid="mui-card-media"
      style={{ height }}
      image={image}  // Add image attribute for tests
      {...props}
    >
      {children}
    </div>
  );
};

CardMedia.displayName = 'CardMedia';

export default CardMedia;
