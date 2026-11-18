import Root from "./improved/Root.jsx";

// Bản cải thiện là bản chính. CSS của nó viết dưới :root[data-variant="improved"].
document.documentElement.dataset.variant = "improved";

export default function Shell() {
  return <Root />;
}
