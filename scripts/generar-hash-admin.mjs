import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/generar-hash-admin.mjs "TuContraseñaSegura"');
  process.exit(1);
}

// el hash se pega a mano en la tabla admins desde el panel de supabase
const hash = bcrypt.hashSync(password, 10);
console.log('\nPegá esto en la columna password_hash de la tabla admins:\n');
console.log(hash);
console.log('');
