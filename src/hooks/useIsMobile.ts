"use client";
import { useEffect, useState } from "react";

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= breakpoint);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
