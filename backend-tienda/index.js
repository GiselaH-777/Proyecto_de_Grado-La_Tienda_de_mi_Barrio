const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { crearFacturaPOS } = require('./facturas-pos');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// --- 2. CONEXIÓN A LA BASE DE DATOS ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345', 
  database: 'tiendabarrio'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a MySQL:', err);
        return;
    }
    console.log('✅ ¡Conexión exitosa! El puente de La Tienda de Mi Barrio está activo.');
});

// --- 3. CONFIGURACIÓN DEL CARTERO (Nodemailer) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'laurahiginio17@gmail.com', 
    pass: 'jtsl tzpk ralz fmbn' // Tu código de 16 letras de Google
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Error con el cartero digital:", error);
  } else {
    console.log("📬 ¡El cartero está listo para enviar correos de la vecindad!");
  }
});

// --- 4. RUTAS DE AUTENTICACIÓN ---

// A. Iniciar Sesión (Versión unificada y validada)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    // Agregamos documento, nombre, apellido y correo a la consulta
    const query = 'SELECT id_usuario, id_rol, documento, nombre, apellido, email, fotoUrl FROM usuarios WHERE email = ? AND password = ?';
    
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }
    });
});

const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Crear la carpeta 'uploads' si no existe
const dir = './uploads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Configuración de almacenamiento
// almacenamiento en disco (para perfil) y en memoria (para procesar imagenes de producto)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Para procesar imágenes y guardarlas en la base de datos como Data URI
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

// HACER QUE LA CARPETA SEA PÚBLICA (Para que Angular pueda ver las fotos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// RUTA PARA SUBIR LA FOTO
app.post('/api/perfil/foto', upload.single('foto'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se recibió archivo' });
    }

    const urlFoto = `http://localhost:3000/uploads/${req.file.filename}`;
    const documento = req.body.documento || req.body.documento;

    console.log('=== RECIBIENDO FOTO ===');
    console.log('Archivo:', req.file.filename);
    console.log('Body completo:', req.body);
    console.log('Documento:', documento);
    console.log('======================');

    if (!documento) {
        console.log('⚠️ ERROR: Falta documento');
        return res.status(400).json({ success: false, message: 'Falta el documento del usuario' });
    }

    const query = 'UPDATE usuarios SET fotoUrl = ? WHERE documento = ?';
    
    console.log('Ejecutando query:', query);
    console.log('Con valores:', [urlFoto, documento]);

    db.query(query, [urlFoto, documento], (err, result) => {
        if (err) {
            console.error('❌ ERROR SQL:', err);
            return res.status(500).json({ success: false, message: 'Error al guardar en BD', error: err });
        }
        console.log('✅ UPDATE exitoso. Filas afectadas:', result.affectedRows);
        res.json({ success: true, url: urlFoto });
    });
});

// RUTA: Subir imagen de producto y guardarla en la tabla imagenes_productos
// Se guarda como Data URI en el campo `url_imagen` para evitar cambios de esquema DB
app.post('/api/productos/:id/imagenes', uploadMemory.single('imagen'), (req, res) => {
  const productoId = req.params.id;
  const es_portada = req.body.es_portada === '1' || req.body.es_portada === 'true' ? 1 : 0;

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ success: false, message: 'No se recibió archivo' });
  }

  const mime = req.file.mimetype;
  const base64 = req.file.buffer.toString('base64');
  const dataUri = `data:${mime};base64,${base64}`;

  // Si la nueva imagen será portada, desactivamos previas portadas del mismo producto
  const insertAndMaybeUnsetCover = () => {
    const insertQuery = 'INSERT INTO imagenes_productos (url_imagen, es_portada, id_producto) VALUES (?, ?, ?)';
    db.query(insertQuery, [dataUri, es_portada, productoId], (err, result) => {
      if (err) {
        console.error('❌ ERROR SQL al insertar imagen producto:', err);
        return res.status(500).json({ success: false, message: 'Error al guardar imagen en BD', error: err });
      }
      res.json({ success: true, id_imagen: result.insertId, url: dataUri });
    });
  };

  if (es_portada) {
    const unsetQuery = 'UPDATE imagenes_productos SET es_portada = 0 WHERE id_producto = ?';
    db.query(unsetQuery, [productoId], (err) => {
      if (err) {
        console.error('❌ ERROR SQL al desmarcar portadas:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar portadas', error: err });
      }
      insertAndMaybeUnsetCover();
    });
  } else {
    insertAndMaybeUnsetCover();
  }
});

