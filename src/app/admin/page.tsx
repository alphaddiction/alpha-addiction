import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirigir por defecto al panel de control principal
  redirect('/admin/dashboard');
}
