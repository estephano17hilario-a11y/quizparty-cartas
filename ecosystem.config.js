// Configuración de PM2 (mantiene la app encendida y la reinicia si el servidor se reinicia)
module.exports = {
  apps: [{
    name: 'quizparty',
    script: 'server.js',
    env: {
      PORT: 3200,
      // Dirección pública que llevarán los QR
      PUBLIC_URL: 'https://quizparty-cartas.vercel.app',
      ADMIN_USER: 'gianelletecprata18',
      ADMIN_PIN: 'estephano10FM20',
    },
  }],
};