// RUTA: Obtener imágenes de un producto
app.get('/api/productos/:id/imagenes', (req, res) => {
  const productoId = req.params.id;
  const query = 'SELECT id_imagen, url_imagen, es_portada, id_producto FROM imagenes_productos WHERE id_producto = ? ORDER BY es_portada DESC, id_imagen DESC';
  db.query(query, [productoId], (err, results) => {
    if (err) {
      console.error('❌ ERROR SQL al obtener imágenes:', err);
      return res.status(500).json({ success: false, message: 'Error al consultar imágenes', error: err });
    }
    res.json(results);
  });
});

// RUTA: Marcar imagen como portada
app.put('/api/productos/imagenes/:id/portada', (req, res) => {
  const idImagen = req.params.id;

  // obtener id_producto para poder desmarcar otras portadas
  db.query('SELECT id_producto FROM imagenes_productos WHERE id_imagen = ?', [idImagen], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Error interno', error: err });
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    const idProducto = rows[0].id_producto;

    const unset = 'UPDATE imagenes_productos SET es_portada = 0 WHERE id_producto = ?';
    db.query(unset, [idProducto], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Error al desmarcar portadas', error: err });

      const setCover = 'UPDATE imagenes_productos SET es_portada = 1 WHERE id_imagen = ?';
      db.query(setCover, [idImagen], (err2) => {
        if (err2) return res.status(500).json({ success: false, message: 'Error al marcar portada', error: err2 });
        res.json({ success: true });
      });
    });
  });
});

// RUTA: Eliminar imagen
app.delete('/api/productos/imagenes/:id', (req, res) => {
  const idImagen = req.params.id;
  db.query('DELETE FROM imagenes_productos WHERE id_imagen = ?', [idImagen], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al eliminar imagen', error: err });
    res.json({ success: true, affectedRows: result.affectedRows });
  });
});

// B. Registro de Usuarios 
app.post('/api/registro', (req, res) => {
  const {
    tipo_documento, documento, nombre, apellido, email, password,
    telefono, direccion, numero_cuenta,
    tipo_cuenta, banco, id_rol
  } = req.body;

  if (!documento || documento.trim() === '') {
    return res.status(400).json({ success: false, message: "El documento es obligatorio" });
  }

  if (!email || email.trim() === '') {
    return res.status(400).json({ success: false, message: "El correo es obligatorio" });
  }

  const params = [
    tipo_documento, documento, nombre, apellido, email,
    password, telefono, direccion, numero_cuenta,
    tipo_cuenta, banco, id_rol || 2
  ];

  const query = 'CALL sp_RegistrarUsuarioCompleto(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Error en el procedimiento:', err);
      return res.status(500).json({ success: false, message: "Error en la base de datos" });
    }

    console.log("🚀 Enviando al procedimiento:", params);
    res.json({ success: true, data: results });
  });
});

