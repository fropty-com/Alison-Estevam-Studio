export function ChatBubbleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-1L3 20l1.1-5A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 11.5 3h.5a8.5 8.5 0 0 1 8.5 8.5Z" />
    </svg>
  )
}
