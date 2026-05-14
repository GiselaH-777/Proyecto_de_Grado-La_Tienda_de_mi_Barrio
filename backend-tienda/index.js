const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');

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

    // Agregamos documento, nombre y apellido a la consulta
    const query = 'SELECT id_usuario, id_rol, documento, nombre, apellido, fotoUrl FROM Usuarios WHERE email = ? AND password = ?';
    
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
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Guardamos el archivo con la fecha para que no se repitan nombres
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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

    const query = 'SELECT nombre FROM Usuarios WHERE email = ?';
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
    const { documento, nombre, correo, telefono, direccion, banco, tipo_cuenta, numero_cuenta } = req.body;

    const sql = `
        UPDATE usuarios 
        SET nombre = ?, email = ?, telefono = ?, direccion = ?, banco = ?, tipo_cuenta = ?, numero_cuenta = ?
        WHERE documento = ?
    `;

    const values = [nombre, correo, telefono, direccion, banco, tipo_cuenta, numero_cuenta, documento];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Error al actualizar la base de datos" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Vecino no encontrado" });
        }
        
        console.log("✅ Perfil actualizado para el documento:", documento);
        res.json({ success: true, message: "Información actualizada correctamente" });
    });
});


// --- 5. RUTAS DE PRODUCTOS ---
app.get('/api/productos', (req, res) => {
    db.query('SELECT * FROM Productos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// --- 6. ENCENDIDO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en: http://localhost:${PORT}`);
    console.log(`🔗 Ruta de productos: http://localhost:${PORT}/api/productos`);
});
