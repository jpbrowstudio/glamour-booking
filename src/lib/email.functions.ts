import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Correos al crear una reserva: confirmación al cliente + aviso al perfil admin activo. */
export const notifyBookingCreated = createServerFn({ method: 'POST' })
  .inputValidator((data: { bookingId: string }) => {
    if (!data?.bookingId || typeof data.bookingId !== 'string') throw new Error('bookingId requerido');
    return { bookingId: data.bookingId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { sendGmail, clientEmail, ownerEmail } = await import('./email.server');

    const { data: b } = await supabaseAdmin
      .from('bookings')
      .select('name, email, phone, area_code, service_name, date, time, notes')
      .eq('id', data.bookingId)
      .maybeSingle();
    if (!b) return { sent: false, reason: 'not_found' as const };

    const booking = {
      name: b.name,
      email: b.email ?? '',
      phone: b.phone,
      areaCode: b.area_code ?? '',
      serviceName: b.service_name,
      date: b.date,
      time: b.time,
      notes: b.notes,
    };

    const results: string[] = [];
    const failed: string[] = [];
    if (booking.email) {
      const mail = clientEmail('solicitud', booking);
      try {
        await sendGmail({ to: booking.email, ...mail });
        results.push('cliente');
      } catch (e) {
        console.error('[email] cliente', e);
        failed.push('cliente');
      }
    }

    const { data: owner } = await supabaseAdmin
      .from('usuarios')
      .select('correo')
      .eq('activo', true)
      .maybeSingle();
    const destinoAdmin = owner?.correo || 'jpbrowsstudio26@gmail.com';
    try {
      await sendGmail({ to: destinoAdmin, ...ownerEmail(booking) });
      results.push('admin');
    } catch (e) {
      console.error('[email] admin', e);
      failed.push('admin');
    }

    return {
      sent: results.includes('cliente'),
      adminNotified: results.includes('admin'),
      results,
      failed,
    };
  });

/** Correo al cliente cuando la dueña acepta, cancela, reprograma o recuerda una cita. */
export const notifyBookingStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string; kind: 'confirmada' | 'cancelada' | 'reprogramada' | 'recordatorio' }) => {
    const kinds = ['confirmada', 'cancelada', 'reprogramada', 'recordatorio'] as const;
    if (!data?.bookingId || !kinds.includes(data.kind)) throw new Error('Datos inválidos');
    return { bookingId: data.bookingId, kind: data.kind };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { sendGmail, clientEmail } = await import('./email.server');

    const { data: b } = await supabaseAdmin
      .from('bookings')
      .select('name, email, phone, area_code, service_name, date, time, notes')
      .eq('id', data.bookingId)
      .maybeSingle();
    if (!b?.email) return { sent: false, reason: 'sin_correo' as const };

    const mail = clientEmail(data.kind, {
      name: b.name,
      email: b.email,
      phone: b.phone,
      areaCode: b.area_code ?? '',
      serviceName: b.service_name,
      date: b.date,
      time: b.time,
      notes: b.notes,
    });
    await sendGmail({ to: b.email, ...mail });
    return { sent: true as const };
  });
