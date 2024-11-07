function initContent() {
  const box = document.createElement('div')

  Object.entries({
    bottom: '100px',
    right: '15px',
    marginRight: '22px',
    position: 'fixed',
    width: '80px',
    height: '36px',
    zIndex: 80,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#1f2329',
  }).forEach(([attr, value]) => {
    box.style[attr] = value
  })

  const operates = [
    {
      type: 'copy',
      innerHtml: `<svg aria-hidden="true" focusable="false" role="img" class="octicon octicon-copy" viewBox="0 0 16 16" width="16"
        height="16" fill="currentColor">
        <path
            d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z">
        </path>
        <path
            d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z">
        </path>
        </svg>`,
      action: () => {
        chrome.runtime.sendMessage({ flag: 'copy_docx_as_markdown' })
      },
    },
    {
      type: 'download',
      innerHtml: `<svg aria-hidden="true" focusable="false" role="img" class="octicon octicon-download" viewBox="0 0 16 16"
      width="16" height="16" fill="currentColor">
      <path
        d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z">
      </path>
      <path
        d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z">
      </path>
    </svg>`,
      action: () => {
        chrome.runtime.sendMessage({ flag: 'download_docx_as_markdown' })
      },
    },
  ]

  operates.forEach(({ type, innerHtml, action }) => {
    const btn = document.createElement('span')
    btn.setAttribute('data-type', type)
    btn.innerHTML = innerHtml

    Object.entries({
      display: 'inline-block',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#fff',
      cursor: 'pointer',
      border: `1px solid #dee0e3`,
      textAlign: 'center',
      lineHeight: '36px',
    }).forEach(([attr, value]) => {
      btn.style[attr] = value
    })

    btn.addEventListener('click', action)
    box.append(btn)
  })

  document.body.append(box)
}

window.addEventListener('load', initContent, false)
