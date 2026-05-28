'use client'

export default function PrintButton() {
  return (
    <button className="no-print print-btn" onClick={() => window.print()}>
      Imprimir
    </button>
  )
}
