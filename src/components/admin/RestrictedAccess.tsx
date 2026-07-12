export function RestrictedAccess() {
  return (
    <div className="p-8">
      <div className="max-w-[420px] mx-auto mt-[80px] text-center bg-offwhite/3 border border-offwhite/7 p-10">
        <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-4">
          Acesso restrito
        </p>
        <p className="font-display font-light text-[20px] text-offwhite/70 leading-[1.4] mb-3">
          Esta área é visível apenas para o dono do negócio.
        </p>
        <p className="font-body font-light text-[12px] text-offwhite/35 leading-[1.6]">
          Se você acredita que deveria ter acesso, peça para um dono liberar sua conta em Configurações → Equipe.
        </p>
      </div>
    </div>
  )
}
