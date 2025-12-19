import cron from 'node-cron';
import FCMTokenModel from '@/models/FCMTokenModel';
import { sendNotification } from '@/utils/pushNotification';
import knex from '@/db/knex';

// Bildirim mesajları (dil kodlarına göre)
const notificationMessages: Record<string, { title: string; body: string }> = {
	tr: {
		title: 'Bayadır yoksun Timhoty\'den!',
		body: 'Son güncellemelerden haberdar olun.',
	},
	ar: {
		title: 'لقد غبت منذ فترة طويلة عن Timhoty!',
		body: 'ابق على اطلاع بآخر التحديثات.',
	},
	en: {
		title: "You've been away from Timhoty for a while!",
		body: "Stay updated with the latest updates.",
	},
};

/**
 * FCM token'ları kontrol et ve 1 dakikadan fazla eski olanlara bildirim gönder
 */
async function sendForgetNotifications() {
	try {
		console.log('🔔 Forget notification cron job başlatıldı...');

		// 1 dakikadan fazla eski olan token'ları bul
		const oneMinuteAgo = new Date(Date.now());

		const oldTokens = await knex('fcm_token')
			.where('updated_at', '<', oneMinuteAgo)
			.whereNull('deleted_at')
			.select('id', 'token', 'language');

		console.log(`📊 ${oldTokens.length} adet eski token bulundu`);

		// Her token için bildirim gönder
		for (const tokenData of oldTokens) {
			const { token, language } = tokenData;

			// Dil kodunu normalize et (tr, ar, en)
			const normalizedLang = (language || 'tr').toLowerCase().substring(0, 2);

			// Dil mesajını al (varsayılan: Türkçe)
			const message = notificationMessages[normalizedLang] || notificationMessages['tr'];

			try {
				await sendNotification(token, message.title, message.body);
				console.log(`✅ Bildirim gönderildi - Token: ${token.substring(0, 20)}... (Dil: ${normalizedLang})`);
			} catch (error: any) {
				const errorMessage = error?.message || 'Bilinmeyen hata';
				console.error(`❌ Bildirim gönderilemedi - Token: ${token.substring(0, 20)}...`, errorMessage);

				// Eğer token geçersizse (NOT_FOUND veya UNREGISTERED), token'ı sil
				if (
					errorMessage.includes('NOT_FOUND') ||
					errorMessage.includes('UNREGISTERED') ||
					errorMessage.includes('INVALID_ARGUMENT')
				) {
					await knex('fcm_token')
						.where('token', token)
						.update({ deleted_at: new Date() });
					console.log(`🗑️  Geçersiz token silindi: ${token.substring(0, 20)}...`);
				}
			}

			// Rate limiting için kısa bir bekleme (opsiyonel)
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		console.log('✅ Forget notification cron job tamamlandı\n');
	} catch (error: any) {
		console.error('❌ Forget notification cron job hatası:', error.message);
	}
}

// Her dakika çalıştır (test için)
// cron.schedule('* * * * *', sendForgetNotifications);

// Her 5 dakikada bir çalıştır (production için önerilen)

export { sendForgetNotifications };
