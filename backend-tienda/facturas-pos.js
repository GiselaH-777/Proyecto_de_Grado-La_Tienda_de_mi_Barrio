const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'tiendabarrio'
};

async function crearFacturaPOS(idUsuario, metodoPago, productos) {
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        let subtotalGeneral = 0;
        let totalIvaGeneral = 0;
        const lineasFacturaDetalle = [];

        productos.forEach((prod) => {
            const subtotalLinea = Number(prod.precio_unitario || 0) * Number(prod.cantidad || 0);
            const valorIvaLinea = subtotalLinea * (Number(prod.porcentaje_iva || 0) / 100);

            subtotalGeneral += subtotalLinea;
            totalIvaGeneral += valorIvaLinea;

            lineasFacturaDetalle.push({
                producto_codigo: prod.producto_codigo || prod.codigo || null,
                descripcion: prod.descripcion || prod.nombre || 'Producto',
                cantidad: Number(prod.cantidad || 0),
                precio_unitario: Number(prod.precio_unitario || 0),
                porcentaje_iva: Number(prod.porcentaje_iva || 0),
                valor_iva_linea: valorIvaLinea,
                subtotal_linea: subtotalLinea
            });
        });

        const totalPagarGeneral = subtotalGeneral + totalIvaGeneral;

        const [resultFactura] = await connection.query(
            `INSERT INTO facturas_pos 
            (id_usuario, subtotal, total_iva, total_pagar, metodo_pago, estado_pago) 
            VALUES (?, ?, ?, ?, ?, 'pendiente')`,
            [idUsuario, subtotalGeneral, totalIvaGeneral, totalPagarGeneral, metodoPago]
        );

        const idFacturaInsertada = resultFactura.insertId;

        for (const detalle of lineasFacturaDetalle) {
            await connection.query(
                `INSERT INTO factura_detalles 
                (id_factura, producto_codigo, descripcion, cantidad, precio_unitario, porcentaje_iva, valor_iva_linea, subtotal_linea) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    idFacturaInsertada,
                    detalle.producto_codigo,
                    detalle.descripcion,
                    detalle.cantidad,
                    detalle.precio_unitario,
                    detalle.porcentaje_iva,
                    detalle.valor_iva_linea,
                    detalle.subtotal_linea
                ]
            );
        }

        const [usuarios] = await connection.query(
            `SELECT documento, tipo_documento, dv, nombre, apellido, email, direccion, telefono 
             FROM usuarios WHERE id_usuario = ?`,
            [idUsuario]
        );
        const usuario = usuarios[0] || {};

        await connection.commit();

        const fechaActual = new Date().toISOString().split('T')[0];
        const horaActual = new Date().toTimeString().split(' ')[0] + '-05:00';

        const jsonDianPOS = {
            InvoiceData: {
                UBLVersionID: 'UBL 2.1',
                CustomizationID: '10',
                ProfileID: 'DIAN 2.1: Documento Equivalente Electrónico tiquete de máquina registradora con sistema POS',
                ProfileExecutionID: '1',
                ID: `POSA${idFacturaInsertada}`,
                IssueDate: fechaActual,
                IssueTime: horaActual,
                InvoiceTypeCode: '20',
                DocumentCurrencyCode: 'COP',
                LineCountNumeric: lineasFacturaDetalle.length
            },
            AccountingCustomerParty: {
                AdditionalAccountID: usuario.tipo_documento === '31' ? '1' : '2',
                RegistrationName: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
                CompanyID: usuario.documento || '0000000000',
                SchemeID: usuario.tipo_documento || '13',
                RegistrationAddress: {
                    Line: usuario.direccion || 'No Proporcionada'
                },
                Contact: {
                    Telephone: usuario.telefono || '0000000',
                    ElectronicMail: usuario.email || 'no-reply@local'
                }
            },
            PaymentMeans: {
                ID: '1',
                PaymentMeansCode: metodoPago === 'Efectivo' ? '10' : '1',
                PaymentDueDate: fechaActual
            },
            InvoiceLines: lineasFacturaDetalle.map((det, index) => ({
                ID: index + 1,
                InvoicedQuantity: det.cantidad,
                UnitCode: '94',
                LineExtensionAmount: Number(det.subtotal_linea.toFixed(2)),
                TaxTotal: {
                    TaxAmount: Number(det.valor_iva_linea.toFixed(2)),
                    TaxSubtotal: {
                        TaxableAmount: Number(det.subtotal_linea.toFixed(2)),
                        TaxAmount: Number(det.valor_iva_linea.toFixed(2)),
                        Percent: Number(det.porcentaje_iva.toFixed(2)),
                        TaxSchemeID: '01',
                        TaxSchemeName: 'IVA'
                    }
                },
                Item: {
                    Description: det.descripcion,
                    StandardItemIdentification: det.producto_codigo
                },
                Price: {
                    PriceAmount: Number(det.precio_unitario.toFixed(2))
                }
            })),
            LegalMonetaryTotal: {
                LineExtensionAmount: Number(subtotalGeneral.toFixed(2)),
                TaxExclusiveAmount: Number(subtotalGeneral.toFixed(2)),
                TaxInclusiveAmount: Number(totalPagarGeneral.toFixed(2)),
                PayableAmount: Number(totalPagarGeneral.toFixed(2))
            }
        };

        return {
            success: true,
            idFactura: idFacturaInsertada,
            jsonDocumentoElectronico: jsonDianPOS
        };

    } catch (error) {
        await connection.rollback();
        console.error('Error procesando la factura POS:', error);
        return { success: false, error: error.message || error };
    } finally {
        await connection.end();
    }
}

module.exports = { crearFacturaPOS };
