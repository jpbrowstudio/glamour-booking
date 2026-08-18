import { supabase } from "@/integrations/supabase/client";

/** Tamaño máximo permitido por imagen del carrusel (límite del almacenamiento). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const CARRUSEL_BUCKET = "carrusel";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 años

export interface Servicio {
  id_servicio: number;
  nombre_s: string;
  detalle_s: string;
  precio_s: number;
  duracion_min: number;
  orden: number;
  activo: boolean;
}

export interface ImagenCarrusel {
  id_imagen: number;
  titulo: string;
  imagen_url: string;
  storage_path: string | null;
  orden: number;
  activo: boolean;
}

export interface UsuarioAdmin {
  id_usuario: number;
  nombre: string;
  telefono: string;
  correo: string;
  msn_whatsapp: string;
  activo: boolean;
}

export interface HoraDisponible {
  id_hora: number;
  hora: string;
  dia_semana: number | null;
  activo: boolean;
}

/* ---------------- SERVICIOS ---------------- */

export async function listServicios(soloActivos = false): Promise<Servicio[]> {
  let q = supabase.from("servicios").select("*").order("orden").order("id_servicio");
  if (soloActivos) q = q.eq("activo", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({ ...s, precio_s: Number(s.precio_s) })) as Servicio[];
}

export async function createServicio(s: Omit<Servicio, "id_servicio">) {
  const { error } = await supabase.from("servicios").insert(s);
  if (error) throw new Error(error.message);
}

export async function updateServicio(id: number, s: Partial<Omit<Servicio, "id_servicio">>) {
  const { error } = await supabase.from("servicios").update(s).eq("id_servicio", id);
  if (error) throw new Error(error.message);
}

export async function deleteServicio(id: number) {
  const { error } = await supabase.from("servicios").delete().eq("id_servicio", id);
  if (error) throw new Error(error.message);
}

/* ---------------- CARRUSEL ---------------- */

export async function listCarrusel(soloActivos = false): Promise<ImagenCarrusel[]> {
  let q = supabase.from("carrusel").select("*").order("orden").order("id_imagen");
  if (soloActivos) q = q.eq("activo", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ImagenCarrusel[];
}

export async function uploadImagenCarrusel(file: File, titulo: string, orden = 0) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo permitido es 5 MB.`,
    );
  }
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(CARRUSEL_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: signed, error: signErr } = await supabase.storage
    .from(CARRUSEL_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !signed) throw new Error(signErr?.message ?? "No se pudo generar el enlace.");

  const { error } = await supabase.from("carrusel").insert({
    titulo,
    imagen_url: signed.signedUrl,
    storage_path: path,
    orden,
    activo: true,
  });
  if (error) throw new Error(error.message);
}

export async function updateImagenCarrusel(
  id: number,
  data: Partial<Pick<ImagenCarrusel, "titulo" | "orden" | "activo">>,
) {
  const { error } = await supabase.from("carrusel").update(data).eq("id_imagen", id);
  if (error) throw new Error(error.message);
}

export async function deleteImagenCarrusel(img: ImagenCarrusel) {
  if (img.storage_path) {
    await supabase.storage.from(CARRUSEL_BUCKET).remove([img.storage_path]);
  }
  const { error } = await supabase.from("carrusel").delete().eq("id_imagen", img.id_imagen);
  if (error) throw new Error(error.message);
}

/* ---------------- USUARIOS ADMIN ---------------- */

export async function listUsuarios(): Promise<UsuarioAdmin[]> {
  const { data, error } = await supabase.from("usuarios").select("*").order("id_usuario");
  if (error) throw new Error(error.message);
  return (data ?? []) as UsuarioAdmin[];
}

export async function getUsuarioActivo(): Promise<UsuarioAdmin | null> {
  const { data } = await supabase.from("usuarios").select("*").eq("activo", true).maybeSingle();
  return (data as UsuarioAdmin) ?? null;
}

export async function createUsuario(u: Omit<UsuarioAdmin, "id_usuario">) {
  if (u.activo) await desactivarTodos();
  const { error } = await supabase.from("usuarios").insert(u);
  if (error) throw new Error(error.message);
}

export async function updateUsuario(id: number, u: Partial<Omit<UsuarioAdmin, "id_usuario">>) {
  if (u.activo) await desactivarTodos(id);
  const { error } = await supabase.from("usuarios").update(u).eq("id_usuario", id);
  if (error) throw new Error(error.message);
}

export async function deleteUsuario(id: number) {
  const { error } = await supabase.from("usuarios").delete().eq("id_usuario", id);
  if (error) throw new Error(error.message);
}

async function desactivarTodos(excepto?: number) {
  let q = supabase.from("usuarios").update({ activo: false }).eq("activo", true);
  if (excepto) q = q.neq("id_usuario", excepto);
  await q;
}

/* ---------------- HORAS DISPONIBLES ---------------- */

export async function listHoras(soloActivas = false): Promise<HoraDisponible[]> {
  let q = supabase.from("horas_disponibles").select("*").order("hora");
  if (soloActivas) q = q.eq("activo", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as HoraDisponible[];
}

export async function createHora(hora: string, dia_semana: number | null) {
  const { error } = await supabase.from("horas_disponibles").insert({ hora, dia_semana, activo: true });
  if (error) throw new Error(error.message);
}

export async function updateHora(id: number, data: Partial<Omit<HoraDisponible, "id_hora">>) {
  const { error } = await supabase.from("horas_disponibles").update(data).eq("id_hora", id);
  if (error) throw new Error(error.message);
}

export async function deleteHora(id: number) {
  const { error } = await supabase.from("horas_disponibles").delete().eq("id_hora", id);
  if (error) throw new Error(error.message);
}

/* ---------------- CÓDIGOS DE ÁREA ---------------- */

export const AREA_CODES = [
  { code: "+52", label: "México (+52)" },
  { code: "+503", label: "El Salvador (+503)" },
  { code: "+502", label: "Guatemala (+502)" },
  { code: "+504", label: "Honduras (+504)" },
  { code: "+505", label: "Nicaragua (+505)" },
  { code: "+506", label: "Costa Rica (+506)" },
  { code: "+507", label: "Panamá (+507)" },
  { code: "+1", label: "EE.UU. / Canadá (+1)" },
  { code: "+34", label: "España (+34)" },
  { code: "+57", label: "Colombia (+57)" },
  { code: "+51", label: "Perú (+51)" },
  { code: "+56", label: "Chile (+56)" },
  { code: "+54", label: "Argentina (+54)" },
];
