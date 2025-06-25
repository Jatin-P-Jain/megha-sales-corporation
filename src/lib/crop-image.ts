export const getCroppedImg = async (
  imageSrc: string,
  croppedAreaPixels: any,
): Promise<{ blobUrl: string; file: File }> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob!], `cropped_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      resolve({ blobUrl: URL.createObjectURL(blob!), file });
    }, "image/jpeg");
  });
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
