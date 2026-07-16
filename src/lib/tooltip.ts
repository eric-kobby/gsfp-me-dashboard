// A single floating tooltip element shared across all charts, positioned at the cursor.
let el: HTMLDivElement | null = null

function ensure(): HTMLDivElement {
  if (!el) {
    el = document.createElement('div')
    el.className = 'tooltip'
    el.setAttribute('role', 'status')
    document.body.appendChild(el)
  }
  return el
}

interface Pointer {
  clientX: number
  clientY: number
}

/** Imperative tooltip control, for charts that also manage their own hover state (e.g. a crosshair). */
export function showTip(html: string, clientX: number, clientY: number) {
  const t = ensure()
  t.innerHTML = html
  t.style.opacity = '1'
  t.style.left = `${Math.min(clientX + 14, window.innerWidth - t.offsetWidth - 8)}px`
  t.style.top = `${Math.min(clientY + 14, window.innerHeight - t.offsetHeight - 8)}px`
}

export function hideTip() {
  if (el) el.style.opacity = '0'
}

/** Spread the result onto any element to give it a hover tooltip. */
export function tipProps(html: string) {
  return {
    onMouseEnter: () => {
      const t = ensure()
      t.innerHTML = html
      t.style.opacity = '1'
    },
    onMouseMove: (e: Pointer) => {
      const t = ensure()
      t.style.left = `${Math.min(e.clientX + 14, window.innerWidth - t.offsetWidth - 8)}px`
      t.style.top = `${Math.min(e.clientY + 14, window.innerHeight - t.offsetHeight - 8)}px`
    },
    onMouseLeave: () => {
      if (el) el.style.opacity = '0'
    },
  }
}
