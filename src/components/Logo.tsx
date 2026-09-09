type LogoProps = {
  className?: string
  height?: string
}

export default function Logo({ className = '', height = 'h-8' }: LogoProps) {
  return (
    <img
      src="/zubkas-logo.png"
      alt="Zubkas Logo"
      className={`${height} w-auto object-contain ${className}`}
    />
  )
}
