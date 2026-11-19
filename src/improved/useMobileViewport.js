import { useEffect, useState } from "react";

const measure = () => ({
  mobile: window.matchMedia("(max-width: 767px)").matches,
  // A soft keyboard can shrink the visual viewport without changing dvh on iOS.
  height: window.visualViewport?.scale === 1 ? window.visualViewport.height : window.innerHeight,
});

export default function useMobileViewport() {
  const [viewport, setViewport] = useState(measure);
  useEffect(() => {
    const update = () => setViewport(measure());
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);
  return viewport;
}