app.get('/api/perfil/:documento', (req, res) => {
  const query = 'SELECT * FROM usuarios WHERE documento = ?';
  db.query(query, [req.params.documento], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

// --- 4.5. RUTAS DE PEDIDOS PENDIENTES ---
app.post('/api/pedidos', (req, res) => {
  const {
    cliente = {},
    items = [],
    total,
    estado = 'Pendiente'
  } = req.body;

  const documento = cliente.documento || null;
  const email = cliente.email || null;
  const totalFactura = Number(total) || 0;
  const facturaEstado = estado === 'Pagada' ? 'Pagada' : 'Pendiente';

  const insertFactura = (idCliente) => {
    const query = 'INSERT INTO facturas (id_cliente, total, estado) VALUES (?, ?, ?)';
    db.query(query, [idCliente, totalFactura, facturaEstado], (err, result) => {
      if (err) {
        console.error('❌ Error al guardar factura pendiente:', err);
        return res.status(500).json({ success: false, message: 'Error al guardar la factura', error: err });
      }

      const idFactura = result.insertId;
      const detalleValues = (items || [])
        .map((item) => {
          const idProducto = item.id_producto ?? item.idProducto ?? item.id ?? null;
          const cantidad = Number(item.cantidad ?? item.qty ?? 0);
          const precio = Number(item.precio ?? item.precio_unitario ?? 0);
          return idProducto && cantidad > 0 ? [idFactura, idProducto, cantidad, precio] : null;
        })
        .filter(Boolean);

      if (detalleValues.length === 0) {
        return res.json({ success: true, message: 'Pedido guardado como factura pendiente', id_factura: idFactura });
      }

      const detalleQuery = 'INSERT INTO detallefactura (id_factura, id_producto, cantidad, precio_unitario) VALUES ?';
      db.query(detalleQuery, [detalleValues], (err2) => {
        if (err2) {
          console.error('❌ Error al guardar detallefactura:', err2);
          return res.status(500).json({
            success: false,
            message: 'Factura creada, pero no se pudo guardar el detalle',
            id_factura: idFactura,
            error: err2
          });
        }

        res.json({ success: true, message: 'Pedido guardado en facturas y detallefactura', id_factura: idFactura });
      });
    });
  };

  if (documento || email) {
    const lookupQuery = 'SELECT id_usuario FROM usuarios WHERE documento = ? OR email = ? LIMIT 1';
    db.query(lookupQuery, [documento, email], (err, rows) => {
      if (err) {
        console.error('❌ Error al buscar cliente por documento/email:', err);
        return res.status(500).json({ success: false, message: 'Error al buscar cliente', error: err });
      }
      const idCliente = rows?.[0]?.id_usuario ?? null;
      insertFactura(idCliente);
    });
  } else {
    insertFactura(null);
  }
});

// Ejemplo de uso en tu enrutador Express
app.post('/api/ventas/pagar', async (req, res) => {
  const { id_usuario, metodo_pago, productos } = req.body;

  if (!id_usuario || !metodo_pago || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      mensaje: 'Faltan datos obligatorios: id_usuario, metodo_pago o productos'
    });
  }

  const resultado = await crearFacturaPOS(id_usuario, metodo_pago, productos);

  if (!resultado.success) {
    return res.status(500).json({
      mensaje: 'Error al procesar la venta',
      error: resultado.error
    });
  }

  // AQUÍ ENVIARÍAS EL 'resultado.jsonDocumentoElectronico' A TU PROVEEDOR TECNOLÓGICO DE LA DIAN.
  // Cuando el proveedor te devuelva el CUFE, el QR y el XML, haces un UPDATE a la tabla 'facturas_pos'.
  return res.status(201).json({
    mensaje: 'Venta registrada con éxito',
    idFactura: resultado.idFactura,
    jsonParaDian: resultado.jsonDocumentoElectronico
  });
});

app.get('/api/facturas/usuario/:idUsuario', (req, res) => {
  const idUsuario = req.params.idUsuario;
  const query = `
    SELECT f.id_factura, f.id_cliente, f.total, f.estado, u.nombre, u.apellido
    FROM facturas f
    LEFT JOIN usuarios u ON f.id_cliente = u.id_usuario
    WHERE f.id_cliente = ?
    ORDER BY f.id_factura DESC
  `;

  db.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener facturas por usuario:', err);
      return res.status(500).json({ success: false, message: 'Error al consultar facturas', error: err });
    }

    res.json(results);
  });
});

