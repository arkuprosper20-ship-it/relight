import { useEffect, useState } from "react";

export function useMobileStudio() {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsPortrait(window.innerHeight >= window.innerWidth);
      setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return { isMobile, isPortrait, isTouch };
}
