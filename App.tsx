@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Outfit", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

/* Custom styles for mobile app container preview */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.2);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.4);
}

/* Animation helpers */
@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

.animate-pulse-ring {
  animation: pulse-ring 2s infinite ease-in-out;
}
