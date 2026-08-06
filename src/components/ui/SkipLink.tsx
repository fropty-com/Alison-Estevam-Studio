/**
 * "Pular para o conteúdo" — primeiro elemento focável de cada shell,
 * invisível até receber foco por teclado (Tab). Aponta para o `id` do
 * `<main>` correspondente, deixando quem navega por teclado pular a
 * navegação repetida em toda página.
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-[10px] focus:bg-gold focus:text-charcoal-deep font-body font-medium text-[10px] tracking-[0.2em] uppercase"
    >
      Pular para o conteúdo
    </a>
  )
}
