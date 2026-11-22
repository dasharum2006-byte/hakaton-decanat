
/** Декоративный фон: нежные волны и свечение. Только оформление. */
export function Backdrop() {
  return (
    <div className="app-backdrop" aria-hidden>
      <div className="app-backdrop__glow app-backdrop__glow--a" />
      <div className="app-backdrop__glow app-backdrop__glow--b" />
      <div className="app-backdrop__glow app-backdrop__glow--c" />

      <svg
        className="app-backdrop__waves"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          className="app-backdrop__wave app-backdrop__wave--1"
          d="M0 540 C 210 486 380 626 640 588 C 900 550 1080 648 1440 566 L1440 900 L0 900 Z"
        />
        <path
          className="app-backdrop__wave app-backdrop__wave--2"
          d="M0 668 C 240 606 470 726 760 678 C 1030 634 1220 726 1440 666 L1440 900 L0 900 Z"
        />
        <path
          className="app-backdrop__wave app-backdrop__wave--3"
          d="M0 786 C 280 738 540 828 860 788 C 1100 758 1280 816 1440 786 L1440 900 L0 900 Z"
        />
      </svg>

    </div>
  )
}
