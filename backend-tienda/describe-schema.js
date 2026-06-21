const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'tiendabarrio',
});

db.connect(err => {
  if (err) {
    console.error('CONNECT', err);
    process.exit(1);
  }

  db.query('DESCRIBE facturas', (e, r) => {
    console.log('FACTURAS');
    console.log(e || r);

    db.query('DESCRIBE detallefactura', (e2, r2) => {
      console.log('DETALLEFACTURA');
      console.log(e2 || r2);
      db.end();
    });
  });
});
