import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * exportHealthPDF({ data, history, ml })
 * Captures the #pdf-report div (hidden in DOM) and saves as PDF
 */
export async function exportHealthPDF({ data, history, ml }) {
  const el = document.getElementById('pdf-report')
  if (!el) return

  el.style.display = 'block'
  el.style.position = 'fixed'
  el.style.top = '-9999px'
  el.style.left = '0'
  el.style.width = '794px'   // A4 @ 96dpi

  await new Promise(r => setTimeout(r, 300))  // allow render

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW    = pdf.internal.pageSize.getWidth()
    const pdfH    = (canvas.height * pdfW) / canvas.width

    let y = 0
    const pageH = pdf.internal.pageSize.getHeight()

    // Multi-page support
    while (y < pdfH) {
      if (y > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH)
      y += pageH
    }

    const ts = new Date().toISOString().slice(0, 10)
    pdf.save(`health-report-${ts}.pdf`)
  } finally {
    el.style.display = 'none'
  }
}