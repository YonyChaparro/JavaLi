const filtros = {
  ingresos: document.getElementById("filtroIngresos"),
  costos: document.getElementById("filtroCostos"),
  utilidades: document.getElementById("filtroUtilidades"),
  iva: document.getElementById("filtroIVA"),
  producto: document.getElementById("filtroProducto"),
  periodo: document.getElementById("filtroPeriodo"),
};

const productoSelect = document.getElementById("productoSelect");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const reporteDiv = document.getElementById("reporte");
const btnGenerar = document.getElementById("btnGenerar");

filtros.producto.addEventListener("change", () => {
  productoSelect.disabled = !filtros.producto.checked;
  ocultarReporte();
});

filtros.periodo.addEventListener("change", () => {
  fechaInicio.disabled = fechaFin.disabled = !filtros.periodo.checked;
  ocultarReporte();
});

[...Object.values(filtros), productoSelect, fechaInicio, fechaFin].forEach(f =>
  f.addEventListener("change", ocultarReporte)
);

function ocultarReporte() {
  reporteDiv.classList.add("oculto");
}

btnGenerar.addEventListener("click", async () => {
  if (filtros.producto.checked && productoSelect.value === "") {
    alert("Seleccione un producto");
    return;
  }

  if (filtros.periodo.checked && (!fechaInicio.value || !fechaFin.value)) {
    alert("Seleccione un periodo válido");
    return;
  }

  // Construir parámetros de consulta
  const params = new URLSearchParams();
  if (filtros.producto.checked) params.append('producto', productoSelect.value);
  if (filtros.periodo.checked) {
    params.append('fechaInicio', fechaInicio.value);
    params.append('fechaFin', fechaFin.value);
  }

  // Obtener datos desde el backend
  let datos = [];
  try {
    const resp = await fetch(`http://localhost:3000/api/reportes?${params.toString()}`);
    datos = await resp.json();
    console.log("REPORTE RECIBIDO:", datos); // ← Agrega esto

  } catch (e) {
  console.error("Error detallado:", e);
  alert("Error al obtener datos del servidor: " + e.message);
  return;
}

  let html = `<table><tr><th>PRODUCTO</th>`;
  if (filtros.ingresos.checked) html += `<th>INGRESOS</th>`;
  if (filtros.costos.checked) html += `<th>COSTOS</th>`;
  if (filtros.utilidades.checked) html += `<th>UTILIDADES</th>`;
  if (filtros.iva.checked) html += `<th>IVA</th>`;
  html += `</tr>`;

  datos.forEach(d => {
    html += `<tr><td>${d.producto}</td>`;
    if (filtros.ingresos.checked) html += `<td>${Number(d.ingresos).toFixed(2)}</td>`;
    if (filtros.costos.checked) html += `<td>${Number(d.costos).toFixed(2)}</td>`;
    if (filtros.utilidades.checked) html += `<td>${Number(d.utilidades).toFixed(2)}</td>`;
    if (filtros.iva.checked) html += `<td>${Number(d.iva).toFixed(2)}</td>`;
    html += `</tr>`;
  });

  html += `</table>`;
  reporteDiv.innerHTML = html;
  reporteDiv.classList.remove("oculto");

  // Crear o mostrar el botón de PDF
  let btnPDF = document.getElementById("btnPDF");
  if (!btnPDF) {
    btnPDF = document.createElement("button");
    btnPDF.id = "btnPDF";
    btnPDF.textContent = "Descargar PDF";
    btnPDF.style.margin = "10px";
    reporteDiv.parentNode.insertBefore(btnPDF, reporteDiv.nextSibling);
  }
  btnPDF.classList.remove("oculto");

  btnPDF.onclick = () => {
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      alert("jsPDF no está cargado. Asegúrate de incluir jsPDF en tu HTML.");
      return;
    }
    // Usar jsPDF
    const doc = new (window.jspdf ? window.jspdf.jsPDF : window.jsPDF)();
    // Convertir la tabla HTML a texto plano para el PDF
    const table = reporteDiv.querySelector("table");
    if (!table) {
      alert("No hay tabla para exportar.");
      return;
    }
    // Usar autoTable si está disponible
    if (doc.autoTable) {
      doc.autoTable({ html: table });
    } else {
      // Fallback simple: solo texto
      doc.text(table.innerText, 10, 10);
    }
    doc.save("reporte.pdf");
  };
});

// Cargar productos vendidos al cargar la página
async function cargarProductosVendidos() {
  try {
    const resp = await fetch('http://localhost:3000/api/productos-vendidos');
    const productos = await resp.json();

    productoSelect.innerHTML = '<option value="">-- Selecciona --</option>';
    productos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.nombre;
      opt.textContent = p.nombre;
      productoSelect.appendChild(opt);
    });
  } catch (e) {
    console.error('Error al cargar productos vendidos:', e);
  }
}

cargarProductosVendidos();