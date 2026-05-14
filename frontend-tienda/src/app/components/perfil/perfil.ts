import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FotoService } from './../../services/foto.service';
import { PerfilService } from '../../services/perfil.service';
import { ChangeDetectorRef } from '@angular/core';
import { LoginService } from '../../services/login.service'; // Asegúrate de que la ruta sea correcta
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class Perfil implements OnInit {
  usuario: any = {};
  apellido: string = '';
  imagenPreview: string | ArrayBuffer | null = null;
  isMenuCollapsed: boolean = false; 
  editandoIdentidad: boolean = false;
  editandoContacto: boolean = false;
  editandoGestion: boolean = false;
  documentoLogueado: string = '';
  documento: string = '';
  mostrarModal: boolean = false;
  passwordActual: string = ''; 
  nuevaPassword: string = '';
  confirmarPassword: string = '';

  
  constructor(
    private fotoService: FotoService,
    private perfilService: PerfilService,
    private cd: ChangeDetectorRef,
    private loginService: LoginService,
    private router: Router


  ) {}

  ngOnInit() {
  // 1. CARGA INMEDIATA: Leemos el navegador para que la foto aparezca de una vez
  const datosLocal = localStorage.getItem('usuario');
  if (datosLocal) {
    const res = JSON.parse(datosLocal);
    
    // Usamos el operador spread (...) para unir datos sin borrar nada
    this.usuario = { ...this.usuario, ...res };
    
    // Si ya existe la URL de la foto, la activamos en la vista
    if (this.usuario.fotoUrl) {
      this.imagenPreview = this.usuario.fotoUrl;
    }
  }

  // 2. Cargamos el documento y pedimos datos frescos a la BD
  const user = JSON.parse(localStorage.getItem('usuario') || '{}');
  this.documentoLogueado = user.documento;

  if (this.documentoLogueado) {
    this.cargarDatosDesdeBD();
  }
}

  cargarDatosDesdeBD() {
  this.perfilService.getPerfil(this.documentoLogueado).subscribe({
    next: (res: any) => {
      // 2. INTEGRACIÓN SIN BORRAR: 
      // Mantenemos lo que ya tiene 'this.usuario' y le añadimos lo nuevo de 'res'
      this.usuario = { ...this.usuario, ...res };

      // Corregimos lo del Tipo de Cuenta para que coincida con el HTML
      if (this.usuario.tipo_cuenta) {
        const valor = this.usuario.tipo_cuenta.toLowerCase().trim();
        if (valor === 'ahorros') this.usuario.tipo_cuenta = 'Ahorros';
        if (valor === 'corriente') this.usuario.tipo_cuenta = 'Corriente';
      }

      // 3. ACTUALIZACIÓN DE IMAGEN:
      // Si el servidor trae la URL, la actualizamos sin borrar el resto
      if (res.fotoUrl) {
        this.imagenPreview = res.fotoUrl;
        this.usuario.fotoUrl = res.fotoUrl;
        this.documento = res.documento;
      }

      // 4. PERSISTENCIA TOTAL: Guardamos el objeto integrado en el storage
      localStorage.setItem('usuario', JSON.stringify(this.usuario));

      setTimeout(() => {
        this.cd.detectChanges();
      }, 100);
    },
    error: (err: any) => {
      console.error('Error al cargar datos desde la BD', err);
    }
  });
}

  toggleIdentidad() {
    this.editandoIdentidad = !this.editandoIdentidad;
    if (this.editandoIdentidad) {
      alert("Modo edición de IDENTIDAD activado: ya puedes modificar tus nombres.");
    }
  }

  toggleContacto() {
    this.editandoContacto = !this.editandoContacto;
    if (this.editandoContacto) {
      alert("Modo edición de CONTACTO activado: ya puedes modificar tu ubicación.");
    }
  }

  toggleGestion() {
    this.editandoGestion = !this.editandoGestion;
    if (this.editandoGestion) {
      alert("Modo edición de GESTIÓN activado: ya puedes modificar tus datos bancarios.");
    }
  }

  onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPreview = e.target.result;
      this.cd.detectChanges();
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('foto', file);
    formData.append('documento', this.documentoLogueado);

    this.fotoService.subirFotoAlServidor(formData).subscribe({
      next: (res: any) => {
        console.log('Subida exitosa', res);
        if (res && res.url) {
          this.usuario.fotoUrl = res.url;
          this.imagenPreview = res.url;

          const datosActuales = JSON.parse(localStorage.getItem('usuario') || '{}');
          const usuarioActualizado = { ...datosActuales, fotoUrl: res.url };
          localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

          setTimeout(() => {
            this.cd.detectChanges();
          }, 100);

          console.log('Foto integrada y guardada en el navegador correctamente');
        }
      },
      error: (err) => {
        console.error('Error al subir la foto', err);
      }
    });
  }
}

 get inicial(): string {
    if (this.usuario && this.usuario.nombre) {
      return this.usuario.nombre.charAt(0).toUpperCase();
    }
    return 'V'; // 'V' de Vecino por defecto si no hay nombre
  }

  validarDocumento(event: any) {
    // Solo permite números para el documento de identidad
    this.usuario.documento = event.target.value.replace(/[^0-9]/g, '');
  }

  activarCarga() {
  document.getElementById('fileInput')?.click();
}

  guardar() {
    // Sincronizamos la foto antes de guardar
    this.usuario.fotoUrl = this.imagenPreview;
    localStorage.setItem('usuario', JSON.stringify(this.usuario));
    
    alert('¡Cambios guardados con éxito, vecino!');
    // Recarga para que el Sidebar refleje los cambios inmediatamente
    window.location.reload(); 
  }

  // --- AÑADE ESTOS MÉTODOS ---
  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.nuevaPassword = ''; // Limpiamos los campos al cerrar
    this.confirmarPassword = '';
  }

  actualizarPassword() {
    // 1. Validaciones de front-end
    if (this.nuevaPassword !== this.confirmarPassword) {
      alert('Vecino, las contraseñas no coinciden. Por favor, verifica.');
      return;
    }

    if (this.nuevaPassword.length < 6) {
      alert('La seguridad es importante. Usa al menos 6 caracteres.');
      return;
    }
    
    console.log('Enviando actualización para:', this.documento);
    console.log('Actualizando clave a:', this.nuevaPassword);

    // 2. Llamada al servicio integrando ambos datos
    // Se asegura que la suscripción esté dentro del método de la clase
    this.loginService.actualizarPassword(this.documento, this.nuevaPassword, this.passwordActual).subscribe({
      next: (res: any) => {
        console.log('Respuesta del servidor:', res); 
        alert('¡Excelente! Tu contraseña ha sido actualizada. Ya puedes entrar.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error('Error al conectar:', err);
        // Si sale 404 aquí, recuerda reiniciar el backend (node index.js)
        console.log('Respuesta del servidor:', err);
        alert('No pudimos actualizar la clave. Verifica que el servidor esté encendido.');
      }
    });
  }

    actualizarDatosVecino() {
    // 1. Creamos el objeto con la estructura de tu base de datos
    const datosActualizados = {
      documento: this.usuario.documento, // Identificador vital
      correo: this.usuario.email,
      telefono: this.usuario.telefono,
      direccion: this.usuario.direccion,
      banco: this.usuario.banco,
      tipo_cuenta: this.usuario.tipo_cuenta,
      numero_cuenta: this.usuario.numero_cuenta
    };

    // 2. Llamada al servicio
    this.loginService.actualizarPerfilCompleto(datosActualizados).subscribe({
      next: (res: any) => {
        console.log('Datos actualizados en el servidor:', res);
        // Usamos un mensaje empático como acordamos
        alert('¡Excelente! He actualizado tu información de contacto y cartera con éxito.');
        
        // Actualizamos el localStorage para que el sidebar y otros componentes vean el cambio
        const usuarioActualizado = { ...this.usuario, email: this.usuario.email };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
      },
      error: (err) => {
        console.error(err);
        alert('Hubo un pequeño problema al guardar. Por favor, intenta de nuevo.');
      }
    });
  }
}
