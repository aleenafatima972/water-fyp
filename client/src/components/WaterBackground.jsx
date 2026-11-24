import waterBg from '../assets/water-bg.jpg'

// Full-screen water photo behind the page (photo: Pexels #1533720, free to use).
// `overlay` tints the photo so text on top stays readable.
// The parent needs `relative isolate` so this sits behind the content but above the parent's background.
export default function WaterBackground({ overlay = 'bg-linear-to-br from-navy-950/95 via-navy-900/90 to-blue-950/85' }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${waterBg})` }} />
      <div className={`absolute inset-0 ${overlay}`} />
      {/* Soft blue glows, like a dashboard screen */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,117,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(79,70,229,0.2),transparent_50%)]" />
    </div>
  )
}
