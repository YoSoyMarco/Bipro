let productos = JSON.parse(localStorage.getItem('productos')) || [];
let caja = JSON.parse(localStorage.getItem('caja')) || { efectivo: 0, cuenta: 0 };

function guardar() {
    localStorage.setItem('productos', JSON.stringify(productos));
    localStorage.setItem('caja', JSON.stringify(caja));
    render();
}

// NUEVA: Función para agregar productos que faltaba
function agregarProducto() {
    const nombre = document.getElementById('p-nombre').value;
    const cantidad = parseFloat(document.getElementById('p-cantidad').value);
    const compra = parseFloat(document.getElementById('p-compra').value);
    const venta = parseFloat(document.getElementById('p-venta').value);

    if (!nombre || isNaN(cantidad) || isNaN(compra) || isNaN(venta)) {
        alert("Por favor, completa todos los campos correctamente.");
        return;
    }

    const nuevoProducto = {
        id: Date.now(), // ID único basado en tiempo
        nombre,
        cantidad,
        compra,
        venta
    };

    productos.push(nuevoProducto);
    
    // Limpiar campos
    document.getElementById('p-nombre').value = "";
    document.getElementById('p-cantidad').value = "";
    document.getElementById('p-compra').value = "";
    document.getElementById('p-venta').value = "";

    guardar();
}

function sumarDinero(tipo) {
    const el = document.getElementById(`input-${tipo}`);
    const valor = parseFloat(el.value);
    if(!isNaN(valor)) {
        caja[tipo] += valor;
        el.value = "";
        guardar();
    }
}

function habilitarEdicionDinero(tipo, span) {
    if (span.querySelector('input')) return;
    const valorActual = caja[tipo];
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'input-edit';
    input.value = valorActual;

    span.style.display = 'none';
    span.parentNode.insertBefore(input, span);
    input.focus();

    const finalizar = () => {
        caja[tipo] = parseFloat(input.value) || 0;
        input.remove();
        span.style.display = '';
        guardar();
    };

    input.onblur = finalizar;
    input.onkeydown = e => { if(e.key === 'Enter') finalizar(); };
}

function habilitarEdicion(id, campo, elemento) {
    const valorOriginal = elemento.innerText.replace('$', '').replace(/,/g, '');
    elemento.innerHTML = `<input type="${campo === 'nombre' ? 'text' : 'number'}" class="input-edit" id="temp-table-edit" value="${valorOriginal}">`;
    
    const input = document.getElementById('temp-table-edit');
    input.focus();

    const finalizar = () => {
        const p = productos.find(x => x.id === id);
        if (p) {
            const nuevoVal = campo === 'nombre' ? input.value : parseFloat(input.value);
            p[campo] = nuevoVal;
            guardar();
        }
    };

    input.onblur = finalizar;
    input.onkeydown = e => { if(e.key === 'Enter') finalizar(); };
}

function render() {
    const tbody = document.getElementById('lista-productos');
    const tfoot = document.getElementById('totales-inventario');
    if (!tbody || !tfoot) return;
    
    tbody.innerHTML = "";
    let sumTotalCompra = 0;
    let sumTotalVenta = 0;
    let sumGananciaTotal = 0;

    productos.forEach(p => {
        const subC = p.cantidad * p.compra;
        const subV = p.cantidad * p.venta;
        const gananciaFila = subV - subC;
        const roi = p.compra > 0 ? (((p.venta - p.compra) / p.compra) * 100).toFixed(0) : 0;
        
        sumTotalCompra += subC;
        sumTotalVenta += subV;
        sumGananciaTotal += gananciaFila;

        tbody.innerHTML += `
            <tr>
                <td ondblclick="habilitarEdicion(${p.id}, 'nombre', this)">${p.nombre}</td>
                <td ondblclick="habilitarEdicion(${p.id}, 'cantidad', this)">${p.cantidad}</td>
                <td ondblclick="habilitarEdicion(${p.id}, 'compra', this)">$${p.compra.toLocaleString()}</td>
                <td ondblclick="habilitarEdicion(${p.id}, 'venta', this)">$${p.venta.toLocaleString()}</td>
                <td><span class="rent-badge" style="background:${roi > 30 ? '#dcfce7' : '#fee2e2'}; color:${roi > 30 ? '#16a34a' : '#ef4444'}; padding:4px 8px; border-radius:8px; font-weight:bold">${roi}%</span></td>
                <td>$${subC.toLocaleString()}</td>
                <td>$${subV.toLocaleString()}</td>
                <td class="ganancia">$${gananciaFila.toLocaleString()}</td>
                <td><button onclick="borrarProducto(${p.id})">🗑️</button></td>
            </tr>
        `;
    });

    tfoot.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:right">TOTALES:</td>
            <td style="color:#CC27F5">$${sumTotalCompra.toLocaleString()}</td>
            <td style="color:#0ea5e9">$${sumTotalVenta.toLocaleString()}</td>
            <td style="color:#10b981; font-weight:900">$${sumGananciaTotal.toLocaleString()}</td>
            <td></td>
        </tr>
    `;

    document.getElementById('display-efectivo').innerText = (caja.efectivo || 0).toLocaleString();
    document.getElementById('display-cuenta').innerText = (caja.cuenta || 0).toLocaleString();
    
    const balanceTotal = (caja.efectivo || 0) + (caja.cuenta || 0) + sumTotalVenta;
    document.getElementById('balance-total').innerText = balanceTotal.toLocaleString();

    generarAnalisisIA();
}

function borrarProducto(id) {
    if(confirm("¿Eliminar producto?")) {
        productos = productos.filter(x => x.id !== id);
        guardar();
    }
}

function generarAnalisisIA() {
    const box = document.getElementById('ai-assistant');
    if (productos.length === 0) {
        box.innerHTML = "<h3>🤖 Diagnóstico IA</h3>Agregue productos para iniciar.";
        return;
    }

    const estrella = [...productos].sort((a,b) => (b.venta-b.compra)-(a.venta-a.compra))[0];
    box.innerHTML = `
        <h3>🤖 Diagnóstico de Rentabilidad</h3>
        <p>🏆 <strong>Líder de Utilidad:</strong> "${estrella.nombre}" ($${(estrella.venta-estrella.compra).toLocaleString()} por unidad).</p>
        <p>💡 <em>Sugerencia:</em> Enfócate en rotar más stock de ${estrella.nombre} para maximizar ganancias.</p>
    `;
}

render();