// Uso interno por ID (para procesos del sistema)
app.get('/api/usuario-interno/:id', (req, res) => {
  const query = 'SELECT * FROM usuarios WHERE id_usuario = ?';
  db.query(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

// --- 4. RUTAS DE AUTENTICACIÓN ---

// A. Recuperación de Contraseña (CORREGIDO: Cerrando correctamente el query antes de pasar al correo)
app.post('/api/enviar-recuperacion', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Falta el correo' });

const query = 'SELECT nombre FROM usuarios WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Error interno" });
        if (results.length === 0) return res.status(404).json({ success: false, message: "Este correo no está registrado." });

        // Aquí recuperamos el nombre del vecino
        const nombreUsuario = results[0].nombre;

        // Configuramos el correo con todo tu diseño HTML
        const mailOptions = {
            from: '"La Tienda de Mi Barrio" <laurahiginio17@gmail.com>',
            to: email,
            subject: '¡Hola vecino! Aquí tienes el enlace para tu cuenta 🔑',
            html: `
            <div style="background-color: #fdf5ef; padding: 40px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #ffe4cc;">
                <div style="background-color: #ff8c00; padding: 30px; text-align: center;">
                  <span style="font-size: 40px;">🏪</span>
                  <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">La Tienda de Mi Barrio</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                  <h2 style="color: #d35400; margin-top: 0;">¡Hola, ${nombreUsuario}! 👋</h2>
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    No te preocupes, a todos se nos olvida algo de vez en cuando. Parece que necesitas una nueva llave para entrar a la tienda.
                  </p>
                  <div style="margin: 35px 0;">
                    <a href="http://localhost:4200/restablecer-password" 
                       style="background-color: #ff8c00; color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; display: inline-block;">
                       Recuperar mi acceso
                    </a>
                  </div>
                  <p style="color: #999; font-size: 13px;">Por tu seguridad, este enlace es de un solo uso.</p>
                </div>
                <div style="background-color: #fffaf5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #d35400; font-weight: bold; margin: 0;">Nos vemos pronto en la tienda ❤️</p>
                </div>
              </div>
            </div>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return res.status(500).json({ success: false, message: 'Error al enviar el correo' });
            res.status(200).json({ success: true, message: `Correo enviado a ${nombreUsuario}` });
        });
    });
});

// B. ACTUALIZAR CONTRASEÑA 
app.put('/api/actualizar-password', (req, res) => {
    const { identificador, nuevaPassword, passwordActual } = req.body;

    if (!identificador || !nuevaPassword) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos obligatorios: identificador o nuevaPassword'
    });
  }
    
  let sql = 'UPDATE usuarios SET password = ? WHERE (email = ? OR documento = ?)';
  const params = [nuevaPassword, identificador, identificador];

  // Si el usuario viene desde el perfil y proporciona la contraseña actual,
  // añadimos la validación extra para mayor seguridad.
  if (passwordActual) {
    sql += ' AND password = ?';
    params.push(passwordActual);
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(401).json({
        success: false,
        message: 'No fue posible actualizar. Verifica tus datos o la contraseña actual.'
      });
    }

    res.json({
      success: true,
      message: 'Contraseña actualizada con éxito'
    });
  });
});

app.put('/api/actualizar-perfil-completo', (req, res) => {
    const { documento, nombre, apellido, correo, telefono, direccion, banco, tipo_cuenta, numero_cuenta } = req.body;

    const sql = `
        UPDATE usuarios 
        SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ?, banco = ?, tipo_cuenta = ?, numero_cuenta = ?
        WHERE documento = ?
    `;

    const values = [nombre, apellido, correo, telefono, direccion, banco, tipo_cuenta, numero_cuenta, documento];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Error al actualizar la base de datos" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Vecino no encontrado" });
        }
        
        console.log("✅ Perfil actualizado para el documento:", documento);
        res.json({ 
            success: true, 
            message: "¡Excelente! He actualizado tu información de contacto y cartera con éxito." 
      });
    });
});


// --- 5. RUTAS DE PRODUCTOS ---
app.get('/api/productos', (req, res) => {
    db.query('SELECT * FROM Productos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.get('/api/categorias', (req, res) => {
    db.query('SELECT * FROM categorias', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// --- 6. ENCENDIDO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en: http://localhost:${PORT}`);
    console.log(`🔗 Ruta de productos: http://localhost:${PORT}/api/productos`);
    console.log(`🔗 Ruta de categorías: http://localhost:${PORT}/api/categorias`);
});
