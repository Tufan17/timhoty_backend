/**
 * Firebase Cloud Messaging - HTTP v1 API ile Test Bildirimi Gönderme
 * 
 * Bu script yeni Firebase Cloud Messaging HTTP v1 API kullanır (Legacy API yerine)
 * 
 * Kullanım:
 * 1. Firebase Console > Project Settings > Service accounts > Generate new private key
 * 2. İndirilen JSON dosyasını bu klasöre "service-account-key.json" olarak kaydedin
 * 3. FCM_TOKEN değişkenine cihaz token'ınızı yapıştırın
 * 4. Terminal'de çalıştırın: node send_notification_v1.js
 */

import fs from 'fs';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';

// Firebase Project ID (google-services.json'dan veya Firebase Console'dan)
const PROJECT_ID = 'timhoty-528c8';


// Service Account JSON dosyası yolu
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, '../../timhoty-528c8-firebase-adminsdk-fbsvc-d3663db76f.json');

// Access token cache
let cachedToken: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * OAuth2 Access Token al (cache'li)
 */
async function getAccessToken() {
  try {
    // Cache'de token var mı ve hala geçerli mi kontrol et
    const now = Date.now();
    if (cachedToken && tokenExpiryTime && now < tokenExpiryTime) {
      return cachedToken;
    }

    // Token yoksa veya expire olmuşsa yeni token al
    const auth = new GoogleAuth({
      keyFile: SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    
    if (!accessTokenResponse.token) {
      throw new Error('Access token alınamadı');
    }

    // Token'ı cache'le
    cachedToken = accessTokenResponse.token;
    
    // Expire time'ı belirle (Google OAuth2 token'ları genellikle 1 saat geçerli)
    // Güvenlik için 50 dakika sonra expire olacak şekilde ayarla (10 dakika erken)
    tokenExpiryTime = now + (50 * 60 * 1000);

    return cachedToken;
  } catch (error) {
    throw new Error(`Access token hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

/**
 * FCM HTTP v1 API kullanarak bildirim gönder
 */
async function sendNotification(token: string,title: string,body: string) {
  // Service account key dosyasını kontrol et
  if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    console.error('❌ Service Account Key dosyası bulunamadı!');
    console.error(`   Dosya yolu: ${SERVICE_ACCOUNT_KEY_PATH}`);
    console.error('\n📖 Service Account Key nasıl alınır:');
    console.error('1. Firebase Console > Project Settings > Service accounts');
    console.error('2. "Generate new private key" butonuna tıklayın');
    console.error('3. İndirilen JSON dosyasını bu klasöre "service-account-key.json" olarak kaydedin');
    process.exit(1);
  }

  try {
    // Access token al (cache'den veya yeni)
    const accessToken = await getAccessToken();

    // FCM v1 API endpoint
    const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

    // FCM v1 API message formatı
    const message = {
      message: {
        token: token, // Tek cihaz için
        notification: {
          title: title,
          body: body,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'high_importance_channel',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: title,
                body: body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        // Data payload (opsiyonel)
        data: {
          reservation_id: '12345',
          type: 'test',
        },
      },
    };

    console.log('🚀 Bildirim gönderiliyor...');
    console.log('Token:', token);
    console.log('Title:', title);
    console.log('Body:', body);
    console.log('\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Bildirim başarıyla gönderildi!');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('\n📱 Cihazınızda bildirimi kontrol edin!');
      return result;
    } else {
      const errorMessage = result.error?.message || 'Bildirim gönderilemedi';
      console.error('❌ Bildirim gönderilemedi!');
      console.error('Status:', response.status, response.statusText);
      console.error('Error:', JSON.stringify(result, null, 2));

      if (result.error) {
        console.error('\nHata Detayları:');
        console.error('- Error Code:', result.error.code);
        console.error('- Error Message:', result.error.message);
        console.error('- Error Status:', result.error.status);

        // Yaygın hatalar için açıklamalar
        if (result.error.message?.includes('NOT_FOUND')) {
          console.error('\n⚠️  Token geçersiz! Lütfen FCM_TOKEN değerini kontrol edin.');
        } else if (result.error.message?.includes('UNAUTHENTICATED')) {
          console.error('\n⚠️  Authentication hatası! Service Account Key dosyasını kontrol edin.');
        } else if (result.error.message?.includes('PERMISSION_DENIED')) {
          console.error('\n⚠️  İzin hatası! Service Account\'un gerekli izinlere sahip olduğundan emin olun.');
        }
      }

      // Hata durumunda throw et
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Hata oluştu:', error instanceof Error ? error.message : 'Bilinmeyen hata');
    console.error('\nLütfen şunları kontrol edin:');
    console.error('1. Service Account Key dosyası doğru mu?');
    console.error('2. PROJECT_ID doğru mu? (timhoty-528c8)');
    console.error('3. FCM_TOKEN doğru mu?');
    console.error('4. İnternet bağlantınız var mı?');
    console.error('5. google-auth-library paketi yüklü mü? (npm install google-auth-library)');
  }
}


export { sendNotification };

